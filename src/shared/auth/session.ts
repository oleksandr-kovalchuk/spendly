import "server-only";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "./auth";

export type CurrentUser = { id: string; email: string };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return { id: session.user.id, email: session.user.email };
});

// Not for Server Actions, where getLocale throws: they get the user from authedAction
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${await getLocale()}/sign-in`);

  return user;
}
