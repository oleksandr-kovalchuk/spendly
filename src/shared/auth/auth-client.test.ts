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
