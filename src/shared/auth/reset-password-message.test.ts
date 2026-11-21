import { expect, test } from "vitest";

import { buildResetPasswordMessage } from "./reset-password-message";

const LINK =
  "http://localhost:3000/api/auth/reset-password/token123?callbackURL=%2Fen%2Freset-password";

test.each([
  ["en", "Reset your Spendly password", "It works for one hour."],
  ["uk", "Скидання пароля в Spendly", "Воно діє одну годину."],
] as const)(
  "in %s, the email is translated and links to the reset page",
  async (locale, subject, lifetime) => {
    const message = await buildResetPasswordMessage({ link: LINK, locale });

    expect(message.subject).toBe(subject);
    // Every element with a language, not only <html>, is in the email's language
    expect(
      message.html.match(/ lang="[a-z]+"/g)?.every((lang) => lang === ` lang="${locale}"`),
    ).toBe(true);
    expect(message.html).toContain(`href="${LINK}"`);
    expect(message.text).toContain(LINK);
    expect(message.text).toContain(lifetime);
  },
);
