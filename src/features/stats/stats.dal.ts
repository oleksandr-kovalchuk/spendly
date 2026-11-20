import "server-only";

import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";

import type { DefaultCategoryKey } from "@/shared/db/app-constants";
import { categories, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

export type PeriodTotals = { incomeKopecks: number; expenseKopecks: number };

export type CategorySpending = {
  categoryId: string;
  category: { defaultKey: DefaultCategoryKey | null; name: string | null };
  amountKopecks: number;
};

// Both ends are days (`YYYY-MM-DD`) and are included
type Range = { from: string; to: string };

function inRange(userId: string, range: Range) {
  return and(
    eq(transactions.userId, userId),
    gte(transactions.occurredOn, range.from),
    lte(transactions.occurredOn, range.to),
  );
}

// `sum` of a bigint is a numeric, which `pg` returns as a string; a number
// stays exact up to Number.MAX_SAFE_INTEGER kopecks, about 90 trillion hryvnias
const sumOf = (condition: SQL) =>
  sql`coalesce(sum(${transactions.amountKopecks}) filter (where ${condition}), 0)`.mapWith(Number);

export async function getPeriodTotals(userId: string, range: Range): Promise<PeriodTotals> {
  const [row] = await db
    .select({
      incomeKopecks: sumOf(sql`${categories.type} = 'income'`),
      expenseKopecks: sumOf(sql`${categories.type} = 'expense'`),
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(inRange(userId, range));

  return row ?? { incomeKopecks: 0, expenseKopecks: 0 };
}

// The period's expenses per category, largest first
export async function listSpendingByCategory(
  userId: string,
  range: Range,
): Promise<CategorySpending[]> {
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
    // The id keeps equal amounts in a stable order
    .orderBy(desc(amountKopecks), categories.id);

  return rows.map(({ defaultKey, name, ...row }) => ({ ...row, category: { defaultKey, name } }));
}
