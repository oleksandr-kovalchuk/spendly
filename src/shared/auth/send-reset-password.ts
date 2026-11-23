import "server-only";

import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { sendOutboxEmail } from "@/shared/email/outbox";

import { buildResetPasswordMessage } from "./reset-password-message";

const MAX_RESET_EMAILS_PER_HOUR = 3;

// The link's callbackURL is the reset page the form asked for, such as /uk/reset-password
function localeOf(url: string) {
  const callbackURL = new URL(url).searchParams.get("callbackURL") ?? "";
  const [locale] = callbackURL.split("/").filter(Boolean);
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

// In the background, so timing can't reveal accounts; a Google-only account gets a first password
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
