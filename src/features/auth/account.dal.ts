import "server-only";

import { and, eq } from "drizzle-orm";
import { cache } from "react";

import { requireUser } from "@/shared/auth/session";
import { account } from "@/shared/db/auth-schema";
import { db } from "@/shared/db/client";

const CREDENTIAL_PROVIDER = "credential";

// Cached: the phone's and the desktop's top bars both ask
export const hasPassword = cache(async () => {
  const { id: userId } = await requireUser();
  const rows = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, CREDENTIAL_PROVIDER)))
    .limit(1);

  return rows.length > 0;
});
