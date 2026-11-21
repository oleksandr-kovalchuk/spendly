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
    overview: "Overview",
    transactions: "Transactions",
    categories: "Categories",
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
    transport: "Transport",
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
    previousMonth: "Previous month",
    incomeTotal: "Income",
    expensesTotal: "Expenses",
    balance: "Balance",
    byCategory: "Spending by category",
    noExpenses: "No expenses in this period.",
    light: "Light",
    dark: "Dark",
    expenseCategories: "Expenses",
    incomeCategories: "Income",
    newExpense: "New expense category",
    added: "Category added.",
    rename: "Rename",
    nameTaken: "You already have a category with this name.",
  },
  uk: {
    signUp: "Зареєструватися",
    signIn: "Увійти",
    signOut: "Вийти",
    email: "Електронна пошта",
    password: "Пароль",
    invalidEmail: "Введіть дійсну адресу електронної пошти.",
    wrongCredentials: "Електронна пошта або пароль неправильні.",
    overview: "Огляд",
    transactions: "Транзакції",
    categories: "Категорії",
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
    transport: "Транспорт",
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
    previousMonth: "Попередній місяць",
    incomeTotal: "Дохід",
    expensesTotal: "Витрати",
    balance: "Баланс",
    byCategory: "Витрати за категоріями",
    noExpenses: "У цьому періоді немає витрат.",
    light: "Світла",
    dark: "Темна",
    expenseCategories: "Витрати",
    incomeCategories: "Доходи",
    newExpense: "Нова категорія витрат",
    added: "Категорію додано.",
    rename: "Перейменувати",
    nameTaken: "У вас вже є категорія з такою назвою.",
  },
} as const;

type TestInfo = { project: { name: string }; workerIndex: number };

// Every test would otherwise share one IP and hit the sign-in rate limit; the server reads x-real-ip
export async function setRandomClientIp(context: BrowserContext) {
  const [a = 0, b = 0, c = 0] = crypto.getRandomValues(new Uint8Array(3));
  await context.setExtraHTTPHeaders({ "x-real-ip": `10.${a}.${b}.${c}` });
}

export async function expectNoViolations(page: Page) {
  // After a client-side navigation or a period change the title streams in after the content
  await expect(page).toHaveTitle(/\S/);
  // axe would read the colors of a running animation's frames (an opening dialog, a theme switch,
  // a submit button fading back in); a skeleton's endless pulse never ends, and a removed
  // element's animation is cancelled
  await page.evaluate(() =>
    Promise.allSettled(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished),
    ),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

// Next keeps the previous page hidden, and a label query would match its fields too
export function field(scope: Page | Locator, name: string) {
  return scope.getByRole("textbox", { name, exact: true });
}

export function newEmail(testInfo: TestInfo) {
  return `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}@example.com`;
}

// Signs up, signs in with the same account and ends on Overview
export async function signUpAndIn(page: Page, locale: Locale, testInfo: TestInfo) {
  const text = TEXTS[locale];
  await page.goto(`/${locale}/sign-up`);
  await field(page, text.email).fill(newEmail(testInfo));
  await field(page, text.password).fill(PASSWORD);
  await page.getByRole("button", { name: text.signUp }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
  await field(page, text.password).fill(PASSWORD);
  await page.getByRole("button", { name: text.signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}$`));
}
