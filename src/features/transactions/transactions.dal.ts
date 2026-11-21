import "server-only";

import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";

import type { CategoryIconKey, CategoryType, DefaultCategoryKey } from "@/shared/db/app-constants";
import { requireUser } from "@/shared/auth/session";
import { categories, TRANSACTION_CATEGORY_FOREIGN_KEY, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";
import { violatesConstraint } from "@/shared/db/constraint-error";

export type TransactionDto = {
  id: string;
  type: CategoryType;
  amountKopecks: number;
  occurredOn: string;
  note: string | null;
  categoryId: string;
  category: {
    defaultKey: DefaultCategoryKey | null;
    name: string | null;
    icon: CategoryIconKey | null;
  };
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

// The foreign key refuses a category that is missing or another user's, even one deleted meanwhile
function isCategoryRefused(error: unknown) {
  return violatesConstraint(error, TRANSACTION_CATEGORY_FOREIGN_KEY);
}

export async function insertTransaction(
  userId: string,
  input: NewTransaction,
): Promise<InsertResult> {
  try {
    await db.insert(transactions).values({ userId, ...input });
  } catch (error) {
    if (isCategoryRefused(error)) return { isAdded: false, error: "categoryNotFound" };
    throw error;
  }
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
  categoryIcon: categories.icon,
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
  categoryIcon,
  ...row
}: Awaited<ReturnType<typeof selectTransactions>>[number]): TransactionDto {
  return {
    ...row,
    category: { defaultKey: categoryDefaultKey, name: categoryName, icon: categoryIcon },
  };
}

// Both ends are days (`YYYY-MM-DD`) and are included; a limit keeps only the newest ones
export async function listTransactions(
  range: { from: string; to: string },
  limit?: number,
): Promise<TransactionDto[]> {
  const { id: userId } = await requireUser();
  const query = selectTransactions(
    and(
      eq(transactions.userId, userId),
      gte(transactions.occurredOn, range.from),
      lte(transactions.occurredOn, range.to),
    ),
  );
  const rows = limit === undefined ? await query : await query.limit(limit);

  return rows.map(toDto);
}

// Another user's transaction is the same as a missing one
export async function findTransaction(transactionId: string): Promise<TransactionDto | undefined> {
  const { id: userId } = await requireUser();
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
  try {
    const updated = await db
      .update(transactions)
      .set(input)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });
    if (updated.length === 0) return { isUpdated: false, error: "transactionNotFound" };
  } catch (error) {
    if (isCategoryRefused(error)) return { isUpdated: false, error: "categoryNotFound" };
    throw error;
  }
  return { isUpdated: true };
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });

  return { isDeleted: deleted.length > 0 };
}
