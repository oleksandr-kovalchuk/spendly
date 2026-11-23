import AxeBuilder from "@axe-core/playwright";
import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

export type Locale = "en" | "uk";

export const PASSWORD = "correct horse battery";

export const TEXTS = {
  en: {
    signUp: "Sign up",
    signIn: "Sign in",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    invalidEmail: "Enter a valid email address.",
    wrongCredentials: "The email or password is incorrect.",
    continueWithGoogle: "Continue with Google",
    privacy: "Privacy policy",
    accountNotLinked:
      "This email already has an account with a password. Sign in with your password.",
    forgotPassword: "Forgot password?",
    sendLink: "Send link",
    newPassword: "New password",
    savePassword: "Save password",
    passwordChanged: "Your password has changed. Sign in with the new one.",
    invalidLink: "This link is invalid or has expired.",
    overview: "Overview",
    transactions: "Transactions",
    categories: "Categories",
    amount: "Amount (UAH)",
    category: "Category",
    date: "Date",
    note: "Note (optional)",
    add: "Add",
    addButton: { expense: "Add expense", income: "Add income" },
    addSheet: { expense: "New expense", income: "New income" },
    empty: "No transactions in this period.",
    amountRequired: "Enter an amount.",
    food: "Food",
    salary: "Salary",
    transport: "Transport",
    other: "Українська",
    save: "Save",
    cancel: "Cancel",
    del: "Delete",
    editHeading: "Edit transaction",
    deleteTitle: "Delete this transaction?",
    week: "Week",
    choosePeriod: "Choose period",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    thisWeek: "This week",
    previousDay: "Previous day",
    month: "Month",
    incomeTotal: "Income",
    expensesTotal: "Expenses",
    balance: "Balance",
    byCategory: "Spending by category",
    spendingByDay: "Spending by day",
    noExpenses: "No expenses in this period.",
    theme: "Theme",
    themes: { light: "Light", dark: "Dark", system: "System" },
    settings: "Settings",
    language: "Language",
    dangerZone: "Danger zone",
    expenseCategories: "Expenses",
    incomeCategories: "Income",
    newExpense: "New expense category",
    addExpense: "Add expense category",
    categoryName: "Name",
    added: "Category added.",
    notifications: "Notifications",
    changesSaved: "Changes saved.",
    transactionDeleted: "Transaction deleted.",
    rename: "Rename",
    nameTaken: "You already have a category with this name.",
    account: "Account",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete your account?",
    passwordIncorrect: "The password is incorrect.",
    accountDeleted: "Your account and all its data have been deleted.",
    clearTransactions: "Clear transactions",
    clearTransactionsTitle: "Clear all transactions?",
    transactionsCleared: "Transactions cleared.",
    resetData: "Reset all data",
    resetDataTitle: "Reset all data?",
    resetDataConfirm: "Reset data",
    dataReset: "Data reset.",
  },
  uk: {
    signUp: "Зареєструватися",
    signIn: "Увійти",
    signOut: "Вийти",
    email: "Електронна пошта",
    password: "Пароль",
    invalidEmail: "Введіть дійсну адресу електронної пошти.",
    wrongCredentials: "Електронна пошта або пароль неправильні.",
    continueWithGoogle: "Продовжити з Google",
    privacy: "Політика конфіденційності",
    accountNotLinked: "Ця пошта вже має обліковий запис з паролем. Увійдіть за допомогою пароля.",
    forgotPassword: "Забули пароль?",
    sendLink: "Надіслати посилання",
    overview: "Огляд",
    transactions: "Транзакції",
    categories: "Категорії",
    amount: "Сума (грн)",
    category: "Категорія",
    date: "Дата",
    note: "Примітка (необов'язково)",
    add: "Додати",
    addButton: { expense: "Додати витрату", income: "Додати дохід" },
    addSheet: { expense: "Нова витрата", income: "Новий дохід" },
    empty: "У цьому періоді немає транзакцій.",
    amountRequired: "Введіть суму.",
    food: "Їжа",
    salary: "Зарплата",
    transport: "Транспорт",
    other: "English",
    save: "Зберегти",
    cancel: "Скасувати",
    del: "Видалити",
    editHeading: "Редагувати транзакцію",
    deleteTitle: "Видалити цю транзакцію?",
    week: "Тиждень",
    choosePeriod: "Вибрати період",
    previousWeek: "Попередній тиждень",
    nextWeek: "Наступний тиждень",
    thisWeek: "Цей тиждень",
    previousDay: "Попередній день",
    month: "Місяць",
    incomeTotal: "Дохід",
    expensesTotal: "Витрати",
    balance: "Баланс",
    byCategory: "Витрати за категоріями",
    spendingByDay: "Витрати по днях",
    noExpenses: "У цьому періоді немає витрат.",
    theme: "Тема",
    themes: { light: "Світла", dark: "Темна", system: "Як у системі" },
    settings: "Налаштування",
    language: "Мова",
    dangerZone: "Небезпечна зона",
    expenseCategories: "Витрати",
    incomeCategories: "Доходи",
    newExpense: "Нова категорія витрат",
    addExpense: "Додати категорію витрат",
    categoryName: "Назва",
    added: "Категорію додано.",
    notifications: "Сповіщення",
    changesSaved: "Зміни збережено.",
    transactionDeleted: "Транзакцію видалено.",
    rename: "Перейменувати",
    nameTaken: "У вас вже є категорія з такою назвою.",
    account: "Обліковий запис",
    deleteAccount: "Видалити обліковий запис",
    deleteAccountTitle: "Видалити обліковий запис?",
    passwordIncorrect: "Пароль неправильний.",
    accountDeleted: "Ваш обліковий запис і всі його дані видалено.",
    clearTransactions: "Очистити транзакції",
    clearTransactionsTitle: "Очистити всі транзакції?",
    transactionsCleared: "Транзакції очищено.",
    resetData: "Скинути всі дані",
    resetDataTitle: "Скинути всі дані?",
    resetDataConfirm: "Скинути дані",
    dataReset: "Дані скинуто.",
  },
} as const;

type TestInfo = { project: { name: string }; workerIndex: number };

// One IP for every test would hit the sign-in rate limit
export async function setRandomClientIp(context: BrowserContext) {
  const [a = 0, b = 0, c = 0] = crypto.getRandomValues(new Uint8Array(3));
  await context.setExtraHTTPHeaders({ "x-real-ip": `10.${a}.${b}.${c}` });
}

// allSettled: infinite, off-screen scroll-driven and cancelled animations never fulfil
export async function waitForAnimations(page: Page) {
  await page.evaluate(() =>
    Promise.allSettled(
      document
        .getAnimations()
        .filter(
          (a) =>
            a.timeline === document.timeline && a.effect?.getComputedTiming().endTime !== Infinity,
        )
        .map((a) => a.finished),
    ),
  );
}

export async function expectNoViolations(page: Page) {
  await expect(page).toHaveTitle(/\S/);
  // axe would read the colors of running animations
  await waitForAnimations(page);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

export async function pickCategory(sheet: Locator, name: string) {
  await sheet
    .getByRole("radiogroup")
    .locator("label")
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();
  await expect(sheet.getByRole("radio", { name, exact: true })).toBeChecked();
}

export function dateButton(scope: Page | Locator, locale: Locale) {
  return scope.getByRole("button", { name: new RegExp(`^${TEXTS[locale].date}: `) });
}

export function shownDay(locale: Locale, day: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${day}T00:00:00Z`));
}

const CALENDAR_STEPS = {
  en: { previous: "Go to the Previous Month", next: "Go to the Next Month" },
  uk: { previous: "Перейти до попереднього місяця", next: "Перейти до наступного місяця" },
} as const;

function monthIndexOf(day: string) {
  return Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7));
}

export async function pickDate(
  page: Page,
  sheet: Locator,
  locale: Locale,
  { day, from }: { day: string; from: string },
) {
  await dateButton(sheet, locale).click();
  const steps = monthIndexOf(day) - monthIndexOf(from);
  const step = page.getByRole("button", {
    name: steps < 0 ? CALENDAR_STEPS[locale].previous : CALENDAR_STEPS[locale].next,
  });
  for (let index = 0; index < Math.abs(steps); index += 1) await step.click();
  const fullDay = new Intl.DateTimeFormat(locale, { timeZone: "UTC", dateStyle: "full" }).format(
    new Date(`${day}T00:00:00Z`),
  );
  await page.getByRole("button", { name: fullDay, exact: true }).click();
  await expect(dateButton(sheet, locale)).toHaveAccessibleName(
    `${TEXTS[locale].date}: ${shownDay(locale, day)}`,
  );
}

export async function openPeriodMenu(page: Page, locale: Locale) {
  await page
    .getByRole("button", { name: new RegExp(`^${TEXTS[locale].choosePeriod}`) })
    .filter({ visible: true })
    .click();
}

export async function pickTheme(
  page: Page,
  locale: Locale,
  theme: "light" | "dark",
  scope: Page | Locator = page,
) {
  const name = TEXTS[locale].themes[theme];
  const group = scope.getByRole("group", { name: TEXTS[locale].theme, exact: true });
  await group
    .locator("label")
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();
  await expect(group.getByRole("radio", { name, exact: true })).toBeChecked();
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);
}

export async function openAccountMenu(page: Page, locale: Locale) {
  const button = page.getByRole("button", { name: new RegExp(`^${TEXTS[locale].account}`) });
  const panel = page.getByRole("dialog", { name: TEXTS[locale].account, exact: true });
  // Retries a click lost before hydration
  await expect(async () => {
    await button.click();
    await expect(panel).toBeVisible({ timeout: 1000 });
  }).toPass();

  return panel;
}

type TransactionType = keyof (typeof TEXTS)[Locale]["addButton"];

export function navAddButton(page: Page, locale: Locale, type: TransactionType = "expense") {
  return page
    .locator("header, nav")
    .getByRole("button", { name: TEXTS[locale].addButton[type], exact: true });
}

// Retries a click lost before hydration
export async function openAddSheet(
  page: Page,
  locale: Locale,
  { type = "expense", button }: { type?: TransactionType; button?: Locator } = {},
) {
  const sheet = page.getByRole("dialog", { name: TEXTS[locale].addSheet[type] });
  const opener = button ?? navAddButton(page, locale, type);
  await expect(async () => {
    if (!(await sheet.isVisible())) await opener.click({ timeout: 1000 });
    await expect(sheet).toBeVisible({ timeout: 1000 });
  }).toPass();

  return sheet;
}

export async function pickAppTheme(page: Page, locale: Locale, theme: "light" | "dark") {
  const panel = await openAccountMenu(page, locale);
  await pickTheme(page, locale, theme, panel);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
}

export function notifications(page: Page, locale: Locale) {
  return page.getByRole("region", { name: TEXTS[locale].notifications });
}

export function field(scope: Page | Locator, name: string) {
  return scope.getByRole("textbox", { name, exact: true });
}

export function newEmail(testInfo: TestInfo) {
  return `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}@example.com`;
}

// React adds `__reactProps$` keys to hydrated elements; clicks before that are lost
async function waitForHydration(page: Page) {
  await expect
    .poll(() =>
      page
        .getByRole("main")
        .evaluate((main) => Object.keys(main).some((key) => key.startsWith("__reactProps$"))),
    )
    .toBe(true);
}

export async function signUpAndIn(page: Page, locale: Locale, testInfo: TestInfo) {
  const text = TEXTS[locale];
  const email = newEmail(testInfo);
  await page.goto(`/${locale}/sign-up`);
  await field(page, text.email).fill(email);
  await field(page, text.password).fill(PASSWORD);
  await page.getByRole("button", { name: text.signUp }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
  await field(page, text.password).fill(PASSWORD);
  await page.getByRole("button", { name: text.signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}$`));
  await waitForHydration(page);

  return email;
}

type RecordedAnimation = { name: string; duration: number };

export function recordViewTransitions() {
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
      (error: unknown) => recorded.push({ name: `skipped: ${String(error)}`, duration: 0 }),
    );
    return transition;
  };
}

export function viewTransitions(page: Page, reducedMotion: "no-preference" | "reduce") {
  const recorded = () =>
    page.evaluate((): RecordedAnimation[] => Reflect.get(window, "viewTransitionAnimations"));

  return {
    // Emptied in place: the recorder keeps writing to this array
    clear: () =>
      page.evaluate(() => {
        const animations: RecordedAnimation[] = Reflect.get(window, "viewTransitionAnimations");
        animations.length = 0;
      }),
    expectAnimation: async (name: string) => {
      if (reducedMotion === "reduce") {
        await expect.poll(async () => (await recorded()).map((a) => a.name)).not.toContain(name);
        expect((await recorded()).every(({ duration }) => duration === 0)).toBe(true);
      } else {
        await expect.poll(async () => (await recorded()).map((a) => a.name)).toContain(name);
      }
    },
  };
}
