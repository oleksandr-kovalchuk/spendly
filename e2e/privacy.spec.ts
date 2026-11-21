import { expect, test } from "@playwright/test";

import { expectNoViolations, TEXTS } from "./helpers";

const CONTACT_EMAIL = "kov280396@gmail.com";

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`the privacy policy opens signed out, with a contact email, in ${locale}`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/privacy`);

    await expect(page).toHaveURL(new RegExp(`/${locale}/privacy$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.privacy);
    await expect(page.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    await expectNoViolations(page);
  });

  test(`the footer of sign-in links to the privacy policy in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/sign-in`);
    const footer = page.getByRole("contentinfo");

    // The year is the build's, cached for a day, not the fixed E2E day (decision 0010)
    await expect(footer).toContainText(/© \d{4} Spendly/);
    await footer.getByRole("link", { name: text.privacy }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/privacy$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.privacy);
  });
}
