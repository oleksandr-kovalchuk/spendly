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
    empty: "No transactions in this period.",
    amountRequired: "Enter an amount.",
    food: "Food",
    salary: "Salary",
    other: "Українська",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    del: "Delete",
    editHeading: "Edit transaction",
    deleteTitle: "Delete this transaction?",
    week: "Week",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    thisWeek: "This week",
    transport: "Transport",
    incomeTotal: "Income",
    expensesTotal: "Expenses",
    balance: "Balance",
    byCategory: "Spending by category",
    noExpenses: "No expenses in this period.",
    light: "Light",
    dark: "Dark",
    overview: "Overview",
    transactions: "Transactions",
    previousMonth: "Previous month",
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
    empty: "У цьому періоді немає транзакцій.",
    amountRequired: "Введіть суму.",
    food: "Їжа",
    salary: "Зарплата",
    other: "English",
    edit: "Редагувати",
    save: "Зберегти",
    cancel: "Скасувати",
    del: "Видалити",
    editHeading: "Редагувати транзакцію",
    deleteTitle: "Видалити цю транзакцію?",
    week: "Тиждень",
    previousWeek: "Попередній тиждень",
    nextWeek: "Наступний тиждень",
    thisWeek: "Цей тиждень",
    transport: "Транспорт",
    incomeTotal: "Дохід",
    expensesTotal: "Витрати",
    balance: "Баланс",
    byCategory: "Витрати за категоріями",
    noExpenses: "У цьому періоді немає витрат.",
    light: "Світла",
    dark: "Темна",
    overview: "Огляд",
    transactions: "Транзакції",
    previousMonth: "Попередній місяць",
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

// The bottom navigation on a phone, the sidebar on a desktop: only one of them is displayed
async function openScreen(page: Page, locale: "en" | "uk", screen: "overview" | "transactions") {
  await page.getByRole("link", { name: TEXTS[locale][screen], exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}${screen === "transactions" ? "/transactions" : ""}(\\?|$)`),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS[locale][screen]);
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
    await openScreen(page, locale, "transactions");
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

    // Day headings hold their date; the chart's heading above the list doesn't
    const days = page.getByRole("heading", { level: 2 }).filter({ has: page.locator("time") });
    await expect(days).toHaveCount(2);
    const times = await page
      .locator("h2 time")
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
      await expect(page).toHaveURL(/\/uk\/transactions$/);
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
  await openScreen(page, "en", "transactions");
  await field(page, TEXTS.en.amount).fill("99");
  await field(page, TEXTS.en.note).fill("a very long note ".repeat(10));
  await page.getByRole("button", { name: TEXTS.en.add }).click();
  await expect(page.getByText(TEXTS.en.added)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`a transaction is edited and deleted in ${locale}`, async ({ page }, testInfo) => {
    const now = new Date();
    // Another day of the same month, on the 1st or the 2nd
    const otherDay = isoDay(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() === 1 ? 2 : 1)),
    );

    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    for (const [amount, note] of [
      ["10", "first"],
      ["20", "second"],
    ] as const) {
      await field(page, text.amount).fill(amount);
      await field(page, text.note).fill(note);
      await page.getByRole("button", { name: text.add, exact: true }).click();
      await expect(page.getByRole("listitem").filter({ hasText: note })).toBeVisible();
    }

    // Edit: the amount and the date change, and the item moves to the new day
    const first = page.getByRole("listitem").filter({ hasText: "first" });
    await first.getByRole("link", { name: new RegExp(`^${text.edit}`) }).click();
    await expect(page).toHaveURL(/\?edit=/);
    await expect(page.getByRole("heading", { name: text.editHeading })).toBeVisible();
    await expect(field(page, text.amount)).toHaveValue("10.00");
    await expect(field(page, text.note)).toHaveValue("first");
    await expectNoViolations(page);

    await field(page, text.amount).fill("12,34");
    await page.getByLabel(text.date, { exact: true }).fill(otherDay);
    await page.getByRole("button", { name: text.save }).click();
    await expect(page).not.toHaveURL(/\?edit=/);
    await expect(page.getByRole("heading", { name: text.editHeading })).toHaveCount(0);

    const movedRow = page.getByRole("listitem").filter({ hasText: "first" });
    await expect(movedRow).toContainText(/12[.,]34/);
    const dayOfMoved = await movedRow
      .locator("xpath=ancestor::div[./h2][1]//time")
      .getAttribute("datetime");
    expect(dayOfMoved).toBe(otherDay);
    await expect(page.getByRole("listitem").filter({ hasText: "second" })).toBeVisible();

    // Delete: cancel keeps the item, confirm removes it
    const second = page.getByRole("listitem").filter({ hasText: "second" });
    await second.getByRole("button", { name: new RegExp(`^${text.del}`) }).click();
    const dialog = page.getByRole("alertdialog", { name: text.deleteTitle });
    await expect(dialog).toBeVisible();
    // axe would read the colors of the open animation's intermediate frames
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
    await expectNoViolations(page);
    await dialog.getByRole("button", { name: text.cancel }).click();
    await expect(dialog).toHaveCount(0);
    await expect(second).toBeVisible();

    await second.getByRole("button", { name: new RegExp(`^${text.del}`) }).click();
    await page
      .getByRole("alertdialog", { name: text.deleteTitle })
      .getByRole("button", { name: text.del, exact: true })
      .click();
    await expect(second).toHaveCount(0);

    // Both changes stay after a reload
    await page.reload();
    await expect(page.getByRole("listitem").filter({ hasText: "first" })).toContainText(/12[.,]34/);
    await expect(page.getByRole("listitem").filter({ hasText: "second" })).toHaveCount(0);
  });
}

test("another user's transaction opens the 404 page", async ({ page, browser }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await field(page, TEXTS.en.amount).fill("5");
  await field(page, TEXTS.en.note).fill("private");
  await page.getByRole("button", { name: TEXTS.en.add, exact: true }).click();
  const row = page.getByRole("listitem").filter({ hasText: "private" });
  await row.getByRole("link", { name: /^Edit/ }).click();
  await expect(page).toHaveURL(/\?edit=/);
  const editUrl = page.url();

  const other = await browser.newContext({ timezoneId: "UTC" });
  const otherPage = await other.newPage();
  await signUpAndIn(otherPage, "en", testInfo);
  await otherPage.goto(editUrl);

  // With Cache Components the shell streams first with a 200, so the 404 page and its noindex meta are checked instead of the status.
  await expect(otherPage.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(otherPage.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(otherPage.getByRole("textbox", { name: TEXTS.en.amount })).toHaveCount(0);
  await other.close();
});

function addDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDay(date);
}

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`the list follows the week and a shared URL in ${locale}`, async ({ page }, testInfo) => {
    const now = new Date();
    // Monday of this week and the Sunday before it, as on 16 and 15 November 2026
    const monday = addDays(isoDay(now), -((now.getUTCDay() + 6) % 7));
    const sunday = addDays(monday, -1);
    const periodLabel = page.locator('[aria-live="polite"]').filter({ visible: true });

    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    for (const [day, note] of [
      [monday, "this-week"],
      [sunday, "last-week"],
    ] as const) {
      await field(page, text.amount).fill("10");
      await field(page, text.note).fill(note);
      await page.getByLabel(text.date, { exact: true }).fill(day);
      await page.getByRole("button", { name: text.add, exact: true }).click();
      await expect(page.getByText(text.added)).toBeVisible();
      await expect(field(page, text.amount)).toHaveValue("");
    }

    await page.getByRole("button", { name: text.week, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions\\?period=week$`));
    await expect(page.getByRole("listitem").filter({ hasText: "this-week" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "last-week" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: text.thisWeek })).toBeDisabled();
    const thisWeekLabel = await periodLabel.textContent();
    await expectNoViolations(page);

    await page.getByRole("button", { name: text.previousWeek }).click();
    await expect(page).toHaveURL(new RegExp(`\\?period=week&date=${addDays(monday, -7)}$`));
    await expect(periodLabel).not.toHaveText(thisWeekLabel ?? "");
    await expect(page.getByRole("listitem").filter({ hasText: "last-week" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "this-week" })).toHaveCount(0);
    const lastWeekLabel = (await periodLabel.textContent()) ?? "";

    // The same week opens from the URL in a new tab
    const shared = await page.context().newPage();
    await shared.goto(page.url());
    await expect(shared.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(
      lastWeekLabel,
    );
    await expect(shared.getByRole("listitem").filter({ hasText: "last-week" })).toBeVisible();
    await expect(shared.getByRole("listitem").filter({ hasText: "this-week" })).toHaveCount(0);
    await shared.close();

    await page.getByRole("button", { name: text.nextWeek }).click();
    await expect(periodLabel).toHaveText(thisWeekLabel ?? "");
    await expect(page.getByRole("listitem").filter({ hasText: "this-week" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "last-week" })).toHaveCount(0);
  });
}

test("an invalid period in the URL shows the current month", async ({ page }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await page.goto("/en?period=decade&date=2026-02-30");

  await expect(page.getByRole("button", { name: "Month", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "This month" })).toBeDisabled();
});

function money(locale: "en" | "uk", hryvnias: number) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "UAH",
    currencyDisplay: "narrowSymbol",
  }).format(hryvnias);
}

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`totals and the chart follow add, edit and delete in ${locale}`, async ({
    page,
  }, testInfo) => {
    // toHaveText collapses every kind of space, so Node's and Chromium's Intl output compare equal
    const total = (term: string) =>
      page
        .locator("dt", { hasText: new RegExp(`^${term}$`) })
        .locator("xpath=following-sibling::dd");
    const expectTotals = async (income: number, expenses: number) => {
      await expect(total(text.incomeTotal)).toHaveText(money(locale, income));
      await expect(total(text.expensesTotal)).toHaveText(money(locale, expenses));
      await expect(total(text.balance)).toHaveText(money(locale, income - expenses));
    };
    const byCategory = page
      .getByRole("heading", { level: 2, name: text.byCategory })
      .locator("xpath=..");
    const legend = page.getByRole("table", { name: text.byCategory }).locator("tbody tr");
    const add = async (category: string, amount: string, note: string) => {
      await field(page, text.amount).fill(amount);
      await field(page, text.note).fill(note);
      await page.getByLabel(text.category, { exact: true }).selectOption({ label: category });
      await page.getByRole("button", { name: text.add, exact: true }).click();
      await expect(page.getByRole("listitem").filter({ hasText: note })).toBeVisible();
    };

    await signUpAndIn(page, locale, testInfo);
    await expectTotals(0, 0);
    await expect(byCategory.getByText(text.noExpenses)).toBeVisible();

    await openScreen(page, locale, "transactions");
    await add(text.food, "300", "groceries");
    await add(text.transport, "200", "bus");
    await page.getByLabel(text.income, { exact: true }).check({ force: true });
    await add(text.salary, "1000", "pay");

    await openScreen(page, locale, "overview");
    await expectTotals(1000, 500);
    await expect(legend).toHaveCount(2);
    await expect(legend.nth(0)).toContainText(text.food);
    await expect(legend.nth(0)).toContainText(money(locale, 300).replace(/\s/g, " "));
    await expect(legend.nth(0)).toContainText(/60\s?%/);
    await expect(legend.nth(1)).toContainText(text.transport);
    await expect(legend.nth(1)).toContainText(/40\s?%/);
    // The chart loads lazily and draws a bar per category
    await expect(byCategory.locator(".recharts-bar-rectangle")).toHaveCount(2);

    for (const theme of ["light", "dark"] as const) {
      await page.getByRole("button", { name: text[theme], exact: true }).click();
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);
      await expectNoViolations(page);
    }

    // Edit: Transport grows past Food and moves to the top
    await openScreen(page, locale, "transactions");
    await page
      .getByRole("listitem")
      .filter({ hasText: "bus" })
      .getByRole("link", { name: new RegExp(`^${text.edit}`) })
      .click();
    await expect(page.getByRole("heading", { name: text.editHeading })).toBeVisible();
    await expect(field(page, text.amount)).toHaveValue("200.00");
    await field(page, text.amount).fill("500");
    await page.getByRole("button", { name: text.save }).click();
    await expect(page).not.toHaveURL(/\?edit=/);
    await openScreen(page, locale, "overview");
    await expectTotals(1000, 800);
    await expect(legend.nth(0)).toContainText(text.transport);
    await expect(legend.nth(0)).toContainText(/62[.,]5\s?%/);
    await expect(legend.nth(1)).toContainText(/37[.,]5\s?%/);

    // Delete: the income goes, and the balance turns negative
    await openScreen(page, locale, "transactions");
    await page
      .getByRole("listitem")
      .filter({ hasText: "pay" })
      .getByRole("button", { name: new RegExp(`^${text.del}`) })
      .click();
    await page
      .getByRole("alertdialog", { name: text.deleteTitle })
      .getByRole("button", { name: text.del, exact: true })
      .click();
    await expect(page.getByRole("listitem").filter({ hasText: "pay" })).toHaveCount(0);
    await openScreen(page, locale, "overview");
    // The expected balance is formatted from -800, with the locale's minus sign
    await expectTotals(0, 800);
  });
}

test("an old edit link on the home page opens the Transactions screen with its period", async ({
  page,
}, testInfo) => {
  const text = TEXTS.en;
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await field(page, text.amount).fill("7");
  await field(page, text.note).fill("old-link");
  await page.getByRole("button", { name: text.add, exact: true }).click();
  await page
    .getByRole("listitem")
    .filter({ hasText: "old-link" })
    .getByRole("link", { name: /^Edit/ })
    .click();
  await expect(page).toHaveURL(/\?edit=/);
  const id = new URL(page.url()).searchParams.get("edit") ?? "";
  const year = String(new Date().getUTCFullYear());

  // The redirect itself answers, before any page renders
  const response = await page.request.get(`/en?period=year&edit=${id}`, { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(`/en/transactions?period=year&edit=${id}`);

  await page.goto(`/en?period=year&edit=${id}`);
  await expect(page).toHaveURL(new RegExp(`/en/transactions\\?period=year&edit=${id}$`));
  await expect(page.getByRole("heading", { name: text.editHeading })).toBeVisible();
  await expect(field(page, text.note)).toHaveValue("old-link");
  await expect(page.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(year);
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`the period stays when moving between Overview and Transactions in ${locale}`, async ({
    page,
  }, testInfo) => {
    const periodLabel = page.locator('[aria-live="polite"]').filter({ visible: true });
    await signUpAndIn(page, locale, testInfo);
    const thisMonth = (await periodLabel.textContent()) ?? "";

    await page.getByRole("button", { name: text.previousMonth }).click();
    await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-01$/);
    await expect(periodLabel).not.toHaveText(thisMonth);
    const lastMonth = (await periodLabel.textContent()) ?? "";

    await openScreen(page, locale, "transactions");
    await expect(page).toHaveURL(/\/transactions\?date=\d{4}-\d{2}-01$/);
    await expect(periodLabel).toHaveText(lastMonth);

    await openScreen(page, locale, "overview");
    await expect(periodLabel).toHaveText(lastMonth);
  });
}
