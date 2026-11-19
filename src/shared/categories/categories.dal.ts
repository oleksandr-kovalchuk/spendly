import "server-only";

import { asc, eq } from "drizzle-orm";

import { categories, type CategoryType, type DefaultCategoryKey } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { createDefaultCategories, DEFAULT_CATEGORIES } from "./default-categories";

export type CategoryDto = {
  id: string;
  type: CategoryType;
  defaultKey: DefaultCategoryKey | null;
  name: string | null;
};

// Defaults keep their listed order, then the user's own categories in creation order
function defaultRank({ type, defaultKey }: CategoryDto) {
  const rank = DEFAULT_CATEGORIES.findIndex(
    (category) => category.type === type && category.defaultKey === defaultKey,
  );
  return rank === -1 ? DEFAULT_CATEGORIES.length : rank;
}

async function selectCategories(userId: string): Promise<CategoryDto[]> {
  const found = await db
    .select({
      id: categories.id,
      type: categories.type,
      defaultKey: categories.defaultKey,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt), asc(categories.id));

  return found.toSorted((a, b) => defaultRank(a) - defaultRank(b));
}

export async function listCategories(userId: string): Promise<CategoryDto[]> {
  const found = await selectCategories(userId);
  if (found.length > 0) return found;

  // Sign-up creates the defaults in a hook after the user row, so a failed hook leaves none
  await createDefaultCategories(userId);
  return selectCategories(userId);
}
