import "server-only";

import { eq } from "drizzle-orm";

import { lockCategoryNames } from "@/shared/categories/category-names-lock";
import { createDefaultCategories } from "@/shared/categories/default-categories";
import { categories, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

// The balance is counted from the transactions, so it becomes zero with them
export async function deleteAllTransactions(userId: string) {
  await db.delete(transactions).where(eq(transactions.userId, userId));
}

// Recreating the defaults drops the names the user gave them and brings back deleted ones
export async function resetToDefaults(userId: string) {
  await db.transaction(async (tx) => {
    // The defaults' names come back, so a concurrent name check waits for them
    await lockCategoryNames(tx, userId);
    await tx.delete(transactions).where(eq(transactions.userId, userId));
    await tx.delete(categories).where(eq(categories.userId, userId));
    await createDefaultCategories(userId, tx);
  });
}
