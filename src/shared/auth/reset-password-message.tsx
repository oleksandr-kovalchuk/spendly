import "server-only";

import { createTranslator } from "next-intl";
import { render, toPlainText } from "react-email";

import en from "@/i18n/messages/en.json";
import uk from "@/i18n/messages/uk.json";
import type { Locale } from "@/i18n/routing";

import { ResetPasswordEmail } from "./reset-password-email";

const MESSAGES = { en, uk } satisfies Record<Locale, unknown>;

// Built outside a page request, so the locale comes from the reset link, not the URL
export async function buildResetPasswordMessage({
  link,
  locale,
}: {
  link: string;
  locale: Locale;
}) {
  const t = createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "Emails.passwordReset",
  });
  const texts = {
    preview: t("preview"),
    heading: t("heading"),
    body: t("body"),
    action: t("action"),
    ignore: t("ignore"),
  };
  const html = await render(<ResetPasswordEmail link={link} locale={locale} texts={texts} />);

  return { subject: t("subject"), html, text: toPlainText(html) };
}
