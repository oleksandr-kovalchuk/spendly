import { expect, test } from "@playwright/test";

import {
  expectNoViolations,
  field,
  notifications,
  openAddSheet,
  pickCategory,
  setRandomClientIp,
  signUpAndIn,
  TEXTS,
} from "./helpers";

test.use({ timezoneId: "UTC" });

test.beforeEach(({ context }) => setRandomClientIp(context));

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`categories are created and renamed in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);

    await page.getByRole("link", { name: text.transactions, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions$`));
    const sheet = await openAddSheet(page, locale);
    await field(page, text.amount).fill("42");
    await pickCategory(sheet, text.food);
    await sheet.getByRole("button", { name: text.add, exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: text.food })).toBeVisible();

    await page.getByRole("link", { name: text.categories }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/categories$`));
    await expect(page.getByRole("heading", { level: 1, name: text.categories })).toBeVisible();

    const expenses = page.getByRole("region", { name: text.expenseCategories });
    const income = page.getByRole("region", { name: text.incomeCategories });
    await expect(expenses.getByRole("listitem").first()).toHaveText(new RegExp(`^${text.food}`));
    await expect(expenses.getByRole("listitem").nth(1)).toHaveText(
      new RegExp(`^${text.transport}`),
    );
    await expect(income.getByRole("listitem").first()).toHaveText(new RegExp(`^${text.salary}`));
    await expectNoViolations(page);

    const addButton = expenses.getByRole("button", { name: text.addExpense });
    const addCategorySheet = page.getByRole("dialog", { name: text.newExpense });
    const nameField = field(addCategorySheet, text.categoryName);
    await addButton.click();
    await expect(nameField).toBeFocused();
    await nameField.fill("Coffee");
    await addCategorySheet.getByRole("button", { name: text.add, exact: true }).click();
    await expect(addCategorySheet).toHaveCount(0);
    await expect(notifications(page, locale).getByText(text.added)).toBeVisible();
    await expect(expenses.getByRole("listitem").filter({ hasText: "Coffee" })).toBeVisible();
    await expect(addButton).toBeFocused();

    await addButton.click();
    await nameField.fill("coffee");
    await addCategorySheet.getByRole("button", { name: text.add, exact: true }).click();
    await expect(nameField).toHaveAccessibleDescription(text.nameTaken);
    await expect(nameField).toHaveAttribute("aria-invalid", "true");
    await expectNoViolations(page);
    await page.keyboard.press("Escape");
    await expect(addCategorySheet).toHaveCount(0);
    await expect(expenses.getByRole("listitem").filter({ hasText: /coffee/i })).toHaveCount(1);

    const renameName = `${text.rename} ${text.food}`;
    await expenses.getByRole("button", { name: renameName }).click();
    const renameSheet = page.getByRole("dialog", { name: renameName });
    const renameField = field(renameSheet, text.categoryName);
    await expect(renameField).toBeFocused();
    await renameField.fill("coffee");
    await renameSheet.getByRole("button", { name: text.save }).click();
    await expect(renameField).toHaveAccessibleDescription(text.nameTaken);
    await expectNoViolations(page);

    await renameField.fill("Groceries");
    await renameSheet.getByRole("button", { name: text.save }).click();
    await expect(renameSheet).toHaveCount(0);
    await expect(expenses.getByRole("button", { name: `${text.rename} Groceries` })).toBeFocused();
    await expect(expenses.getByRole("listitem").filter({ hasText: text.food })).toHaveCount(0);

    const addSheet = await openAddSheet(page, locale);
    const picker = addSheet.getByRole("radiogroup", { name: text.category, exact: true });
    await expect(picker.getByRole("radio", { name: "Coffee", exact: true })).toHaveCount(1);
    await expect(picker.getByRole("radio", { name: "Groceries", exact: true })).toHaveCount(1);
    await expect(picker.getByRole("radio", { name: text.food, exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(addSheet).toHaveCount(0);

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
  const sheet = page.getByRole("dialog", { name: "Rename Food" });
  await field(sheet, TEXTS.en.categoryName).fill("Groceries");
  await sheet.getByRole("button", { name: TEXTS.en.save }).click();
  await expect(expenses.getByRole("button", { name: "Rename Groceries" })).toBeVisible();

  await page.goto("/uk/categories");
  const ukExpenses = page.getByRole("region", { name: TEXTS.uk.expenseCategories });
  await expect(ukExpenses.getByRole("listitem").first()).toHaveText(/^Groceries/);
  await expect(ukExpenses.getByRole("listitem").nth(1)).toHaveText(/^Транспорт/);
});

test("an own category gets an icon, and deleting a category moves its transactions to Other", async ({
  page,
}, testInfo) => {
  const text = TEXTS.en;
  await signUpAndIn(page, "en", testInfo);
  await page.goto("/en/categories");
  const expenses = page.getByRole("region", { name: text.expenseCategories });

  await expenses.getByRole("button", { name: text.addExpense }).click();
  const addCategorySheet = page.getByRole("dialog", { name: text.newExpense });
  await field(addCategorySheet, text.categoryName).fill("Latte");
  await addCategorySheet
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: "Coffee", exact: true }) })
    .click();
  await expect(addCategorySheet.getByRole("radio", { name: "Coffee", exact: true })).toBeChecked();
  await addCategorySheet.getByRole("button", { name: text.add, exact: true }).click();
  await expect(notifications(page, "en").getByText(text.added)).toBeVisible();
  await expenses.getByRole("button", { name: "Edit Latte" }).click();
  const editSheet = page.getByRole("dialog", { name: "Edit Latte" });
  await expect(editSheet.getByRole("radio", { name: "Coffee", exact: true })).toBeChecked();
  await expectNoViolations(page);
  await page.keyboard.press("Escape");
  await expect(editSheet).toHaveCount(0);

  const sheet = await openAddSheet(page, "en");
  await field(page, text.amount).fill("42");
  await pickCategory(sheet, "Latte");
  await sheet.getByRole("button", { name: text.add, exact: true }).click();
  await expect(sheet).toHaveCount(0);

  await expenses.getByRole("button", { name: "Delete Latte" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete “Latte”?" });
  await expect(dialog).toHaveAccessibleDescription(
    "Its 1 transaction moves to “Other”. This can't be undone.",
  );
  await expectNoViolations(page);
  await dialog.getByRole("button", { name: text.del }).click();
  await expect(notifications(page, "en").getByText("Category deleted.")).toBeVisible();
  await expect(expenses.getByRole("listitem").filter({ hasText: "Latte" })).toHaveCount(0);
  await expect(expenses.getByRole("heading", { name: text.expenseCategories })).toBeFocused();

  await expenses.getByRole("button", { name: "Delete Other" }).click();
  const blocked = page.getByRole("alertdialog", { name: "“Other” can't be deleted" });
  await expect(blocked.getByRole("button", { name: text.del })).toHaveCount(0);
  await blocked.getByRole("button", { name: "Close" }).click();

  await page.getByRole("link", { name: text.transactions, exact: true }).click();
  await expect(page).toHaveURL(/\/en\/transactions$/);
  await expect(
    page.getByRole("listitem").filter({ hasText: "Other" }).filter({ hasText: "42" }),
  ).toBeVisible();
});

test("the categories page fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "uk", testInfo);
  await page.goto("/uk/categories");
  const expenses = page.getByRole("region", { name: TEXTS.uk.expenseCategories });
  await expenses.getByRole("button", { name: TEXTS.uk.addExpense }).click();
  const sheet = page.getByRole("dialog", { name: TEXTS.uk.newExpense });
  await field(sheet, TEXTS.uk.categoryName).fill("Дуже довга назва категорії витрат: сорок");
  await sheet.getByRole("button", { name: TEXTS.uk.add, exact: true }).click();
  await expect(notifications(page, "uk").getByText(TEXTS.uk.added)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the categories page needs a session", async ({ page }) => {
  await page.goto("/en/categories");
  await expect(page).toHaveURL(/\/en\/sign-in$/);
});
