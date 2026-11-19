import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "correct horse battery";

const TEXTS = {
  en: {
    signUp: "Sign up",
    signIn: "Sign in",
    email: "Email",
    password: "Password",
    expense: "Expense",
    income: "Income",
    amount: "Amount (UAH)",
    category: "Category",
    date: "Date",
    note: "Note (optional)",
    add: "Add",
    added: "Transaction added.",
    empty: "No transactions this month yet. Add your first one above.",
    amountRequired: "Enter an amount.",
    food: "Food",
    salary: "Salary",
    other: "Українська",
  },
  uk: {
    signUp: "Зареєструватися",
    signIn: "Увійти",
    email: "Електронна пошта",
    password: "Пароль",
    expense: "Витрата",
    income: "Дохід",
    amount: "Сума (грн)",
    category: "Категорія",
    date: "Дата",
    note: "Примітка (необов'язково)",
    add: "Додати",
    added: "Транзакцію додано.",
    empty: "Цього місяця ще немає транзакцій. Додайте першу вище.",
    amountRequired: "Введіть суму.",
    food: "Їжа",
    salary: "Зарплата",
    other: "English",
  },
} as const;

// The browser time zone decides "today", so the test fixes it and computes dates in it
test.use({ timezoneId: "UTC" });

test.beforeEach(async ({ context }) => {
  const [a = 0, b = 0, c = 0] = crypto.getRandomValues(new Uint8Array(3));
  await context.setExtraHTTPHeaders({ "x-real-ip": `10.${a}.${b}.${c}` });
});

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

function field(page: Page, name: string) {
  return page.getByRole("textbox", { name, exact: true });
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

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`an expense and an income are listed by day in ${locale}`, async ({ page }, testInfo) => {
    const now = new Date();
    const today = isoDay(now);
    // Another day of the same month, on the 1st or the 2nd
    const otherDay = isoDay(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() === 1 ? 2 : 1)),
    );
    const isOtherEarlier = otherDay < today;

    await signUpAndIn(page, locale, testInfo);
    await expect(page.getByText(text.empty)).toBeVisible();
    await expect(page.getByLabel(text.date, { exact: true })).toHaveValue(today);
    await expectNoViolations(page);

    await page.getByRole("button", { name: text.add }).click();
    await expect(page.getByText(text.amountRequired)).toBeVisible();
    await expectNoViolations(page);

    await field(page, text.amount).fill("125,50");
    await field(page, text.note).fill("lunch");
    await page.getByLabel(text.category, { exact: true }).selectOption({ label: text.food });
    await page.getByRole("button", { name: text.add }).click();
    await expect(page.getByText(text.added)).toBeVisible();
    await expect(field(page, text.amount)).toHaveValue("");

    await page.getByLabel(text.income, { exact: true }).check({ force: true });
    await field(page, text.amount).fill("3000");
    await page.getByLabel(text.date, { exact: true }).fill(otherDay);
    await page.getByLabel(text.category, { exact: true }).selectOption({ label: text.salary });
    await page.getByRole("button", { name: text.add }).click();
    await expect(page.getByText(text.added)).toBeVisible();

    const days = page.getByRole("heading", { level: 3 });
    await expect(days).toHaveCount(2);
    const times = await page
      .locator("h3 time")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime")));
    expect(times).toEqual(isOtherEarlier ? [today, otherDay] : [otherDay, today]);

    const expenseRow = page.getByRole("listitem").filter({ hasText: "lunch" });
    await expect(expenseRow).toContainText(text.food);
    const incomeRow = page.getByRole("listitem").filter({ hasText: text.salary });
    await expect(incomeRow).toContainText("+");
    await expectNoViolations(page);

    if (locale === "en") {
      await expect(expenseRow).toContainText("-₴125.50");
      await expect(incomeRow).toContainText("+₴3,000.00");

      await page.getByRole("link", { name: text.other }).click();
      await expect(page).toHaveURL(/\/uk$/);
      const translated = page.getByRole("listitem").filter({ hasText: "lunch" });
      await expect(translated).toContainText(TEXTS.uk.food);
      await expect(translated).toContainText(/125,50\s*₴/);
      await expect(page.getByRole("listitem").filter({ hasText: TEXTS.uk.salary })).toContainText(
        /3\s?000,00\s*₴/,
      );
    }
  });
}

test("the main page with transactions fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await field(page, TEXTS.en.amount).fill("99");
  await field(page, TEXTS.en.note).fill("a very long note ".repeat(10));
  await page.getByRole("button", { name: TEXTS.en.add }).click();
  await expect(page.getByText(TEXTS.en.added)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
