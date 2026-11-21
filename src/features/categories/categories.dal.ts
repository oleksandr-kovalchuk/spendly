import "server-only";

import { and, count, eq, inArray, isNull, ne } from "drizzle-orm";

import { requireUser } from "@/shared/auth/session";
import { lockCategoryNames } from "@/shared/categories/category-names-lock";
import type { CategoryIconKey, CategoryType } from "@/shared/db/app-constants";
import { categories, CATEGORY_NAME_UNIQUE_INDEX, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";
import { violatesConstraint } from "@/shared/db/constraint-error";

import { defaultKeysNamed } from "./default-names";

export type InsertResult = { isSaved: true } | { isSaved: false; error: "nameTaken" };
export type UpdateResult =
  | { isSaved: true }
  | { isSaved: false; error: "nameTaken" | "categoryNotFound" };
export type DeleteResult =
  | { isDeleted: true }
  | { isDeleted: false; error: "categoryNotFound" | "otherHasTransactions" };

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const NAME_TAKEN = { isSaved: false, error: "nameTaken" } as const;
const SAVED = { isSaved: true } as const;

// The unique index covers stored names; a default without one is named by its translations.
// Called under lockCategoryNames, so no other write changes the answer before the commit
async function hasDefaultNamed(
  tx: Transaction,
  userId: string,
  type: CategoryType,
  name: string,
  exceptId?: string,
) {
  const keys = defaultKeysNamed(name);
  if (keys.length === 0) return false;

  const found = await tx.$count(
    categories,
    and(
      eq(categories.userId, userId),
      eq(categories.type, type),
      isNull(categories.name),
      inArray(categories.defaultKey, keys),
      exceptId === undefined ? undefined : ne(categories.id, exceptId),
    ),
  );
  return found > 0;
}

export async function insertCategory(
  userId: string,
  input: { type: CategoryType; name: string; icon: CategoryIconKey },
): Promise<InsertResult> {
  try {
    return await db.transaction(async (tx): Promise<InsertResult> => {
      await lockCategoryNames(tx, userId);
      if (await hasDefaultNamed(tx, userId, input.type, input.name)) return NAME_TAKEN;

      await tx.insert(categories).values({ userId, ...input });
      return SAVED;
    });
  } catch (error) {
    if (violatesConstraint(error, CATEGORY_NAME_UNIQUE_INDEX)) return NAME_TAKEN;
    throw error;
  }
}

function ownedBy(userId: string, categoryId: string) {
  return and(eq(categories.id, categoryId), eq(categories.userId, userId));
}

// Another user's category is the same as a missing one
export async function updateCategory(
  userId: string,
  categoryId: string,
  input: { name: string; icon?: CategoryIconKey | undefined },
): Promise<UpdateResult> {
  try {
    return await db.transaction(async (tx): Promise<UpdateResult> => {
      await lockCategoryNames(tx, userId);
      const [category] = await tx
        .select({ type: categories.type, defaultKey: categories.defaultKey })
        .from(categories)
        .where(ownedBy(userId, categoryId));
      if (!category) return { isSaved: false, error: "categoryNotFound" };
      if (await hasDefaultNamed(tx, userId, category.type, input.name, categoryId)) {
        return NAME_TAKEN;
      }

      // A default category's icon comes from its key
      const icon = category.defaultKey === null ? input.icon : undefined;
      await tx
        .update(categories)
        .set(icon === undefined ? { name: input.name } : { name: input.name, icon })
        .where(ownedBy(userId, categoryId));
      return SAVED;
    });
  } catch (error) {
    if (violatesConstraint(error, CATEGORY_NAME_UNIQUE_INDEX)) return NAME_TAKEN;
    throw error;
  }
}

// Creates the type's Other again when the user has deleted it
async function otherCategoryId(tx: Transaction, userId: string, type: CategoryType) {
  await tx.insert(categories).values({ userId, type, defaultKey: "other" }).onConflictDoNothing();
  const [other] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        eq(categories.type, type),
        eq(categories.defaultKey, "other"),
      ),
    );
  if (!other) throw new Error("The Other category was not created");
  return other.id;
}

// The category's transactions move to Other of its type; Other itself goes only when empty,
// since its transactions would have nowhere to go
export async function deleteCategory(userId: string, categoryId: string): Promise<DeleteResult> {
  return db.transaction(async (tx) => {
    // The lock holds a transaction added to this category meanwhile, which then fails
    const [category] = await tx
      .select({ type: categories.type, defaultKey: categories.defaultKey })
      .from(categories)
      .where(ownedBy(userId, categoryId))
      .for("update");
    if (!category) return { isDeleted: false, error: "categoryNotFound" } as const;

    const inCategory = and(
      eq(transactions.userId, userId),
      eq(transactions.categoryId, categoryId),
    );
    if ((await tx.$count(transactions, inCategory)) > 0) {
      if (category.defaultKey === "other") {
        return { isDeleted: false, error: "otherHasTransactions" } as const;
      }
      const otherId = await otherCategoryId(tx, userId, category.type);
      await tx.update(transactions).set({ categoryId: otherId }).where(inCategory);
    }

    await tx.delete(categories).where(ownedBy(userId, categoryId));
    return { isDeleted: true } as const;
  });
}

// Categories without transactions aren't listed
export async function countTransactionsByCategory(): Promise<Map<string, number>> {
  const { id: userId } = await requireUser();
  const rows = await db
    .select({ categoryId: transactions.categoryId, count: count() })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .groupBy(transactions.categoryId);

  return new Map(rows.map((row) => [row.categoryId, row.count]));
}
