import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

// An empty value counts as unset (emptyStringAsUndefined)
async function loadSiteUrl(appUrl: string, productionHost: string) {
  vi.stubEnv("BETTER_AUTH_URL", appUrl);
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", productionHost);
  vi.resetModules();
  const { SITE_URL } = await import("./site-url");
  return SITE_URL;
}

test("the app's public URL is the site's URL", async () => {
  expect(await loadSiteUrl("https://spendly.example", "spendly.vercel.app")).toBe(
    "https://spendly.example",
  );
});

test("a preview, without the app's URL, names the production host", async () => {
  expect(await loadSiteUrl("", "spendly.vercel.app")).toBe("https://spendly.vercel.app");
});

test("without either, the app refuses to start", async () => {
  await expect(loadSiteUrl("", "")).rejects.toThrow("BETTER_AUTH_URL is not set");
});
