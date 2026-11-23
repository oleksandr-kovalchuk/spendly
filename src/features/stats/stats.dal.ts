import "server-only";

import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";

import type { DefaultCategoryKey } from "@/shared/db/app-constants";
import { requireUser } from "@/shared/auth/session";
import { categories, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

// The balance is carried over: all income minus all expenses up to the period's last day
export type PeriodTotals = {
  incomeKopecks: number;
  expenseKopecks: number;
  balanceKopecks: number;
};

export type CategorySpending = {
  categoryId: string;
  category: { defaultKey: DefaultCategoryKey | null; name: string | null };
  amountKopecks: number;
};

export type DaySpending = { day: string; amountKopecks: number };

// Inclusive `YYYY-MM-DD` days
type Range = { from: string; to: string };

function inRange(userId: string, range: Range) {
  return and(
    eq(transactions.userId, userId),
    gte(transactions.occurredOn, range.from),
    lte(transactions.occurredOn, range.to),
  );
}

// pg returns the `sum` of a bigint as a string
const sumOf = (condition: SQL) =>
  sql`coalesce(sum(${transactions.amountKopecks}) filter (where ${condition}), 0)`.mapWith(Number);

export async function getPeriodTotals(range: Range): Promise<PeriodTotals> {
  const { id: userId } = await requireUser();
  const isIncome = sql`${categories.type} = 'income'`;
  const isExpense = sql`${categories.type} = 'expense'`;
  const inPeriod = sql`${transactions.occurredOn} >= ${range.from}`;
  const [row] = await db
    .select({
      incomeKopecks: sumOf(sql`${isIncome} and ${inPeriod}`),
      expenseKopecks: sumOf(sql`${isExpense} and ${inPeriod}`),
      balanceKopecks: sql`${sumOf(isIncome)} - ${sumOf(isExpense)}`.mapWith(Number),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), lte(transactions.occurredOn, range.to)));

  return row ?? { incomeKopecks: 0, expenseKopecks: 0, balanceKopecks: 0 };
}

export async function listSpendingByCategory(range: Range): Promise<CategorySpending[]> {
  const { id: userId } = await requireUser();
  const amountKopecks = sql`sum(${transactions.amountKopecks})`.mapWith(Number);
  const rows = await db
    .select({
      categoryId: categories.id,
      defaultKey: categories.defaultKey,
      name: categories.name,
      amountKopecks,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(inRange(userId, range), eq(categories.type, "expense")))
    .groupBy(categories.id)
    .orderBy(desc(amountKopecks), categories.id);

  return rows.map(({ defaultKey, name, ...row }) => ({ ...row, category: { defaultKey, name } }));
}

export async function listSpendingByDay(range: Range): Promise<DaySpending[]> {
  const { id: userId } = await requireUser();
  const amountKopecks = sql`sum(${transactions.amountKopecks})`.mapWith(Number);

  return db
    .select({ day: transactions.occurredOn, amountKopecks })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(inRange(userId, range), eq(categories.type, "expense")))
    .groupBy(transactions.occurredOn)
    .orderBy(transactions.occurredOn);
}
