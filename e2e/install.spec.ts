import { expect, test } from "@playwright/test";
import { z } from "zod";

const manifestSchema = z.object({
  name: z.string(),
  start_url: z.string(),
  display: z.string(),
  icons: z.array(z.object({ src: z.string(), sizes: z.string(), purpose: z.string().optional() })),
});

test("the app can be installed on a phone's home screen", async ({ page, request }) => {
  await page.goto("/en/sign-in");

  const href = await page.locator('head link[rel="manifest"]').first().getAttribute("href");
  expect(href).not.toBeNull();
  const response = await request.get(href ?? "");
  expect(response.ok()).toBe(true);
  const manifest = manifestSchema.parse(await response.json());

  expect(manifest).toMatchObject({ name: "Spendly", start_url: "/", display: "standalone" });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.headers()["content-type"]).toBe("image/png");
  }
});
