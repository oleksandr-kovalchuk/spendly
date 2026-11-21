import { afterEach, expect, test, vi } from "vitest";

import { authClient } from "./auth-client";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function jsonBodyOf(init: RequestInit | undefined): unknown {
  return typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
}

function respondWith(response: Response) {
  fetchMock.mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
}

test("sign-in posts the credentials as JSON to Better Auth's route", async () => {
  respondWith(Response.json({ token: "t" }));

  const result = await authClient.signIn.email({ email: "a@example.com", password: "secret12" });

  expect(result).toEqual({ error: null });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/sign-in/email");
  expect(init?.method).toBe("POST");
  expect(init?.headers).toEqual({ "Content-Type": "application/json" });
  expect(jsonBodyOf(init)).toEqual({ email: "a@example.com", password: "secret12" });
});

test("sign-up sends the name Better Auth requires", async () => {
  respondWith(Response.json({ user: {} }));

  await authClient.signUp.email({ email: "a@example.com", password: "secret12", name: "" });

  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/sign-up/email");
  expect(jsonBodyOf(init)).toEqual({
    email: "a@example.com",
    password: "secret12",
    name: "",
  });
});

const GOOGLE_SIGN_IN = {
  provider: "google",
  callbackURL: "/en",
  errorCallbackURL: "/en/sign-in",
} as const;
const GOOGLE_PAGE = "https://accounts.google.com/o/oauth2/v2/auth?client_id=x";

test("Google sign-in posts the provider and return URLs, and returns Google's page", async () => {
  respondWith(Response.json({ url: GOOGLE_PAGE, redirect: true }));

  const result = await authClient.signIn.social(GOOGLE_SIGN_IN);

  expect(result).toEqual({ error: null, url: GOOGLE_PAGE });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/sign-in/social");
  expect(init?.method).toBe("POST");
  expect(jsonBodyOf(init)).toEqual({
    provider: "google",
    callbackURL: "/en",
    errorCallbackURL: "/en/sign-in",
  });
});

test("Google sign-in returns a failure's status", async () => {
  respondWith(new Response("Too many requests", { status: 429 }));

  expect(await authClient.signIn.social(GOOGLE_SIGN_IN)).toEqual({
    error: { status: 429, code: undefined },
  });
});

test("Google sign-in without a URL to open is a failure", async () => {
  respondWith(Response.json({ redirect: false }));

  expect(await authClient.signIn.social(GOOGLE_SIGN_IN)).toEqual({ error: { status: 200 } });
});

// Better Auth answers 415 to a POST without a JSON content type, even one with nothing to send
test("sign-out posts an empty JSON body", async () => {
  respondWith(Response.json({ success: true }));

  expect(await authClient.signOut()).toEqual({ error: null });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/sign-out");
  expect(init?.method).toBe("POST");
  expect(init?.headers).toEqual({ "Content-Type": "application/json" });
  expect(jsonBodyOf(init)).toEqual({});
});

test("a failure returns the status and Better Auth's error code", async () => {
  respondWith(Response.json({ code: "INVALID_EMAIL_OR_PASSWORD", message: "x" }, { status: 401 }));

  const result = await authClient.signIn.email({ email: "a@example.com", password: "wrong" });

  expect(result).toEqual({ error: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD" } });
});

test("a failure without a JSON body still returns its status", async () => {
  respondWith(new Response("Too many requests", { status: 429 }));

  const result = await authClient.signIn.email({ email: "a@example.com", password: "x" });

  expect(result).toEqual({ error: { status: 429, code: undefined } });
});

test("a request that never reaches the server is a failure, not an exception", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  vi.stubGlobal("fetch", fetchMock);

  expect(await authClient.signOut()).toEqual({ error: { status: 0 } });
});

test("a password reset request posts the email and the reset page's URL", async () => {
  respondWith(Response.json({ status: true, message: "If this email exists…" }));

  const result = await authClient.requestPasswordReset({
    email: "a@example.com",
    redirectTo: "/en/reset-password",
  });

  expect(result).toEqual({ error: null });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/request-password-reset");
  expect(jsonBodyOf(init)).toEqual({ email: "a@example.com", redirectTo: "/en/reset-password" });
});

test("a password reset posts the token and the new password", async () => {
  respondWith(Response.json({ status: true }));

  const result = await authClient.resetPassword({ token: "token123", newPassword: "secret123" });

  expect(result).toEqual({ error: null });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/reset-password");
  expect(jsonBodyOf(init)).toEqual({ token: "token123", newPassword: "secret123" });
});

test("account deletion posts the password", async () => {
  respondWith(Response.json({ success: true, message: "User deleted" }));

  const result = await authClient.deleteUser({ password: "secret123" });

  expect(result).toEqual({ error: null });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/auth/delete-user");
  expect(jsonBodyOf(init)).toEqual({ password: "secret123" });
});

// A Google account has no password: Better Auth checks that its session is recent instead
test("account deletion without a password posts an empty JSON body", async () => {
  respondWith(Response.json({ success: true, message: "User deleted" }));

  await authClient.deleteUser({});

  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(jsonBodyOf(init)).toEqual({});
});
