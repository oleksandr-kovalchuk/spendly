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
    addTransaction: "Add transaction",
    empty: "No transactions in this period.",
    amountRequired: "Enter an amount.",
    food: "Food",
    salary: "Salary",
    other: "Українська",
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
    addTransaction: "Додати транзакцію",
    empty: "У цьому періоді немає транзакцій.",
    amountRequired: "Введіть суму.",
    food: "Їжа",
    salary: "Зарплата",
    other: "English",
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
  // After a period change the new title streams in after the list
  await expect(page).toHaveTitle(/\S/);
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

// axe would read the colors of an open animation's intermediate frames
async function animationsDone(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
}

type NewTransaction = {
  amount: string;
  note?: string;
  category?: string;
  isIncome?: boolean;
  date?: string;
};

// The Add button of the bottom navigation on a phone, of the sidebar on a desktop; an empty list
// or chart has one too
function navAddButton(page: Page, locale: "en" | "uk") {
  return page.locator("header, nav").getByRole("button", { name: TEXTS[locale].addTransaction });
}

async function openAddSheet(page: Page, locale: "en" | "uk") {
  const text = TEXTS[locale];
  await navAddButton(page, locale).click();
  const sheet = page.getByRole("dialog", { name: text.addTransaction });
  await expect(sheet).toBeVisible();
  return sheet;
}

async function addTransaction(page: Page, locale: "en" | "uk", values: NewTransaction) {
  const text = TEXTS[locale];
  const sheet = await openAddSheet(page, locale);
  // The radio itself is visually hidden: its label is what a user taps
  if (values.isIncome) {
    await sheet.locator("label").filter({ hasText: text.income }).click();
    await expect(sheet.getByLabel(text.income, { exact: true })).toBeChecked();
  }
  await field(page, text.amount).fill(values.amount);
  if (values.note !== undefined) await field(page, text.note).fill(values.note);
  if (values.category !== undefined) {
    await sheet.getByLabel(text.category, { exact: true }).selectOption({ label: values.category });
  }
  if (values.date !== undefined)
    await sheet.getByLabel(text.date, { exact: true }).fill(values.date);
  await sheet.getByRole("button", { name: text.add, exact: true }).click();
  await expect(sheet).toHaveCount(0);
}

// The whole item is the link to its edit form
function item(page: Page, note: string) {
  return page.getByRole("listitem").filter({ hasText: note });
}

async function openEditSheet(page: Page, locale: "en" | "uk", note: string) {
  await item(page, note).getByRole("link").click();
  await expect(page).toHaveURL(/[?&]edit=/);
  const sheet = page.getByRole("dialog", { name: TEXTS[locale].editHeading });
  await expect(sheet).toBeVisible();
  return sheet;
}

function addDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDay(date);
}

function money(locale: "en" | "uk", hryvnias: number) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "UAH",
    currencyDisplay: "narrowSymbol",
  }).format(hryvnias);
}

// A total's value on Overview; toHaveText collapses every kind of space, so Node's and Chromium's
// Intl output compare equal
function total(page: Page, term: string) {
  return page
    .locator("dt", { hasText: new RegExp(`^${term}$`) })
    .locator("xpath=following-sibling::dd");
}

// Another day of the same month, on the 1st or the 2nd
function otherDayOfMonth(now: Date) {
  return isoDay(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() === 1 ? 2 : 1)),
  );
}

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`an expense and an income are listed by day in ${locale}`, async ({ page }, testInfo) => {
    const now = new Date();
    const today = isoDay(now);
    const otherDay = otherDayOfMonth(now);
    const isOtherEarlier = otherDay < today;

    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    await expect(page.getByText(text.empty)).toBeVisible();
    await expectNoViolations(page);

    const sheet = await openAddSheet(page, locale);
    await expect(sheet.getByLabel(text.date, { exact: true })).toHaveValue(today);
    await expect(sheet.getByLabel(text.expense, { exact: true })).toBeChecked();
    await sheet.getByRole("button", { name: text.add, exact: true }).click();
    await expect(sheet.getByText(text.amountRequired)).toBeVisible();
    await animationsDone(page);
    await expectNoViolations(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);

    await addTransaction(page, locale, { amount: "125,50", note: "lunch", category: text.food });
    await addTransaction(page, locale, {
      amount: "3000",
      isIncome: true,
      date: otherDay,
      category: text.salary,
    });

    // Day headings hold their date; the chart's heading above the list doesn't
    const days = page.getByRole("heading", { level: 2 }).filter({ has: page.locator("time") });
    await expect(days).toHaveCount(2);
    const times = await page
      .locator("h2 time")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime")));
    expect(times).toEqual(isOtherEarlier ? [today, otherDay] : [otherDay, today]);

    const expenseRow = item(page, "lunch");
    await expect(expenseRow).toContainText(text.food);
    const incomeRow = item(page, text.salary);
    await expect(incomeRow).toContainText("+");
    await expectNoViolations(page);

    if (locale === "en") {
      await expect(expenseRow).toContainText("-₴125.50");
      await expect(incomeRow).toContainText("+₴3,000.00");

      await page.getByRole("link", { name: text.other }).click();
      await expect(page).toHaveURL(/\/uk\/transactions$/);
      const translated = item(page, "lunch");
      await expect(translated).toContainText(TEXTS.uk.food);
      await expect(translated).toContainText(/125,50\s*₴/);
      await expect(item(page, TEXTS.uk.salary)).toContainText(/3\s?000,00\s*₴/);
    }
  });
}

test("the Transactions screen with a long note fits a small screen", async ({ page }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await addTransaction(page, "en", { amount: "99", note: "a very long note ".repeat(10) });
  await expect(item(page, "a very long note")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("Add opens the form over the screen, and Escape returns focus to Add", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  const add = navAddButton(page, "en");

  const sheet = await openAddSheet(page, "en");
  await field(page, TEXTS.en.amount).fill("5");
  await page.keyboard.press("Escape");

  await expect(sheet).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS.en.overview);

  // Nothing was saved: the form opens empty again
  await add.click();
  await expect(field(page, TEXTS.en.amount)).toHaveValue("");
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`a transaction is edited and deleted in ${locale}`, async ({ page }, testInfo) => {
    const otherDay = otherDayOfMonth(new Date());

    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    await addTransaction(page, locale, { amount: "10", note: "first" });
    await addTransaction(page, locale, { amount: "20", note: "second" });

    // Edit: the amount and the date change, and the item moves to the new day
    let sheet = await openEditSheet(page, locale, "first");
    await expect(field(page, text.amount)).toHaveValue("10.00");
    await expect(field(page, text.note)).toHaveValue("first");
    await animationsDone(page);
    await expectNoViolations(page);

    await field(page, text.amount).fill("12,34");
    await sheet.getByLabel(text.date, { exact: true }).fill(otherDay);
    await sheet.getByRole("button", { name: text.save }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page).not.toHaveURL(/edit=/);

    const movedRow = item(page, "first");
    await expect(movedRow).toContainText(/12[.,]34/);
    const dayOfMoved = await movedRow
      .locator("xpath=ancestor::div[./h2][1]//time")
      .getAttribute("datetime");
    expect(dayOfMoved).toBe(otherDay);
    await expect(item(page, "second")).toBeVisible();

    // Delete: cancel keeps the transaction and its form, confirm removes it
    sheet = await openEditSheet(page, locale, "second");
    await sheet.getByRole("button", { name: text.del, exact: true }).click();
    const dialog = page.getByRole("alertdialog", { name: text.deleteTitle });
    await expect(dialog).toBeVisible();
    await animationsDone(page);
    await expectNoViolations(page);
    await dialog.getByRole("button", { name: text.cancel }).click();
    await expect(dialog).toHaveCount(0);
    await expect(sheet).toBeVisible();

    await sheet.getByRole("button", { name: text.del, exact: true }).click();
    await dialog.getByRole("button", { name: text.del, exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions$`));
    await expect(item(page, "second")).toHaveCount(0);

    // Back doesn't reopen the deleted transaction's form
    await page.goBack();
    await expect(page).not.toHaveURL(/edit=/);
    await expect(sheet).toHaveCount(0);

    // Both changes stay after a reload
    await page.reload();
    await expect(item(page, "first")).toContainText(/12[.,]34/);
    await expect(item(page, "second")).toHaveCount(0);
  });
}

test("closing the edit form keeps the period and returns focus to the item", async ({
  page,
}, testInfo) => {
  const year = String(new Date().getUTCFullYear());
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await addTransaction(page, "en", { amount: "3", note: "kept" });
  await page.getByRole("button", { name: "Year", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/transactions\?period=year$/);
  await expect(page.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(year);

  const sheet = await openEditSheet(page, "en", "kept");
  await expect(page).toHaveURL(/\?period=year&edit=/);
  await sheet.getByRole("button", { name: "Close" }).click();

  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/transactions\?period=year$/);
  await expect(item(page, "kept").getByRole("link")).toBeFocused();
  await expect(page.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(year);
});

test("another user's transaction opens the 404 page", async ({ page, browser }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await addTransaction(page, "en", { amount: "5", note: "private" });
  await openEditSheet(page, "en", "private");
  const editUrl = page.url();

  const other = await browser.newContext({ timezoneId: "UTC" });
  const otherPage = await other.newPage();
  await signUpAndIn(otherPage, "en", testInfo);
  await otherPage.goto(editUrl);

  // With Cache Components the shell streams first with a 200, so the 404 page and its noindex meta are checked instead of the status.
  await expect(otherPage.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(otherPage.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(otherPage.getByRole("dialog")).toHaveCount(0);
  await other.close();
});

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
    await addTransaction(page, locale, { amount: "10", note: "this-week", date: monday });
    await addTransaction(page, locale, { amount: "10", note: "last-week", date: sunday });

    await page.getByRole("button", { name: text.week, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions\\?period=week$`));
    await expect(item(page, "this-week")).toBeVisible();
    await expect(item(page, "last-week")).toHaveCount(0);
    await expect(page.getByRole("button", { name: text.thisWeek })).toBeDisabled();
    const thisWeekLabel = await periodLabel.textContent();
    await expectNoViolations(page);

    await page.getByRole("button", { name: text.previousWeek }).click();
    await expect(page).toHaveURL(new RegExp(`\\?period=week&date=${addDays(monday, -7)}$`));
    await expect(periodLabel).not.toHaveText(thisWeekLabel ?? "");
    await expect(item(page, "last-week")).toBeVisible();
    await expect(item(page, "this-week")).toHaveCount(0);
    const lastWeekLabel = (await periodLabel.textContent()) ?? "";

    // The same week opens from the URL in a new tab
    const shared = await page.context().newPage();
    await shared.goto(page.url());
    await expect(shared.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(
      lastWeekLabel,
    );
    await expect(item(shared, "last-week")).toBeVisible();
    await expect(item(shared, "this-week")).toHaveCount(0);
    await shared.close();

    await page.getByRole("button", { name: text.nextWeek }).click();
    await expect(periodLabel).toHaveText(thisWeekLabel ?? "");
    await expect(item(page, "this-week")).toBeVisible();
    await expect(item(page, "last-week")).toHaveCount(0);
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

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`totals and the chart follow add, edit and delete in ${locale}`, async ({
    page,
  }, testInfo) => {
    const expectTotals = async (income: number, expenses: number) => {
      await expect(total(page, text.incomeTotal)).toHaveText(money(locale, income));
      await expect(total(page, text.expensesTotal)).toHaveText(money(locale, expenses));
      await expect(total(page, text.balance)).toHaveText(money(locale, income - expenses));
    };
    const byCategory = page.getByRole("region", { name: text.byCategory });
    const legend = page.getByRole("table", { name: text.byCategory }).locator("tbody tr");

    await signUpAndIn(page, locale, testInfo);
    await expectTotals(0, 0);
    await expect(byCategory.getByText(text.noExpenses)).toBeVisible();

    // Added from Overview: the sheet closes and the totals change on the same screen
    await addTransaction(page, locale, { amount: "300", note: "groceries", category: text.food });
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expectTotals(0, 300);
    await addTransaction(page, locale, { amount: "200", note: "bus", category: text.transport });
    await addTransaction(page, locale, {
      amount: "1000",
      note: "pay",
      isIncome: true,
      category: text.salary,
    });

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
    const sheet = await openEditSheet(page, locale, "bus");
    await expect(field(page, text.amount)).toHaveValue("200.00");
    await field(page, text.amount).fill("500");
    await sheet.getByRole("button", { name: text.save }).click();
    await expect(page).not.toHaveURL(/edit=/);
    await openScreen(page, locale, "overview");
    await expectTotals(1000, 800);
    await expect(legend.nth(0)).toContainText(text.transport);
    await expect(legend.nth(0)).toContainText(/62[.,]5\s?%/);
    await expect(legend.nth(1)).toContainText(/37[.,]5\s?%/);

    // Delete: the income goes, and the balance turns negative
    await openScreen(page, locale, "transactions");
    const paySheet = await openEditSheet(page, locale, "pay");
    await paySheet.getByRole("button", { name: text.del, exact: true }).click();
    await page
      .getByRole("alertdialog", { name: text.deleteTitle })
      .getByRole("button", { name: text.del, exact: true })
      .click();
    await expect(item(page, "pay")).toHaveCount(0);
    await openScreen(page, locale, "overview");
    // The expected balance is formatted from -800, with the locale's minus sign
    await expectTotals(0, 800);
  });
}

test("an old edit link on the home page opens the Transactions screen with its period", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await addTransaction(page, "en", { amount: "7", note: "old-link" });
  await openEditSheet(page, "en", "old-link");
  const id = new URL(page.url()).searchParams.get("edit") ?? "";
  const year = String(new Date().getUTCFullYear());

  // The redirect itself answers, before any page renders
  const response = await page.request.get(`/en?period=year&edit=${id}`, { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(`/en/transactions?period=year&edit=${id}`);

  await page.goto(`/en?period=year&edit=${id}`);
  await expect(page).toHaveURL(new RegExp(`/en/transactions\\?period=year&edit=${id}$`));
  await expect(page.getByRole("dialog", { name: TEXTS.en.editHeading })).toBeVisible();
  await expect(field(page, TEXTS.en.note)).toHaveValue("old-link");
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

type RecordedAnimation = { name: string; duration: number };

// Records the animations of every view transition once it starts
function recordViewTransitions() {
  const start = document.startViewTransition.bind(document);
  const recorded: RecordedAnimation[] = [];
  Object.assign(window, { viewTransitionAnimations: recorded });
  document.startViewTransition = (...args: Parameters<typeof start>) => {
    recorded.push({ name: "start", duration: 0 });
    const transition = start(...args);
    transition.ready.then(
      () => {
        for (const animation of document.getAnimations()) {
          if (
            animation.effect instanceof KeyframeEffect &&
            animation.effect.pseudoElement?.startsWith("::view-transition") === true
          ) {
            recorded.push({
              name: animation instanceof CSSAnimation ? animation.animationName : "",
              duration: Number(animation.effect.getComputedTiming().duration ?? 0),
            });
          }
        }
      },
      // A skipped transition has no animations; its reason shows in a failure message
      (error: unknown) => recorded.push({ name: `skipped: ${String(error)}`, duration: 0 }),
    );
    return transition;
  };
}

// Reads what recordViewTransitions recorded, and checks that an animation ran, or that nothing
// moved with reduced motion
function viewTransitions(page: Page, reducedMotion: "no-preference" | "reduce") {
  const recorded = () =>
    page.evaluate((): RecordedAnimation[] => Reflect.get(window, "viewTransitionAnimations"));

  return {
    // The recorder keeps writing to its array, so it's emptied in place
    clear: () =>
      page.evaluate(() => {
        const animations: RecordedAnimation[] = Reflect.get(window, "viewTransitionAnimations");
        animations.length = 0;
      }),
    expectAnimation: async (name: string) => {
      if (reducedMotion === "reduce") {
        // The browser may still create zero-length animations: nothing moves
        await expect.poll(async () => (await recorded()).map((a) => a.name)).not.toContain(name);
        expect((await recorded()).every(({ duration }) => duration === 0)).toBe(true);
      } else {
        await expect.poll(async () => (await recorded()).map((a) => a.name)).toContain(name);
      }
    },
  };
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`list items animate in and out with reduced motion ${reducedMotion}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(recordViewTransitions);
    await signUpAndIn(page, "en", testInfo);
    await openScreen(page, "en", "transactions");
    const transitions = viewTransitions(page, reducedMotion);

    await transitions.clear();
    await addTransaction(page, "en", { amount: "4", note: "animated" });
    await expect(item(page, "animated")).toBeVisible();
    await transitions.expectAnimation("item-in");

    const sheet = await openEditSheet(page, "en", "animated");
    await transitions.clear();
    await sheet.getByRole("button", { name: TEXTS.en.del, exact: true }).click();
    await page
      .getByRole("alertdialog", { name: TEXTS.en.deleteTitle })
      .getByRole("button", { name: TEXTS.en.del, exact: true })
      .click();
    await expect(item(page, "animated")).toHaveCount(0);
    await transitions.expectAnimation("item-out");
  });

  test(`the empty chart's Add changes the totals with reduced motion ${reducedMotion}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(recordViewTransitions);
    await signUpAndIn(page, "en", testInfo);
    const transitions = viewTransitions(page, reducedMotion);
    const spending = page.getByRole("region", { name: TEXTS.en.byCategory });
    await expect(spending.getByText(TEXTS.en.noExpenses)).toBeVisible();
    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 0));

    await transitions.clear();
    await spending.getByRole("button", { name: TEXTS.en.addTransaction }).click();
    const sheet = page.getByRole("dialog", { name: TEXTS.en.addTransaction });
    await field(page, TEXTS.en.amount).fill("300");
    await sheet.getByRole("button", { name: TEXTS.en.add, exact: true }).click();
    await expect(sheet).toHaveCount(0);

    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 300));
    await expect(total(page, TEXTS.en.balance)).toHaveText(money("en", -300));
    await transitions.expectAnimation("total-in");
    await expect(spending.getByRole("table")).toBeVisible();
    // The empty chart and its button are gone: focus moves to the screen
    await expect(page.getByRole("main")).toBeFocused();
  });
}
