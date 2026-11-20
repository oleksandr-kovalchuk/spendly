import "server-only";

import { and, eq, inArray, isNull, ne } from "drizzle-orm";

import type { CategoryType } from "@/shared/db/app-constants";
import { categories, CATEGORY_NAME_UNIQUE_INDEX } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { defaultKeysNamed } from "./default-names";

export type InsertResult = { isSaved: true } | { isSaved: false; error: "nameTaken" };
export type RenameResult =
  | { isSaved: true }
  | { isSaved: false; error: "nameTaken" | "categoryNotFound" };

const UNIQUE_VIOLATION = "23505";
const NAME_TAKEN = { isSaved: false, error: "nameTaken" } as const;

// Drizzle wraps the driver's error, so the violation can sit in `cause`
function isNameTaken(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (
    "code" in error &&
    error.code === UNIQUE_VIOLATION &&
    "constraint" in error &&
    error.constraint === CATEGORY_NAME_UNIQUE_INDEX
  ) {
    return true;
  }
  return isNameTaken(error.cause);
}

// The unique index covers stored names; a default without one is named by its translations
async function hasDefaultNamed(
  userId: string,
  type: CategoryType,
  name: string,
  exceptId?: string,
) {
  const keys = defaultKeysNamed(name);
  if (keys.length === 0) return false;

  const found = await db.$count(
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
  input: { type: CategoryType; name: string },
): Promise<InsertResult> {
  if (await hasDefaultNamed(userId, input.type, input.name)) return NAME_TAKEN;

  try {
    await db.insert(categories).values({ userId, ...input });
  } catch (error) {
    if (isNameTaken(error)) return NAME_TAKEN;
    throw error;
  }
  return { isSaved: true };
}

// Another user's category is the same as a missing one
export async function renameCategory(
  userId: string,
  categoryId: string,
  name: string,
): Promise<RenameResult> {
  const [category] = await db
    .select({ type: categories.type })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
  if (!category) return { isSaved: false, error: "categoryNotFound" };
  if (await hasDefaultNamed(userId, category.type, name, categoryId)) return NAME_TAKEN;

  try {
    await db
      .update(categories)
      .set({ name })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
  } catch (error) {
    if (isNameTaken(error)) return NAME_TAKEN;
    throw error;
  }
  return { isSaved: true };
}
