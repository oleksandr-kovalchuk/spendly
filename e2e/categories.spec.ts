import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const PASSWORD = "correct horse battery";

const TEXTS = {
  en: {
    signUp: "Sign up",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    categories: "Categories",
    expenses: "Expenses",
    income: "Income",
    newExpense: "New expense category",
    add: "Add",
    added: "Category added.",
    rename: "Rename",
    save: "Save",
    nameTaken: "You already have a category with this name.",
    food: "Food",
    transport: "Transport",
    salary: "Salary",
    amount: "Amount (UAH)",
    category: "Category",
    addTransaction: "Add",
  },
  uk: {
    signUp: "Зареєструватися",
    signIn: "Увійти",
    email: "Електронна пошта",
    password: "Пароль",
    categories: "Категорії",
    expenses: "Витрати",
    income: "Доходи",
    newExpense: "Нова категорія витрат",
    add: "Додати",
    added: "Категорію додано.",
    rename: "Перейменувати",
    save: "Зберегти",
    nameTaken: "У вас вже є категорія з такою назвою.",
    food: "Їжа",
    transport: "Транспорт",
    salary: "Зарплата",
    amount: "Сума (грн)",
    category: "Категорія",
    addTransaction: "Додати",
  },
} as const;

test.use({ timezoneId: "UTC" });

test.beforeEach(async ({ context }) => {
  const [a = 0, b = 0, c = 0] = crypto.getRandomValues(new Uint8Array(3));
  await context.setExtraHTTPHeaders({ "x-real-ip": `10.${a}.${b}.${c}` });
});

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function field(scope: Page | Locator, name: string) {
  return scope.getByRole("textbox", { name, exact: true });
}

async function signUpAndIn(
  page: Page,
  locale: "en" | "uk",
  testInfo: { project: { name: string }; workerIndex: number },
) {
  const text = TEXTS[locale];
  await page.goto(`/${locale}/sign-up`);
  await field(page, text.email).fill(
    `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}@example.com`,
  );
  await field(page, text.password).fill(PASSWORD);
  await page.getByRole("button", { name: text.signUp }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
  await field(page, text.password).fill(PASSWORD);
  await page.getByRole("button", { name: text.signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}$`));
}

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`categories are created and renamed in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);

    // An expense in Food before the rename
    await field(page, text.amount).fill("42");
    await page.getByLabel(text.category, { exact: true }).selectOption({ label: text.food });
    await page.getByRole("button", { name: text.addTransaction, exact: true }).click();
    await expect(page.getByRole("listitem").filter({ hasText: text.food })).toBeVisible();

    await page.getByRole("link", { name: text.categories }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/categories$`));
    await expect(page.getByRole("heading", { level: 1, name: text.categories })).toBeVisible();

    // The defaults show translated
    const expenses = page.getByRole("region", { name: text.expenses });
    const income = page.getByRole("region", { name: text.income });
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

    // The form offers the new names, and the old expense shows the new name
    await page.getByRole("link", { name: "Spendly" }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    const picker = page.getByLabel(text.category, { exact: true });
    await expect(picker.getByRole("option", { name: "Coffee" })).toHaveCount(1);
    await expect(picker.getByRole("option", { name: "Groceries" })).toHaveCount(1);
    await expect(picker.getByRole("option", { name: text.food })).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: "Groceries" })).toBeVisible();
  });
}

test("a renamed default keeps its name in the other language", async ({ page }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await page.goto("/en/categories");
  const expenses = page.getByRole("region", { name: TEXTS.en.expenses });
  await expenses.getByRole("button", { name: "Rename Food" }).click();
  await expenses.getByRole("textbox", { name: /Food/ }).fill("Groceries");
  await expenses.getByRole("button", { name: TEXTS.en.save }).click();
  await expect(expenses.getByRole("button", { name: "Rename Groceries" })).toBeVisible();

  await page.goto("/uk/categories");
  const ukExpenses = page.getByRole("region", { name: TEXTS.uk.expenses });
  await expect(ukExpenses.getByRole("listitem").first()).toHaveText(/^Groceries/);
  await expect(ukExpenses.getByRole("listitem").nth(1)).toHaveText(/^Транспорт/);
});

test("the categories page fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "uk", testInfo);
  await page.goto("/uk/categories");
  const expenses = page.getByRole("region", { name: TEXTS.uk.expenses });
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
