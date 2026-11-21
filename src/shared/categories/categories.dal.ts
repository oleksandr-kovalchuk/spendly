import "server-only";

import { asc, eq } from "drizzle-orm";

import { requireUser } from "@/shared/auth/session";
import type { CategoryIconKey, CategoryType, DefaultCategoryKey } from "@/shared/db/app-constants";
import { categories } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { DEFAULT_CATEGORIES } from "./default-categories";

export type CategoryDto = {
  id: string;
  type: CategoryType;
  defaultKey: DefaultCategoryKey | null;
  name: string | null;
  icon: CategoryIconKey | null;
};

// Defaults keep their listed order, then the user's own categories in creation order
function defaultRank({ type, defaultKey }: CategoryDto) {
  const rank = DEFAULT_CATEGORIES.findIndex(
    (category) => category.type === type && category.defaultKey === defaultKey,
  );
  return rank === -1 ? DEFAULT_CATEGORIES.length : rank;
}

// No list means the user deleted every category, so the defaults aren't created again here
export async function listCategories(): Promise<CategoryDto[]> {
  const { id: userId } = await requireUser();
  const found = await db
    .select({
      id: categories.id,
      type: categories.type,
      defaultKey: categories.defaultKey,
      name: categories.name,
      icon: categories.icon,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt), asc(categories.id));

  return found.toSorted((a, b) => defaultRank(a) - defaultRank(b));
}
