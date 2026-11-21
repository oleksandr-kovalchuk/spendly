import "server-only";

import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { sendOutboxEmail } from "@/shared/email/outbox";

import { buildResetPasswordMessage } from "./reset-password-message";

const MAX_RESET_EMAILS_PER_HOUR = 3;

// The link carries the reset page the form asked for, such as /uk/reset-password
function localeOf(url: string) {
  const callbackURL = new URL(url).searchParams.get("callbackURL") ?? "";
  const [locale] = callbackURL.split("/").filter(Boolean);
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

// Better Auth's sendResetPassword, run in the background so its work can't reveal which emails
// have an account. For an account that signs in only with Google, the reset adds its first password.
export async function sendResetPasswordEmail({
  user,
  url,
}: {
  user: { id: string; email: string };
  url: string;
}) {
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
