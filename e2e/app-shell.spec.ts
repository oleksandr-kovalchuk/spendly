import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const LOCALES = [
  { locale: "en", other: "Українська", dark: "Dark", light: "Light", missing: "Page not found" },
  {
    locale: "uk",
    other: "English",
    dark: "Темна",
    light: "Світла",
    missing: "Сторінку не знайдено",
  },
] as const;

const PAGES = [
  { name: "sign in", path: "/sign-in" },
  { name: "sign up", path: "/sign-up" },
  { name: "not found", path: "/no-such-page" },
] as const;

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

for (const { locale, dark, light } of LOCALES) {
  for (const { name, path } of PAGES) {
    for (const theme of ["light", "dark"] as const) {
      test(`${name} in ${locale}, ${theme} theme, has no accessibility violations`, async ({
        page,
      }) => {
        await page.goto(`/${locale}${path}`);
        await page
          .getByRole("button", { name: theme === "dark" ? dark : light, exact: true })
          .click();
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);

        await expectNoViolations(page);
      });
    }
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`follows the ${colorScheme} system theme by default`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/en/sign-in");

    await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
    await expectNoViolations(page);
  });
}

test("remembers the dark theme from the first paint", async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      Object.assign(window, { themeAtParse: document.documentElement.className });
    });
  });

  await page.reload();

  expect(await page.evaluate(() => Reflect.get(window, "themeAtParse"))).toContain("dark");
});

for (const { browserLocale, expected } of [
  { browserLocale: "uk-UA", expected: "/uk/sign-in" },
  { browserLocale: "en-US", expected: "/en/sign-in" },
  { browserLocale: "fr-FR", expected: "/en/sign-in" },
]) {
  test.describe(`browser language ${browserLocale}`, () => {
    test.use({ locale: browserLocale });

    test(`redirects / to the sign-in page ${expected}`, async ({ page }) => {
      await page.goto("/");

      expect(new URL(page.url()).pathname).toBe(expected);
    });
  });
}

test("switches the language and keeps the page", async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.getByRole("link", { name: "Українська" }).click();

  await expect(page).toHaveURL(/\/uk\/sign-in$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Вхід до Spendly");
  await expect(page).toHaveTitle("Вхід | Spendly");
});

test("shows the 404 page in the current language with a link home", async ({ page }) => {
  await page.goto("/uk/no-such-page");

  await expect(page).toHaveTitle("Сторінку не знайдено | Spendly");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Сторінку не знайдено");
  await page.getByRole("link", { name: "На головну" }).click();
  await expect(page).toHaveURL(/\/uk\/sign-in$/);
});

test("an unknown URL answers with the 404 status", async ({ request }) => {
  for (const path of ["/en/no-such-page", "/uk/no-such-page", "/en/sign-in/no-such-page"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("the first Tab stop is the skip link to the main content", async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.keyboard.press("Tab");

  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("fits the screen without horizontal scrolling", async ({ page }) => {
  await page.goto("/uk/sign-in");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
