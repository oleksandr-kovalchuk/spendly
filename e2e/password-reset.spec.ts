import { expect, test, type Page } from "@playwright/test";

import { resetEmailsFor, resetTokenFor } from "./db";
import {
  expectNoViolations,
  field,
  newEmail,
  PASSWORD,
  setRandomClientIp,
  signUpAndIn,
  TEXTS,
} from "./helpers";

const NEW_PASSWORD = "a brand new password";

// Sign-up alone doesn't sign in, so the browser stays signed out
async function signUp(page: Page, email: string) {
  const response = await page.request.post("/api/auth/sign-up/email", {
    data: { email, password: PASSWORD, name: "" },
  });
  expect(response.ok()).toBe(true);
}

test.beforeEach(({ context }) => setRandomClientIp(context));

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`asking for a reset link from sign-in in ${locale}`, async ({ page }, testInfo) => {
    const email = newEmail(testInfo);
    await signUp(page, email);
    await page.goto(`/${locale}/sign-in`);

    await page.getByRole("link", { name: text.forgotPassword }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/forgot-password$`));
    await field(page, text.email).fill(email);
    await page.getByRole("button", { name: text.sendLink }).click();

    await expect(page.getByRole("status")).toContainText(email);
    await expectNoViolations(page);
    // The test server has no Resend key, so the email waits in the outbox
    await expect.poll(() => resetEmailsFor(email)).toEqual([{ locale, status: "pending" }]);

    const unknown = newEmail(testInfo);
    await field(page, text.email).fill(unknown);
    await page.getByRole("button", { name: text.sendLink }).click();
    await expect(page.getByRole("status")).toContainText(unknown);
  });
}

test("the emailed link sets a new password and signs out every device", async ({
  page,
  browser,
}, testInfo) => {
  const text = TEXTS.en;
  const email = await signUpAndIn(page, "en", testInfo);

  const other = await browser.newContext();
  await setRandomClientIp(other);
  const resetPage = await other.newPage();
  await resetPage.goto("/en/forgot-password");
  await field(resetPage, text.email).fill(email);
  await resetPage.getByRole("button", { name: text.sendLink }).click();
  await expect(resetPage.getByRole("status")).toContainText(email);
  const link = `/api/auth/reset-password/${await resetTokenFor(email)}?callbackURL=/en/reset-password`;

  await resetPage.goto(link);
  await expect(resetPage).toHaveURL(/\/en\/reset-password\?token=/);
  await expectNoViolations(resetPage);
  await field(resetPage, text.newPassword).fill(NEW_PASSWORD);
  await resetPage.getByRole("button", { name: text.savePassword }).click();

  await expect(resetPage).toHaveURL(/\/en\/sign-in\?passwordReset=1$/);
  await expect(resetPage.getByRole("status")).toHaveText(text.passwordChanged);
  await field(resetPage, text.email).fill(email);
  await field(resetPage, text.password).fill(PASSWORD);
  await resetPage.getByRole("button", { name: text.signIn }).click();
  await expect(
    resetPage.getByRole("alert").filter({ hasText: text.wrongCredentials }),
  ).toBeVisible();
  await field(resetPage, text.password).fill(NEW_PASSWORD);
  await resetPage.getByRole("button", { name: text.signIn }).click();
  await expect(resetPage).toHaveURL(/\/en$/);

  await page.reload();
  await expect(page).toHaveURL(/\/en\/sign-in$/);

  await resetPage.goto(link);
  await expect(resetPage.getByRole("alert").filter({ hasText: text.invalidLink })).toBeVisible();
  await other.close();
});
