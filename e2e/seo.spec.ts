import { expect, test } from "@playwright/test";

for (const locale of ["en", "uk"] as const) {
  test(`a public page names its canonical URL and its translations in ${locale}`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/sign-in`);

    // The links come twice, from the prerendered shell and the streamed page, like the robots meta;
    // the host is the app's public URL (metadataBase), not necessarily the test server's
    const canonical = page.locator('head link[rel="canonical"]');
    await expect(canonical.first()).toBeAttached();
    for (const link of await canonical.all()) {
      await expect(link).toHaveAttribute("href", new RegExp(`^https?://[^/]+/${locale}/sign-in$`));
    }
    for (const other of ["en", "uk"]) {
      const alternate = page.locator(`head link[rel="alternate"][hreflang="${other}"]`);
      await expect(alternate.first()).toHaveAttribute("href", new RegExp(`/${other}/sign-in$`));
    }
  });
}

test("the password pages are kept out of search results", async ({ page }) => {
  for (const path of ["/en/forgot-password", "/en/reset-password"]) {
    await page.goto(path);

    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("robots.txt points to the sitemap, which lists the public pages", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/^Sitemap: \S+\/sitemap\.xml$/m);
  expect(robots).toContain("Disallow: /api/");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/en/sign-in", "/uk/sign-up", "/en/privacy"]) {
    expect(sitemap).toContain(`${path}</loc>`);
  }
  expect(sitemap).not.toContain("/transactions");
});
