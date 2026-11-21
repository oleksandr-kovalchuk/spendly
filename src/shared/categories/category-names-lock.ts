import "server-only";

import { sql } from "drizzle-orm";

import type { db } from "@/shared/db/client";

// A name can't repeat an unrenamed default's translation, which no index can check: every write
// that names categories takes this lock in its transaction, so each check sees the others' commits
export async function lockCategoryNames(tx: Pick<typeof db, "execute">, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`category-names:${userId}`}))`);
}
