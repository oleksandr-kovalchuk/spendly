import { expect, test, type Page } from "@playwright/test";

import {
  expectNoViolations,
  field,
  openAddSheet,
  pickAppTheme,
  setRandomClientIp,
  signUpAndIn,
} from "./helpers";

test.use({ timezoneId: "UTC" });

test.beforeEach(({ context }) => setRandomClientIp(context));

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

test("signed-out pages show no app navigation", async ({ page }) => {
  await page.goto("/en/sign-in");

  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Transactions" })).toHaveCount(0);
});

for (const { locale, overview, transactions, categories } of [
  {
    locale: "en",
    overview: "Overview",
    transactions: "Transactions",
    categories: "Categories",
  },
  {
    locale: "uk",
    overview: "Огляд",
    transactions: "Транзакції",
    categories: "Категорії",
  },
] as const) {
  test(`the navigation marks the current screen in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);
    const nav = page.getByRole("navigation");
    await expect(nav).toHaveCount(1);
    const box = await nav.boundingBox();
    if (isPhone(page)) {
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBe((page.viewportSize()?.height ?? 0) - 12);
    } else {
      expect((await page.getByRole("banner").boundingBox())?.x).toBe(0);
    }

    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveText(overview);
    await nav.getByRole("link", { name: transactions }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions$`));
    await expect(current).toHaveText(transactions);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(transactions);
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page).toHaveTitle(`${transactions} | Spendly`);
    await expectNoViolations(page);

    await nav.getByRole("link", { name: categories }).click();
    await expect(current).toHaveText(categories);
    await expect(page).toHaveTitle(`${categories} | Spendly`);
    await pickAppTheme(page, locale, "dark");
    await expectNoViolations(page);
  });
}

for (const { locale, screens, empty, food } of [
  {
    locale: "en",
    screens: ["Overview", "Transactions", "Categories"],
    empty: ["No expenses in this period.", "No transactions in this period."],
    food: "Food",
  },
  {
    locale: "uk",
    screens: ["Огляд", "Транзакції", "Категорії"],
    empty: ["У цьому періоді немає витрат.", "У цьому періоді немає транзакцій."],
    food: "Їжа",
  },
] as const) {
  test(`every screen with its empty states has no accessibility violations in ${locale}`, async ({
    page,
  }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);
    const [overview, transactions, categories] = screens;
    const nav = page.getByRole("navigation");

    for (const name of ["light", "dark"] as const) {
      await pickAppTheme(page, locale, name);

      await nav.getByRole("link", { name: overview }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(overview);
      await expect(page.getByText(empty[0]).filter({ visible: true })).toBeVisible();
      await expect(page).toHaveTitle(`${overview} | Spendly`);
      await expectNoViolations(page);

      await nav.getByRole("link", { name: transactions }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(transactions);
      await expect(page.getByText(empty[1]).filter({ visible: true })).toBeVisible();
      await expect(page).toHaveTitle(`${transactions} | Spendly`);
      await expectNoViolations(page);

      await nav.getByRole("link", { name: categories }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(categories);
      await expect(page.getByRole("listitem").filter({ hasText: food })).toBeVisible();
      await expect(page).toHaveTitle(`${categories} | Spendly`);
      await expectNoViolations(page);
    }
  });
}

test("Tab reaches every control, and the bottom navigation covers none", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/transactions$/);
  for (const note of ["first", "second", "third"]) {
    const sheet = await openAddSheet(page, "en");
    await field(page, "Amount (UAH)").fill("10");
    await field(page, "Note (optional)").fill(note);
    await sheet.getByRole("button", { name: "Add", exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: note })).toBeVisible();
  }
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: "third" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add transaction" })).toBeVisible();

  const navTop = isPhone(page)
    ? ((await page.getByRole("navigation").boundingBox())?.y ?? 0)
    : Number.POSITIVE_INFINITY;
  const reached: string[] = [];
  for (;;) {
    expect(reached.length, `Tab stops: ${reached.join(", ")}`).toBeLessThan(60);
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return null;
      const { top, bottom } = element.getBoundingClientRect();
      return {
        name: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "",
        isInNav: element.closest("nav") !== null,
        top,
        bottom,
      };
    });
    if (!stop) break;
    reached.push(stop.name);
    expect(stop.top, `${stop.name} is on screen`).toBeGreaterThanOrEqual(0);
    if (!stop.isInNav) {
      expect(stop.bottom, `${stop.name} stays above the bottom navigation`).toBeLessThanOrEqual(
        navTop,
      );
    }
  }
  expect(reached).toEqual(
    expect.arrayContaining([
      "Overview",
      "Transactions",
      "Categories",
      expect.stringContaining("Account"),
      "Add transaction",
    ]),
  );
  expect(reached.filter((name) => /^Food\s?(first|second|third)/.test(name))).toHaveLength(3);

  const overview = page.getByRole("link", { name: "Overview", exact: true });
  await overview.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(page.getByRole("main")).toBeFocused();
  const previous = page.getByRole("button", { name: "Previous day", exact: true });
  await expect(previous).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(previous).toBeFocused();
});

type RecordedAnimation = { name: string; duration: number | string };

function recordViewTransitions() {
  const start = document.startViewTransition.bind(document);
  document.startViewTransition = (...args: Parameters<typeof start>) => {
    const transition = start(...args);
    transition.ready.then(
      () => {
        const animations = document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement?.startsWith("::view-transition") === true,
          )
          .map((animation) => ({
            name: animation instanceof CSSAnimation ? animation.animationName : "",
            duration: animation.effect?.getComputedTiming().duration ?? 0,
          }));
        Object.assign(window, { viewTransitionAnimations: animations });
      },
      () => Object.assign(window, { viewTransitionAnimations: [] }),
    );
    return transition;
  };
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`a screen change with reduced motion ${reducedMotion}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(recordViewTransitions);
    await signUpAndIn(page, "en", testInfo);
    await expect(page.getByText("No expenses in this period.")).toBeVisible();
    const nav = page.getByRole("navigation");
    const navBox = await nav.boundingBox();
    await page.evaluate(() => Reflect.deleteProperty(window, "viewTransitionAnimations"));

    await nav.getByRole("link", { name: "Transactions" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Transactions");
    await expect
      .poll(() => page.evaluate(() => Reflect.has(window, "viewTransitionAnimations")))
      .toBe(true);
    const animations: RecordedAnimation[] = await page.evaluate(() =>
      Reflect.get(window, "viewTransitionAnimations"),
    );

    if (reducedMotion === "reduce") {
      expect(animations.map(({ name }) => name)).not.toContain("page-rise-in");
      expect(animations.every(({ duration }) => duration === 0)).toBe(true);
    } else {
      expect(animations.map(({ name }) => name)).toEqual(
        expect.arrayContaining(["page-fade-out", "page-rise-in"]),
      );
    }
    expect(await nav.boundingBox()).toEqual(navBox);
  });
}
