import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { auth } from "./auth";
import { authedAction, UNAUTHORIZED_ERROR } from "./authed-action";
import { getCurrentUser, requireUser } from "./session";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
// Next's request APIs throw outside a request; the page's language comes from its URL
vi.mock("next-intl/server", () => ({ getLocale: () => Promise.resolve("uk") }));

const ORIGIN = "http://localhost:3000";

async function signInAs(email: string) {
  const body = { email, password: "correct horse battery" };
  const headers = {
    "content-type": "application/json",
    origin: ORIGIN,
    "x-real-ip": `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  };
  await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-up/email`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, name: "" }),
    }),
  );
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/sign-in/email`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("getCurrentUser", () => {
  test("is null without a session cookie", async () => {
    expect(await getCurrentUser()).toBeNull();
  });

  test("is null for a cookie that is not a session", async () => {
    requestHeaders.current = new Headers({ cookie: "better-auth.session_token=forged.value" });

    expect(await getCurrentUser()).toBeNull();
  });

  test("returns only the id and email of the signed-in user", async () => {
    const email = `${randomUUID()}@example.com`;
    requestHeaders.current = new Headers({ cookie: await signInAs(email) });

    expect(await getCurrentUser()).toEqual({ id: expect.any(String), email });
  });
});

describe("authedAction", () => {
  test("rejects a request without a session and never runs the action", async () => {
    const run = vi.fn(() => Promise.resolve("done"));
    const action = authedAction.action(run);

    const result = await action();

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
    expect(result.data).toBeUndefined();
    expect(run).not.toHaveBeenCalled();
  });

  test("runs the action with the user from the session", async () => {
    const email = `${randomUUID()}@example.com`;
    requestHeaders.current = new Headers({ cookie: await signInAs(email) });

    const result = await authedAction.action(({ ctx }) => Promise.resolve(ctx.user.email))();

    expect(result.data).toBe(email);
  });
});

describe("requireUser", () => {
  test("returns the signed-in user", async () => {
    const email = `${randomUUID()}@example.com`;
    requestHeaders.current = new Headers({ cookie: await signInAs(email) });

    expect(await requireUser()).toEqual({ id: expect.any(String), email });
  });

  test("without a session, sends to the sign-in page in the page's language", async () => {
    // Next's redirect() throws an error whose digest holds the target
    await expect(requireUser()).rejects.toMatchObject({
      digest: expect.stringContaining(";/uk/sign-in;"),
    });
  });
});
