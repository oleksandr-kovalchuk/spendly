import { expect, test } from "@playwright/test";

import {
  expectNoViolations,
  field,
  newEmail,
  openAccountMenu,
  PASSWORD,
  setRandomClientIp,
  signUpAndIn,
  TEXTS,
} from "./helpers";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

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
    await openAccountMenu(page, locale);
    await expect(page.getByRole("button", { name: text.signOut })).toBeVisible();
    await expectNoViolations(page);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.overview);

    await openAccountMenu(page, locale);
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

  test(`Google sign-in opens Google's page from sign-in and sign-up in ${locale}`, async ({
    page,
    baseURL,
  }) => {
    // Google's page itself isn't loaded: the test checks where the browser is sent
    await page.route(`${GOOGLE_AUTH_URL}**`, (route) => route.fulfill({ body: "Google" }));

    for (const path of ["sign-in", "sign-up"]) {
      await page.goto(`/${locale}/${path}`);
      const googleRequest = page.waitForRequest((request) =>
        request.url().startsWith(GOOGLE_AUTH_URL),
      );
      await page.getByRole("button", { name: text.continueWithGoogle }).click();

      const google = new URL((await googleRequest).url());
      expect(google.searchParams.get("redirect_uri")).toBe(`${baseURL}/api/auth/callback/google`);
    }
  });

  test(`delete the account with its password in ${locale}`, async ({ page }, testInfo) => {
    const email = await signUpAndIn(page, locale, testInfo);

    await page.goto(`/${locale}/settings`);
    const dangerZone = page.getByRole("region", { name: text.dangerZone });
    await dangerZone.getByRole("button", { name: text.deleteAccount }).click();
    const dialog = page.getByRole("alertdialog", { name: text.deleteAccountTitle });
    await expect(dialog).toBeVisible();
    await expectNoViolations(page);

    await field(dialog, text.password).fill("wrong password");
    await dialog.getByRole("button", { name: text.deleteAccount }).click();
    await expect(dialog.getByText(text.passwordIncorrect)).toBeVisible();

    await field(dialog, text.password).fill(PASSWORD);
    await dialog.getByRole("button", { name: text.deleteAccount }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?accountDeleted=1$`));
    await expect(page.getByRole("status")).toHaveText(text.accountDeleted);
    await expectNoViolations(page);

    await field(page, text.email).fill(email);
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signIn }).click();
    await expect(page.getByRole("alert").filter({ hasText: text.wrongCredentials })).toBeVisible();
  });

  test(`a Google account that isn't linked shows why on sign-in in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/sign-in?error=account_not_linked`);

    await expect(page.getByRole("alert").filter({ hasText: text.accountNotLinked })).toBeVisible();
    await expectNoViolations(page);
  });
}

test("the signed-in main page fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "uk", testInfo);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS.uk.overview);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
