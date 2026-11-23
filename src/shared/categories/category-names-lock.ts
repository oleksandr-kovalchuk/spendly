import "server-only";

import { sql } from "drizzle-orm";

import type { db } from "@/shared/db/client";

// No index can check names against defaults' translations: every naming write takes this lock
export async function lockCategoryNames(tx: Pick<typeof db, "execute">, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`category-names:${userId}`}))`);
}
