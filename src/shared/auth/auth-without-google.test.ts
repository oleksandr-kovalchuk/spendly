import { afterAll, expect, test, vi } from "vitest";

const ORIGIN = "http://localhost:3000";

afterAll(() => {
  vi.unstubAllEnvs();
});

// As on Vercel previews, whose changing hosts Google's OAuth client can't list
async function loadAuthWithoutGoogle() {
  vi.stubEnv("GOOGLE_CLIENT_ID", "");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
  vi.resetModules();
  return import("./auth");
}

test("without Google keys, Google sign-in is off and its route refuses to start", async () => {
  const { auth, isGoogleSignInEnabled } = await loadAuthWithoutGoogle();

  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN, "x-real-ip": "10.0.0.1" },
      body: JSON.stringify({ provider: "google", callbackURL: "/en" }),
    }),
  );

  expect(isGoogleSignInEnabled).toBe(false);
  expect(response.status).toBe(404);
});
