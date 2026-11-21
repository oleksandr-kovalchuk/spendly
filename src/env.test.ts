import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// An empty value counts as unset (emptyStringAsUndefined)
async function loadEnv(google: { clientId?: string; clientSecret?: string }) {
  vi.stubEnv("GOOGLE_CLIENT_ID", google.clientId ?? "");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", google.clientSecret ?? "");
  vi.resetModules();
  const { env } = await import("./env");
  return env;
}

test.each([
  ["a Google client ID without its secret", { clientId: "id" }],
  ["a Google client secret without its ID", { clientSecret: "secret" }],
])("refuses %s", async (_name, google) => {
  // createEnv prints the issues before it throws
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  await expect(loadEnv(google)).rejects.toThrow("Invalid environment variables");
});

test("accepts both Google keys or neither", async () => {
  const withGoogle = await loadEnv({ clientId: "id", clientSecret: "secret" });
  expect(withGoogle.GOOGLE_CLIENT_ID).toBe("id");
  expect(withGoogle.GOOGLE_CLIENT_SECRET).toBe("secret");

  const withoutGoogle = await loadEnv({});
  expect(withoutGoogle.GOOGLE_CLIENT_ID).toBeUndefined();
  expect(withoutGoogle.GOOGLE_CLIENT_SECRET).toBeUndefined();
});

test("refuses a fixed E2E day on Vercel", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubEnv("E2E_TODAY", "2026-03-18");
  vi.stubEnv("VERCEL_ENV", "preview");

  await expect(loadEnv({})).rejects.toThrow("Invalid environment variables");
});
