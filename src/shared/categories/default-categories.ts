import { db } from "@/shared/db/client";
import type { CategoryType, DefaultCategoryKey } from "@/shared/db/app-constants";
import { categories } from "@/shared/db/app-schema";

// Keep in sync with drizzle/0002_backfill_default_categories.sql
export const DEFAULT_CATEGORIES = [
  { type: "expense", defaultKey: "food" },
  { type: "expense", defaultKey: "transport" },
  { type: "expense", defaultKey: "housing" },
  { type: "expense", defaultKey: "utilities" },
  { type: "expense", defaultKey: "health" },
  { type: "expense", defaultKey: "shopping" },
  { type: "expense", defaultKey: "entertainment" },
  { type: "expense", defaultKey: "other" },
  { type: "income", defaultKey: "salary" },
  { type: "income", defaultKey: "gifts" },
  { type: "income", defaultKey: "other" },
] as const satisfies readonly { type: CategoryType; defaultKey: DefaultCategoryKey }[];

// Not `server-only`: Better Auth's hook calls it, and its CLI loads the auth config outside Next.
// A reset passes its transaction
export async function createDefaultCategories(
  userId: string,
  executor: Pick<typeof db, "insert"> = db,
) {
  await executor
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((category) => ({ userId, ...category })))
    .onConflictDoNothing();
}
