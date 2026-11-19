import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";

import {
  categories,
  transactions,
  type CategoryType,
  type DefaultCategoryKey,
} from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

export type TransactionDto = {
  id: string;
  type: CategoryType;
  amountKopecks: number;
  occurredOn: string;
  note: string | null;
  category: { defaultKey: DefaultCategoryKey | null; name: string | null };
};

type NewTransaction = {
  categoryId: string;
  amountKopecks: number;
  occurredOn: string;
  note: string | null;
};

export type InsertResult = { isAdded: true } | { isAdded: false; error: "categoryNotFound" };

export async function insertTransaction(
  userId: string,
  input: NewTransaction,
): Promise<InsertResult> {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)));
  if (!category) return { isAdded: false, error: "categoryNotFound" };

  await db.insert(transactions).values({ userId, ...input });
  return { isAdded: true };
}

// Both ends are days (`YYYY-MM-DD`) and are included
export async function listTransactions(
  userId: string,
  range: { from: string; to: string },
): Promise<TransactionDto[]> {
  const rows = await db
    .select({
      id: transactions.id,
      type: categories.type,
      amountKopecks: transactions.amountKopecks,
      occurredOn: transactions.occurredOn,
      note: transactions.note,
      categoryDefaultKey: categories.defaultKey,
      categoryName: categories.name,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    )
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt), desc(transactions.id));

  return rows.map(({ categoryDefaultKey, categoryName, ...row }) => ({
    ...row,
    category: { defaultKey: categoryDefaultKey, name: categoryName },
  }));
}
