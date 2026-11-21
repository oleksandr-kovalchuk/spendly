import { expect, test, type Page } from "@playwright/test";

import { seedDataFor } from "./db";
import {
  expectNoViolations,
  notifications,
  openAccountMenu,
  setRandomClientIp,
  signUpAndIn,
  TEXTS,
  type Locale,
} from "./helpers";

// The seeded expense is dated the app's today, a day without a time zone
test.use({ timezoneId: "UTC" });

test.beforeEach(({ context }) => setRandomClientIp(context));

function money(locale: Locale, hryvnias: number) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "UAH",
    currencyDisplay: "narrowSymbol",
  }).format(hryvnias);
}

function total(page: Page, term: string) {
  return page
    .locator("dt", { hasText: new RegExp(`^${term}$`) })
    .locator("xpath=following-sibling::dd");
}

// Client-side, so Next keeps the screens visited before a reset and has to refresh them
async function openScreen(page: Page, locale: Locale, screen: "overview" | "categories") {
  await page.getByRole("link", { name: TEXTS[locale][screen], exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS[locale][screen]);
}

async function openSettings(page: Page, locale: Locale) {
  const panel = await openAccountMenu(page, locale);
  await panel.getByRole("link", { name: TEXTS[locale].settings }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS[locale].settings);
}

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`transactions are cleared and all data is reset from Settings in ${locale}`, async ({
    page,
  }, testInfo) => {
    const email = await signUpAndIn(page, locale, testInfo);
    await seedDataFor(email);
    await page.reload();
    await expect(total(page, text.balance)).toHaveText(money(locale, -123.45));

    await openSettings(page, locale);
    const dangerZone = page.getByRole("region", { name: text.dangerZone });
    await dangerZone.getByRole("button", { name: text.clearTransactions }).click();
    const clearDialog = page.getByRole("alertdialog", { name: text.clearTransactionsTitle });
    await expect(clearDialog).toBeVisible();
    await expectNoViolations(page);
    await clearDialog.getByRole("button", { name: text.clearTransactions }).click();
    await expect(clearDialog).toHaveCount(0);
    await expect(notifications(page, locale).getByText(text.transactionsCleared)).toBeVisible();
    await expect(dangerZone.getByRole("button", { name: text.clearTransactions })).toBeFocused();

    await openScreen(page, locale, "overview");
    await expect(total(page, text.balance)).toHaveText(money(locale, 0));
    await openScreen(page, locale, "categories");
    const expenses = page.getByRole("region", { name: text.expenseCategories });
    await expect(expenses.getByRole("listitem").first()).toHaveText(/^Groceries/);
    await expect(expenses.getByRole("listitem").filter({ hasText: "Coffee" })).toBeVisible();

    await openSettings(page, locale);
    await dangerZone.getByRole("button", { name: text.resetData }).click();
    const resetDialog = page.getByRole("alertdialog", { name: text.resetDataTitle });
    await expect(resetDialog).toBeVisible();
    await expectNoViolations(page);
    await resetDialog.getByRole("button", { name: text.resetDataConfirm }).click();
    await expect(resetDialog).toHaveCount(0);
    await expect(notifications(page, locale).getByText(text.dataReset)).toBeVisible();

    await openScreen(page, locale, "categories");
    await expect(expenses.getByRole("listitem").first()).toHaveText(new RegExp(`^${text.food}`));
    await expect(
      expenses.getByRole("listitem").filter({ hasText: /Groceries|Coffee/ }),
    ).toHaveCount(0);
  });
}
