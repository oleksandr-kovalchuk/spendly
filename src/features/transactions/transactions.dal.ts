import "server-only";

import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";

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
  categoryId: string;
  category: { defaultKey: DefaultCategoryKey | null; name: string | null };
};

type NewTransaction = {
  categoryId: string;
  amountKopecks: number;
  occurredOn: string;
  note: string | null;
};

export type UpdateResult =
  | { isUpdated: true }
  | { isUpdated: false; error: "categoryNotFound" | "transactionNotFound" };

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

const transactionColumns = {
  id: transactions.id,
  type: categories.type,
  amountKopecks: transactions.amountKopecks,
  occurredOn: transactions.occurredOn,
  note: transactions.note,
  categoryId: transactions.categoryId,
  categoryDefaultKey: categories.defaultKey,
  categoryName: categories.name,
};

function selectTransactions(where: SQL | undefined) {
  return db
    .select(transactionColumns)
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt), desc(transactions.id));
}

function toDto({
  categoryDefaultKey,
  categoryName,
  ...row
}: Awaited<ReturnType<typeof selectTransactions>>[number]): TransactionDto {
  return { ...row, category: { defaultKey: categoryDefaultKey, name: categoryName } };
}

// Both ends are days (`YYYY-MM-DD`) and are included
export async function listTransactions(
  userId: string,
  range: { from: string; to: string },
): Promise<TransactionDto[]> {
  const rows = await selectTransactions(
    and(
      eq(transactions.userId, userId),
      gte(transactions.occurredOn, range.from),
      lte(transactions.occurredOn, range.to),
    ),
  );

  return rows.map(toDto);
}

// Another user's transaction is the same as a missing one
export async function findTransaction(
  userId: string,
  transactionId: string,
): Promise<TransactionDto | undefined> {
  const [row] = await selectTransactions(
    and(eq(transactions.userId, userId), eq(transactions.id, transactionId)),
  );

  return row && toDto(row);
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: NewTransaction,
): Promise<UpdateResult> {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)));
  if (!category) return { isUpdated: false, error: "categoryNotFound" };

  const updated = await db
    .update(transactions)
    .set(input)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  if (updated.length === 0) return { isUpdated: false, error: "transactionNotFound" };

  return { isUpdated: true };
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });

  return { isDeleted: deleted.length > 0 };
}
