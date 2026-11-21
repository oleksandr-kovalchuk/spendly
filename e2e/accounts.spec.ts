import { expect, test } from "@playwright/test";

import {
  expectNoViolations,
  field,
  newEmail,
  PASSWORD,
  setRandomClientIp,
  signUpAndIn,
  TEXTS,
} from "./helpers";

test.beforeEach(({ context }) => setRandomClientIp(context));

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`sign up, sign in, reload and sign out in ${locale}`, async ({ page }, testInfo) => {
    const email = newEmail(testInfo);

    await page.goto(`/${locale}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));

    await page.getByRole("link", { name: text.signUp }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-up$`));
    await expectNoViolations(page);
    await field(page, text.email).fill(email);
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signUp }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
    await expect(field(page, text.email)).toHaveValue(email);
    await expectNoViolations(page);
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signIn }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.overview);
    await expect(page.getByRole("button", { name: text.signOut })).toBeVisible();
    await expectNoViolations(page);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.overview);

    await page.getByRole("button", { name: text.signOut }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
    await expect(page.getByRole("button", { name: text.signOut })).toHaveCount(0);

    await page.goto(`/${locale}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
  });

  test(`a signed-in user is sent from the sign-in page to the main page in ${locale}`, async ({
    page,
  }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);

    await page.goto(`/${locale}/sign-in`);

    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
  });

  test(`field and credential errors are shown in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/sign-in`);
    await field(page, text.email).fill("not-an-email");
    await field(page, text.password).fill("x");
    await page.getByRole("button", { name: text.signIn }).click();

    await expect(page.getByText(text.invalidEmail)).toBeVisible();
    await expectNoViolations(page);

    await field(page, text.email).fill("nobody@example.com");
    await page.getByRole("button", { name: text.signIn }).click();

    await expect(page.getByRole("alert").filter({ hasText: text.wrongCredentials })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
    await expectNoViolations(page);
  });
}

test("the signed-in main page fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "uk", testInfo);
  await expect(page.getByRole("button", { name: TEXTS.uk.signOut })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
