import { expect, test } from "@playwright/test";

import {
  expectNoViolations,
  openAccountMenu,
  pickTheme,
  setRandomClientIp,
  signUpAndIn,
  TEXTS,
} from "./helpers";

test.beforeEach(({ context }) => setRandomClientIp(context));

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`settings show the theme, language and account in ${locale}`, async ({ page }, testInfo) => {
    const email = await signUpAndIn(page, locale, testInfo);

    await page.goto(`/${locale}/settings`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.settings);
    await expect(page).toHaveTitle(`${text.settings} | Spendly`);
    const main = page.getByRole("main");
    await expect(main.getByRole("group", { name: text.theme, exact: true })).toBeVisible();
    await expect(main.getByRole("group", { name: text.language, exact: true })).toBeVisible();
    await expect(main.getByText(email, { exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: text.signOut })).toBeVisible();
    for (const theme of ["dark", "light"] as const) {
      await pickTheme(page, locale, theme, main);
      await expectNoViolations(page);
    }
  });

  test(`the account panel shows the account and opens Settings in ${locale}`, async ({
    page,
  }, testInfo) => {
    const email = await signUpAndIn(page, locale, testInfo);

    const panel = await openAccountMenu(page, locale);

    await expect(panel.getByText(email, { exact: true })).toBeVisible();
    await expect(panel.getByRole("group", { name: text.theme, exact: true })).toBeVisible();
    await expect(panel.getByRole("group", { name: text.language, exact: true })).toBeVisible();
    await expect(panel.getByRole("button", { name: text.signOut })).toBeVisible();
    await expect(page.getByRole("button", { name: text.deleteAccount })).toHaveCount(0);
    for (const theme of ["dark", "light"] as const) {
      await pickTheme(page, locale, theme, panel);
      await expectNoViolations(page);
    }

    await panel.getByRole("link", { name: text.settings }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/settings$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.settings);
    await expect(panel).toHaveCount(0);
  });

  test(`settings need a session in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/settings`);

    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
  });
}

test("Escape closes the account panel and returns focus to its button", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  const panel = await openAccountMenu(page, "en");

  await page.keyboard.press("Escape");

  await expect(panel).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Account/ })).toBeFocused();
});
