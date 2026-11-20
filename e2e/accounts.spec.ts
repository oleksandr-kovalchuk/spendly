import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "correct horse battery";

const TEXTS = {
  en: {
    signUp: "Sign up",
    signIn: "Sign in",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    heading: "Overview",
    signInHeading: "Sign in to Spendly",
    invalidEmail: "Enter a valid email address.",
    wrongCredentials: "The email or password is incorrect.",
  },
  uk: {
    signUp: "Зареєструватися",
    signIn: "Увійти",
    signOut: "Вийти",
    email: "Електронна пошта",
    password: "Пароль",
    heading: "Огляд",
    signInHeading: "Вхід до Spendly",
    invalidEmail: "Введіть дійсну адресу електронної пошти.",
    wrongCredentials: "Електронна пошта або пароль неправильні.",
  },
} as const;

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

// Next keeps the previous page hidden, and a label query would match its fields too
function field(page: Page, name: string) {
  return page.getByRole("textbox", { name, exact: true });
}

function newEmail(testInfo: { project: { name: string }; workerIndex: number }) {
  return `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}@example.com`;
}

// Every test would otherwise share one IP and hit the sign-in rate limit; the server reads x-real-ip
test.beforeEach(async ({ context }) => {
  const [a = 0, b = 0, c = 0] = crypto.getRandomValues(new Uint8Array(3));
  await context.setExtraHTTPHeaders({ "x-real-ip": `10.${a}.${b}.${c}` });
});

for (const locale of ["en", "uk"] as const) {
  const text = TEXTS[locale];

  test(`sign up, sign in, reload and sign out in ${locale}`, async ({ page }, testInfo) => {
    const email = newEmail(testInfo);

    await page.goto(`/${locale}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));

    await page.getByRole("link", { name: text.signUp }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-up$`));
    await expectNoViolations(page);
    await field(page, text.email).fill(email);
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signUp }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
    await expect(field(page, text.email)).toHaveValue(email);
    await expectNoViolations(page);
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signIn }).click();

    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.heading);
    await expect(page.getByRole("button", { name: text.signOut })).toBeVisible();
    await expectNoViolations(page);

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.heading);

    await page.getByRole("button", { name: text.signOut }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
    await expect(page.getByRole("button", { name: text.signOut })).toHaveCount(0);

    await page.goto(`/${locale}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
  });

  test(`a signed-in user is sent from the sign-in page to the main page in ${locale}`, async ({
    page,
  }, testInfo) => {
    const email = newEmail(testInfo);
    await page.goto(`/${locale}/sign-up`);
    await field(page, text.email).fill(email);
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signUp }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
    await field(page, text.password).fill(PASSWORD);
    await page.getByRole("button", { name: text.signIn }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));

    await page.goto(`/${locale}/sign-in`);

    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
  });

  test(`field and credential errors are shown in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}/sign-in`);
    await field(page, text.email).fill("not-an-email");
    await field(page, text.password).fill("x");
    await page.getByRole("button", { name: text.signIn }).click();

    await expect(page.getByText(text.invalidEmail)).toBeVisible();
    await expectNoViolations(page);

    await field(page, text.email).fill("nobody@example.com");
    await page.getByRole("button", { name: text.signIn }).click();

    await expect(page.getByRole("alert").filter({ hasText: text.wrongCredentials })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in$`));
    await expectNoViolations(page);
  });
}

test("the signed-in main page fits a small screen", async ({ page }, testInfo) => {
  await page.goto("/uk/sign-up");
  await field(page, TEXTS.uk.email).fill(newEmail(testInfo));
  await field(page, TEXTS.uk.password).fill(PASSWORD);
  await page.getByRole("button", { name: TEXTS.uk.signUp }).click();
  await expect(page).toHaveURL(/\/uk\/sign-in\?/);
  await field(page, TEXTS.uk.password).fill(PASSWORD);
  await page.getByRole("button", { name: TEXTS.uk.signIn }).click();
  await expect(page.getByRole("button", { name: TEXTS.uk.signOut })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
