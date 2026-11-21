import { expect, test } from "@playwright/test";

import { expectNoViolations, field, setRandomClientIp, signUpAndIn, TEXTS } from "./helpers";

test.use({ timezoneId: "UTC" });

test.beforeEach(({ context }) => setRandomClientIp(context));

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`categories are created and renamed in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);

    // An expense in Food before the rename
    await page.getByRole("link", { name: text.transactions, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions$`));
    // The navigation's Add: the empty list has one too
    await page.locator("header, nav").getByRole("button", { name: text.addTransaction }).click();
    const sheet = page.getByRole("dialog", { name: text.addTransaction });
    await field(page, text.amount).fill("42");
    await sheet.getByLabel(text.category, { exact: true }).selectOption({ label: text.food });
    await sheet.getByRole("button", { name: text.add, exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: text.food })).toBeVisible();

    await page.getByRole("link", { name: text.categories }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/categories$`));
    await expect(page.getByRole("heading", { level: 1, name: text.categories })).toBeVisible();

    // The defaults show translated
    const expenses = page.getByRole("region", { name: text.expenseCategories });
    const income = page.getByRole("region", { name: text.incomeCategories });
    await expect(expenses.getByRole("listitem").first()).toHaveText(new RegExp(`^${text.food}`));
    await expect(expenses.getByRole("listitem").nth(1)).toHaveText(
      new RegExp(`^${text.transport}`),
    );
    await expect(income.getByRole("listitem").first()).toHaveText(new RegExp(`^${text.salary}`));
    await expectNoViolations(page);

    // Create, then a duplicate regardless of case is a field error
    await field(expenses, text.newExpense).fill("Coffee");
    await expenses.getByRole("button", { name: text.add, exact: true }).click();
    await expect(expenses.getByText(text.added)).toBeVisible();
    await expect(expenses.getByRole("listitem").filter({ hasText: "Coffee" })).toBeVisible();

    await field(expenses, text.newExpense).fill("coffee");
    await expenses.getByRole("button", { name: text.add, exact: true }).click();
    await expect(field(expenses, text.newExpense)).toHaveAccessibleDescription(text.nameTaken);
    await expect(field(expenses, text.newExpense)).toHaveAttribute("aria-invalid", "true");
    await expect(expenses.getByRole("listitem").filter({ hasText: /coffee/i })).toHaveCount(1);
    await expectNoViolations(page);

    // Rename a default, then a duplicate on rename is a field error too
    await expenses.getByRole("button", { name: `${text.rename} ${text.food}` }).click();
    const renameField = expenses.getByRole("textbox", { name: new RegExp(text.food) });
    await expect(renameField).toBeFocused();
    await renameField.fill("coffee");
    await expenses.getByRole("button", { name: text.save }).click();
    await expect(renameField).toHaveAccessibleDescription(text.nameTaken);
    await expectNoViolations(page);

    await renameField.fill("Groceries");
    await expenses.getByRole("button", { name: text.save }).click();
    await expect(expenses.getByRole("button", { name: `${text.rename} Groceries` })).toBeFocused();
    await expect(expenses.getByRole("listitem").filter({ hasText: text.food })).toHaveCount(0);

    // The add form, opened on this screen, offers the new names
    // The navigation's Add: the empty list has one too
    await page.locator("header, nav").getByRole("button", { name: text.addTransaction }).click();
    const addSheet = page.getByRole("dialog", { name: text.addTransaction });
    const picker = addSheet.getByLabel(text.category, { exact: true });
    await expect(picker.getByRole("option", { name: "Coffee" })).toHaveCount(1);
    await expect(picker.getByRole("option", { name: "Groceries" })).toHaveCount(1);
    await expect(picker.getByRole("option", { name: text.food })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(addSheet).toHaveCount(0);

    // The old expense shows the new name
    await page.getByRole("link", { name: text.transactions, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions$`));
    await expect(page.getByRole("listitem").filter({ hasText: "Groceries" })).toBeVisible();
  });
}

test("a renamed default keeps its name in the other language", async ({ page }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await page.goto("/en/categories");
  const expenses = page.getByRole("region", { name: TEXTS.en.expenseCategories });
  await expenses.getByRole("button", { name: "Rename Food" }).click();
  await expenses.getByRole("textbox", { name: /Food/ }).fill("Groceries");
  await expenses.getByRole("button", { name: TEXTS.en.save }).click();
  await expect(expenses.getByRole("button", { name: "Rename Groceries" })).toBeVisible();

  await page.goto("/uk/categories");
  const ukExpenses = page.getByRole("region", { name: TEXTS.uk.expenseCategories });
  await expect(ukExpenses.getByRole("listitem").first()).toHaveText(/^Groceries/);
  await expect(ukExpenses.getByRole("listitem").nth(1)).toHaveText(/^Транспорт/);
});

test("the categories page fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "uk", testInfo);
  await page.goto("/uk/categories");
  const expenses = page.getByRole("region", { name: TEXTS.uk.expenseCategories });
  await field(expenses, TEXTS.uk.newExpense).fill("Дуже довга назва категорії витрат: сорок");
  await expenses.getByRole("button", { name: TEXTS.uk.add, exact: true }).click();
  await expect(expenses.getByText(TEXTS.uk.added)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the categories page needs a session", async ({ page }) => {
  await page.goto("/en/categories");
  await expect(page).toHaveURL(/\/en\/sign-in$/);
});
