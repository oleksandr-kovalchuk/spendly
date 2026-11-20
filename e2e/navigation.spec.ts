import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "correct horse battery";

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
  const [email, password, signUp, signIn] =
    locale === "en"
      ? ["Email", "Password", "Sign up", "Sign in"]
      : ["Електронна пошта", "Пароль", "Зареєструватися", "Увійти"];
  await page.goto(`/${locale}/sign-up`);
  await field(page, email).fill(
    `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}@example.com`,
  );
  await field(page, password).fill(PASSWORD);
  await page.getByRole("button", { name: signUp }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/sign-in\\?`));
  await field(page, password).fill(PASSWORD);
  await page.getByRole("button", { name: signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}$`));
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

test("signed-out pages show no app navigation", async ({ page }) => {
  await page.goto("/en/sign-in");

  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Transactions" })).toHaveCount(0);
});

for (const { locale, overview, transactions, categories, dark } of [
  {
    locale: "en",
    overview: "Overview",
    transactions: "Transactions",
    categories: "Categories",
    dark: "Dark",
  },
  {
    locale: "uk",
    overview: "Огляд",
    transactions: "Транзакції",
    categories: "Категорії",
    dark: "Темна",
  },
] as const) {
  test(`the navigation marks the current screen in ${locale}`, async ({ page }, testInfo) => {
    await signUpAndIn(page, locale, testInfo);
    // One navigation is displayed: the bottom bar on a phone, the sidebar on a desktop
    const nav = page.getByRole("navigation");
    await expect(nav).toHaveCount(1);
    const box = await nav.boundingBox();
    if (isPhone(page)) {
      // Fixed to the bottom edge of the screen
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBe(page.viewportSize()?.height);
    } else {
      // The sidebar sits at the start edge
      expect((await page.getByRole("banner").boundingBox())?.x).toBe(0);
    }

    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveText(overview);
    await nav.getByRole("link", { name: transactions }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/transactions$`));
    await expect(current).toHaveText(transactions);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(transactions);
    // Focus moves from the link to the new screen
    await expect(page.getByRole("main")).toBeFocused();
    // The title streams in after a client-side navigation
    await expect(page).toHaveTitle(`${transactions} | Spendly`);
    await expectNoViolations(page);

    await nav.getByRole("link", { name: categories }).click();
    await expect(current).toHaveText(categories);
    await expect(page).toHaveTitle(`${categories} | Spendly`);
    await page.getByRole("button", { name: dark, exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expectNoViolations(page);
  });
}

test("Tab reaches every control, and the bottom navigation covers none", async ({
  page,
}, testInfo) => {
  await signUpAndIn(page, "en", testInfo);
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/transactions$/);
  for (const note of ["first", "second", "third"]) {
    await field(page, "Amount (UAH)").fill("10");
    await field(page, "Note (optional)").fill(note);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("listitem").filter({ hasText: note })).toBeVisible();
  }
  await page.reload();
  // The page streams in after the shell: wait for the list and the form, not the navigation's items
  await expect(page.getByRole("listitem").filter({ hasText: "third" })).toBeVisible();
  await expect(field(page, "Amount (UAH)")).toBeVisible();

  const navTop = isPhone(page)
    ? ((await page.getByRole("navigation").boundingBox())?.y ?? 0)
    : Number.POSITIVE_INFINITY;
  const reached: string[] = [];
  // Until focus leaves the page after its last control
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
    expect.arrayContaining(["Overview", "Transactions", "Categories", "Sign out", "Edit Food"]),
  );

  const overview = page.getByRole("link", { name: "Overview", exact: true });
  await overview.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  // The next Tab starts in the new screen, not after the link
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Day", exact: true })).toBeFocused();
});

type RecordedAnimation = { name: string; duration: number | string };

// Records the animations of the next view transition once it starts
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
      // A skipped transition has no animations to record
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
      // The browser may still create zero-length animations: nothing moves
      expect(animations.map(({ name }) => name)).not.toContain("page-rise-in");
      expect(animations.every(({ duration }) => duration === 0)).toBe(true);
    } else {
      expect(animations.map(({ name }) => name)).toEqual(
        expect.arrayContaining(["page-fade-out", "page-rise-in"]),
      );
    }
    // The navigation doesn't move
    expect(await nav.boundingBox()).toEqual(navBox);
  });
}
