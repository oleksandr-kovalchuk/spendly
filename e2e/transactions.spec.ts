import { expect, test, type Page } from "@playwright/test";

import {
  dateButton,
  expectNoViolations,
  field,
  navAddButton,
  notifications,
  openAccountMenu,
  openAddSheet,
  openPeriodMenu,
  pickAppTheme,
  pickCategory,
  pickDate,
  recordViewTransitions,
  setRandomClientIp,
  shownDay,
  signUpAndIn,
  TEXTS,
  type Locale,
  viewTransitions,
  waitForAnimations,
} from "./helpers";
import { TODAY } from "./today";

test.use({ timezoneId: "UTC" });

test.beforeEach(({ context }) => setRandomClientIp(context));

async function openScreen(page: Page, locale: Locale, screen: "overview" | "transactions") {
  await page.getByRole("link", { name: TEXTS[locale][screen], exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}${screen === "transactions" ? "/transactions" : ""}(\\?|$)`),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS[locale][screen]);
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

type NewTransaction = {
  amount: string;
  note?: string;
  category?: string;
  isIncome?: boolean;
  date?: string;
};

async function addTransaction(page: Page, locale: Locale, values: NewTransaction) {
  const text = TEXTS[locale];
  const sheet = await openAddSheet(page, locale, { type: values.isIncome ? "income" : "expense" });
  await field(page, text.amount).fill(values.amount);
  if (values.note !== undefined) await field(page, text.note).fill(values.note);
  if (values.category !== undefined) {
    await pickCategory(sheet, values.category);
  }
  if (values.date !== undefined)
    await pickDate(page, sheet, locale, { day: values.date, from: TODAY });
  await sheet.getByRole("button", { name: text.add, exact: true }).click();
  await expect(sheet).toHaveCount(0);
}

async function showMonth(page: Page, locale: Locale) {
  await openPeriodMenu(page, locale);
  await page.getByRole("button", { name: TEXTS[locale].month, exact: true }).click();
  await expect(page).toHaveURL(/[?&]period=month(&|$)/);
}

function item(page: Page, note: string) {
  return page.getByRole("listitem").filter({ hasText: note });
}

async function openEditSheet(page: Page, locale: Locale, note: string) {
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

const OTHER_DAY = `${TODAY.slice(0, 8)}01`;
const YEAR = TODAY.slice(0, 4);

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`an expense and an income are listed by day in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    await expect(page.getByText(text.empty)).toBeVisible();
    await expectNoViolations(page);

    const sheet = await openAddSheet(page, locale);
    await expect(dateButton(sheet, locale)).toHaveAccessibleName(
      `${text.date}: ${shownDay(locale, TODAY)}`,
    );
    await sheet.getByRole("button", { name: text.add, exact: true }).click();
    await expect(sheet.getByText(text.amountRequired)).toBeVisible();
    await expectNoViolations(page);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);

    await addTransaction(page, locale, { amount: "125,50", note: "lunch", category: text.food });
    await addTransaction(page, locale, {
      amount: "3000",
      isIncome: true,
      date: OTHER_DAY,
      category: text.salary,
    });

    await showMonth(page, locale);
    const days = page.getByRole("heading", { level: 2 }).filter({ has: page.locator("time") });
    await expect(days).toHaveCount(2);
    const times = await page
      .locator("h2 time")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime")));
    expect(times).toEqual([TODAY, OTHER_DAY]);

    const expenseRow = item(page, "lunch");
    await expect(expenseRow).toContainText(text.food);
    const incomeRow = item(page, text.salary);
    await expect(incomeRow).toContainText("+");
    await expectNoViolations(page);

    if (locale === "en") {
      await expect(expenseRow).toContainText("-₴125.50");
      await expect(incomeRow).toContainText("+₴3,000.00");

      const panel = await openAccountMenu(page, locale);
      await panel.getByRole("link", { name: text.other }).click();
      await expect(page).toHaveURL(/\/uk\/transactions$/);
      const translated = item(page, "lunch");
      await expect(translated).toContainText(TEXTS.uk.food);
      await expect(translated).toContainText(/125,50\s*₴/);
      await showMonth(page, "uk");
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

test("Add expense opens the form over the screen without focusing the amount, and Escape returns focus to it", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  const add = navAddButton(page, "en");

  const sheet = await openAddSheet(page, "en");
  await expect(field(page, TEXTS.en.amount)).not.toBeFocused();
  await field(page, TEXTS.en.amount).fill("5");
  await page.keyboard.press("Escape");

  await expect(sheet).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TEXTS.en.overview);

  await add.click();
  await expect(field(page, TEXTS.en.amount)).toHaveValue("");
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`a transaction is edited and deleted in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    await showMonth(page, locale);
    await addTransaction(page, locale, { amount: "10", note: "first" });
    await addTransaction(page, locale, { amount: "20", note: "second" });

    let sheet = await openEditSheet(page, locale, "first");
    await expect(field(page, text.amount)).toHaveValue("10.00");
    await expect(field(page, text.note)).toHaveValue("first");
    await expectNoViolations(page);

    await field(page, text.amount).fill("12,34");
    await pickDate(page, sheet, locale, { day: OTHER_DAY, from: TODAY });
    await sheet.getByRole("button", { name: text.save }).click();
    await expect(sheet).toHaveCount(0);
    await expect(notifications(page, locale).getByText(text.changesSaved)).toBeVisible();
    await expect(page).not.toHaveURL(/edit=/);

    const movedRow = item(page, "first");
    await expect(movedRow).toContainText(/12[.,]34/);
    const dayOfMoved = await movedRow
      .locator("xpath=ancestor::div[./h2][1]//time")
      .getAttribute("datetime");
    expect(dayOfMoved).toBe(OTHER_DAY);
    await expect(item(page, "second")).toBeVisible();

    sheet = await openEditSheet(page, locale, "second");
    await sheet.getByRole("button", { name: text.del, exact: true }).click();
    const dialog = page.getByRole("alertdialog", { name: text.deleteTitle });
    await expect(dialog).toBeVisible();
    await expectNoViolations(page);
    await dialog.getByRole("button", { name: text.cancel }).click();
    await expect(dialog).toHaveCount(0);
    await expect(sheet).toBeVisible();

    await sheet.getByRole("button", { name: text.del, exact: true }).click();
    await dialog.getByRole("button", { name: text.del, exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions\\?period=month$`));
    await expect(item(page, "second")).toHaveCount(0);
    await expect(notifications(page, locale).getByText(text.transactionDeleted)).toBeVisible();

    await page.goBack();
    await expect(page).not.toHaveURL(/edit=/);
    await expect(sheet).toHaveCount(0);

    await page.reload();
    await expect(item(page, "first")).toContainText(/12[.,]34/);
    await expect(item(page, "second")).toHaveCount(0);
  });
}

test("closing the edit form keeps the period and returns focus to the item", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await addTransaction(page, "en", { amount: "3", note: "kept" });
  await openPeriodMenu(page, "en");
  await page.getByRole("button", { name: "Year", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/transactions\?period=year$/);
  await expect(page.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(YEAR);
  await expect(item(page, "kept").getByRole("link")).toHaveAttribute("href", /period=year/);

  const sheet = await openEditSheet(page, "en", "kept");
  await expect(page).toHaveURL(/\?period=year&edit=/);
  await sheet.getByRole("button", { name: "Close" }).click();

  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/transactions\?period=year$/);
  await expect(item(page, "kept").getByRole("link")).toBeFocused();
  await expect(page.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(YEAR);
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

  await expect(otherPage.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(otherPage.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(otherPage.getByRole("dialog")).toHaveCount(0);
  await other.close();
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`the list follows the week and a shared URL in ${locale}`, async ({ page }, testInfo) => {
    const weekday = (new Date(`${TODAY}T00:00:00Z`).getUTCDay() + 6) % 7;
    const monday = addDays(TODAY, -weekday);
    const sunday = addDays(monday, -1);
    const periodLabel = page.locator('[aria-live="polite"]').filter({ visible: true });

    await signUpAndIn(page, locale, testInfo);
    await openScreen(page, locale, "transactions");
    await addTransaction(page, locale, { amount: "10", note: "this-week", date: monday });
    await addTransaction(page, locale, { amount: "10", note: "last-week", date: sunday });

    await openPeriodMenu(page, locale);
    await page.getByRole("button", { name: text.week, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions\\?period=week$`));
    await expect(item(page, "this-week")).toBeVisible();
    await expect(item(page, "last-week")).toHaveCount(0);
    await openPeriodMenu(page, locale);
    await expect(page.getByRole("button", { name: text.thisWeek })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: text.thisWeek })).toHaveCount(0);
    const thisWeekLabel = await periodLabel.textContent();
    await expectNoViolations(page);

    await page.getByRole("button", { name: text.previousWeek }).click();
    await expect(page).toHaveURL(new RegExp(`\\?period=week&date=${addDays(monday, -7)}$`));
    await expect(periodLabel).not.toHaveText(thisWeekLabel ?? "");
    await expect(item(page, "last-week")).toBeVisible();
    await expect(item(page, "this-week")).toHaveCount(0);
    const lastWeekLabel = (await periodLabel.textContent()) ?? "";

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

test("an invalid period in the URL shows today", async ({ page }, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await page.goto("/en?period=decade&date=2026-02-30");

  await openPeriodMenu(page, "en");
  await expect(page.getByRole("button", { name: "Day", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Today" })).toBeDisabled();
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
    await expect(byCategory.locator("svg g circle")).toHaveCount(2);

    for (const theme of ["light", "dark"] as const) {
      await pickAppTheme(page, locale, theme);
      await expectNoViolations(page);
    }

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

    await openScreen(page, locale, "transactions");
    const paySheet = await openEditSheet(page, locale, "pay");
    await paySheet.getByRole("button", { name: text.del, exact: true }).click();
    await page
      .getByRole("alertdialog", { name: text.deleteTitle })
      .getByRole("button", { name: text.del, exact: true })
      .click();
    await expect(item(page, "pay")).toHaveCount(0);
    await openScreen(page, locale, "overview");
    await expectTotals(0, 800);
  });
}

test("an edit link on the home page opens the form over the Overview with its period", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await openScreen(page, "en", "transactions");
  await addTransaction(page, "en", { amount: "7", note: "home-link" });
  await openEditSheet(page, "en", "home-link");
  const id = new URL(page.url()).searchParams.get("edit") ?? "";

  await page.goto(`/en?period=year&edit=${id}`);
  await expect(page).toHaveURL(new RegExp(`/en\\?period=year&edit=${id}$`));
  await expect(page.getByRole("dialog", { name: TEXTS.en.editHeading })).toBeVisible();
  await expect(field(page, TEXTS.en.note)).toHaveValue("home-link");
  await expect(page.locator('[aria-live="polite"]').filter({ visible: true })).toHaveText(YEAR);
});

test("the Overview's latest transactions are edited and deleted there", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await addTransaction(page, "en", { amount: "30", note: "latest" });
  const latest = page.getByRole("region", { name: "Latest transactions" });

  await latest.getByRole("link", { name: /latest/ }).click();
  await expect(page).toHaveURL(/\/en\?edit=/);
  let sheet = page.getByRole("dialog", { name: TEXTS.en.editHeading });
  await expect(sheet).toBeVisible();
  await field(page, TEXTS.en.amount).fill("45");
  await sheet.getByRole("button", { name: TEXTS.en.save }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/en$/);
  await expect(latest.getByRole("listitem").filter({ hasText: "latest" })).toContainText(
    money("en", -45),
  );
  await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 45));

  // On a phone the toast covers the row, and a pointer over it keeps it open
  await expect(latest.getByRole("link", { name: /latest/ })).toBeFocused();
  await page.keyboard.press("Enter");
  sheet = page.getByRole("dialog", { name: TEXTS.en.editHeading });
  await sheet.getByRole("button", { name: TEXTS.en.del, exact: true }).click();
  const confirm = page.getByRole("alertdialog", { name: TEXTS.en.deleteTitle });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: TEXTS.en.del, exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/en$/);
  await expect(latest).toHaveCount(0);
  await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 0));
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`the period stays when moving between Overview and Transactions in ${locale}`, async ({
    page,
  }, testInfo) => {
    const periodLabel = page.locator('[aria-live="polite"]').filter({ visible: true });
    await signUpAndIn(page, locale, testInfo);
    const today = (await periodLabel.textContent()) ?? "";

    await page.getByRole("button", { name: text.previousDay }).click();
    await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}$/);
    await expect(periodLabel).not.toHaveText(today);
    const yesterday = (await periodLabel.textContent()) ?? "";

    await openScreen(page, locale, "transactions");
    await expect(page).toHaveURL(/\/transactions\?date=\d{4}-\d{2}-\d{2}$/);
    await expect(periodLabel).toHaveText(yesterday);

    await openScreen(page, locale, "overview");
    await expect(periodLabel).toHaveText(yesterday);
  });
}

test("a category in the chart's legend opens its transactions until the filter is removed", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await addTransaction(page, "en", { amount: "30", note: "lunch", category: TEXTS.en.food });
  await addTransaction(page, "en", { amount: "20", note: "bus", category: TEXTS.en.transport });

  await page
    .getByRole("region", { name: TEXTS.en.byCategory })
    .getByRole("link", { name: TEXTS.en.transport, exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/transactions\?category=[^&]+$/);
  await expect(item(page, "bus")).toBeVisible();
  await expect(item(page, "lunch")).toHaveCount(0);

  const sheet = await openEditSheet(page, "en", "bus");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/\/en\/transactions\?category=[^&]+$/);
  await expect(item(page, "lunch")).toHaveCount(0);
  await expectNoViolations(page);

  await page.getByRole("link", { name: `Remove the ${TEXTS.en.transport} filter` }).click();
  await expect(page).toHaveURL(/\/en\/transactions$/);
  await expect(item(page, "lunch")).toBeVisible();
});

function calendarDay(day: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${day}T00:00:00Z`));
}

test("the calendar opens on its button, shows each day's spending and opens a day", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await addTransaction(page, "en", { amount: "300", note: "today's" });
  await addTransaction(page, "en", { amount: "20", note: "earlier", date: OTHER_DAY });
  const calendar = page.getByRole("region", { name: TEXTS.en.spendingByDay });
  const day = (date: string) =>
    calendar.getByRole("link", { name: new RegExp(`^${calendarDay(date)}:`) });
  const toggle = calendar.getByRole("button", { name: new RegExp(`^${TEXTS.en.spendingByDay}`) });

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(day(TODAY)).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(day(TODAY)).toHaveAccessibleName(`${calendarDay(TODAY)}: ${money("en", 300)}`);
  await expect(day(TODAY)).toHaveAttribute("aria-current", "date");
  await expect(day(addDays(TODAY, 1))).toHaveAccessibleName(
    `${calendarDay(addDays(TODAY, 1))}: no expenses`,
  );

  await day(OTHER_DAY).click();
  await expect(page).toHaveURL(new RegExp(`/en\\?date=${OTHER_DAY}$`));
  await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 20));
  await expect(day(OTHER_DAY)).toHaveAttribute("aria-current", "date");
  await expect(day(TODAY)).not.toHaveAttribute("aria-current");
  await expectNoViolations(page);

  await toggle.click();
  await expect(day(OTHER_DAY)).toBeHidden();
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`the arrows slide the period's content with reduced motion ${reducedMotion}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(recordViewTransitions);
    await signUpAndIn(page, "en", testInfo);
    await addTransaction(page, "en", { amount: "12", note: "today's" });
    const transitions = viewTransitions(page, reducedMotion);

    await transitions.clear();
    await page.getByRole("button", { name: TEXTS.en.previousDay, exact: true }).click();
    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 0));
    await transitions.expectAnimation("slide-from-start");

    await transitions.clear();
    await page.getByRole("button", { name: "Next day", exact: true }).click();
    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 12));
    await transitions.expectAnimation("slide-from-end");
  });

  test(`a day picked in the calendar slides the content toward it with reduced motion ${reducedMotion}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(recordViewTransitions);
    await signUpAndIn(page, "en", testInfo);
    await addTransaction(page, "en", { amount: "20", note: "earlier", date: OTHER_DAY });
    const transitions = viewTransitions(page, reducedMotion);
    const calendar = page.getByRole("region", { name: TEXTS.en.spendingByDay });
    const day = (date: string) =>
      calendar.getByRole("link", { name: new RegExp(`^${calendarDay(date)}:`) });
    await calendar.getByRole("button", { name: new RegExp(`^${TEXTS.en.spendingByDay}`) }).click();

    await transitions.clear();
    await day(OTHER_DAY).click();
    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 20));
    await transitions.expectAnimation("slide-from-start");

    await transitions.clear();
    await day(TODAY).click();
    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 0));
    await transitions.expectAnimation("slide-from-end");
  });

  test(`days rise into place as the list scrolls with reduced motion ${reducedMotion}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await signUpAndIn(page, "en", testInfo);
    await addTransaction(page, "en", { amount: "5", note: "today's" });
    await addTransaction(page, "en", { amount: "6", note: "earlier", date: OTHER_DAY });
    await openScreen(page, "en", "transactions");
    await showMonth(page, "en");
    const days = page.getByRole("heading", { level: 2 }).filter({ has: page.locator("time") });
    await expect(days).toHaveCount(2);

    const followsScroll = await days
      .last()
      .evaluate((heading) =>
        (heading.parentElement?.getAnimations() ?? []).some(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "scroll-rise" &&
            animation.timeline !== document.timeline,
        ),
      );
    expect(followsScroll).toBe(reducedMotion === "no-preference");
  });

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
    const confirm = page.getByRole("alertdialog", { name: TEXTS.en.deleteTitle });
    await expect(confirm).toBeVisible();
    // Base UI's opening animation would make React skip the delete's view transition
    await waitForAnimations(page);
    await confirm.getByRole("button", { name: TEXTS.en.del, exact: true }).click();
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
    const sheet = await openAddSheet(page, "en", {
      button: spending.getByRole("button", { name: TEXTS.en.addButton.expense }),
    });
    await field(page, TEXTS.en.amount).fill("300");
    await sheet.getByRole("button", { name: TEXTS.en.add, exact: true }).click();
    await expect(sheet).toHaveCount(0);

    await expect(total(page, TEXTS.en.expensesTotal)).toHaveText(money("en", 300));
    await expect(total(page, TEXTS.en.balance)).toHaveText(money("en", -300));
    await transitions.expectAnimation("total-in");
    await expect(spending.getByRole("table")).toBeVisible();
    await expect(page.getByRole("main")).toBeFocused();
  });
}
