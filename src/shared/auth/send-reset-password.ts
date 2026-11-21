import "server-only";

import { and, eq } from "drizzle-orm";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { db } from "@/shared/db/client";
import { account } from "@/shared/db/auth-schema";
import { sendOutboxEmail } from "@/shared/email/outbox";

import { buildResetPasswordMessage } from "./reset-password-message";

const MAX_RESET_EMAILS_PER_HOUR = 3;

async function hasPassword(userId: string) {
  const rows = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);
  return rows.length > 0;
}

// The link carries the reset page the form asked for, such as /uk/reset-password
function localeOf(url: string) {
  const callbackURL = new URL(url).searchParams.get("callbackURL") ?? "";
  const [locale] = callbackURL.split("/").filter(Boolean);
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

// Better Auth's sendResetPassword, run in the background so its work can't reveal which emails
// have an account
export async function sendResetPasswordEmail({
  user,
  url,
}: {
  user: { id: string; email: string };
  url: string;
}) {
  // A reset would create a password for an account that signs in only with Google
  if (!(await hasPassword(user.id))) return;

  const locale = localeOf(url);
  const message = await buildResetPasswordMessage({ link: url, locale });
  await sendOutboxEmail({
    userId: user.id,
    kind: "password_reset",
    locale,
    message: { to: user.email, ...message },
    maxPerHour: MAX_RESET_EMAILS_PER_HOUR,
  });
}
