import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/shared/db/client";
import { account, session, user } from "@/shared/db/auth-schema";

import { auth } from "./auth";

const ORIGIN = "http://localhost:3000";
const PASSWORD = "correct horse battery";

function uniqueEmail() {
  return `${randomUUID()}@example.com`;
}

function uniqueIp() {
  const [a = 0, b = 0, c = 0] = randomUUID()
    .split("-")
    .map((part) => Number.parseInt(part.slice(0, 2), 16));
  return `10.${a}.${b}.${c}`;
}

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        "x-real-ip": uniqueIp(),
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

function signUp(email: string, password = PASSWORD, headers?: Record<string, string>) {
  return post("/sign-up/email", { email, password, name: "" }, headers);
}

function signIn(email: string, password = PASSWORD, headers?: Record<string, string>) {
  return post("/sign-in/email", { email, password }, headers);
}

function usersWithEmail(email: string) {
  return db.select().from(user).where(eq(user.email, email));
}

describe("sign up", () => {
  test("creates the account without signing in", async () => {
    const email = uniqueEmail();

    const response = await signUp(email);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    const [created] = await usersWithEmail(email);
    expect(created).toBeDefined();
    expect(
      await db
        .select()
        .from(session)
        .where(eq(session.userId, created?.id ?? "")),
    ).toEqual([]);
  });

  test("answers the same for an email that already has an account, and creates no second one", async () => {
    const email = uniqueEmail();
    const first = await signUp(email);
    const second = await signUp(email, "another password");

    expect(second.status).toBe(first.status);
    expect(second.headers.get("set-cookie")).toBeNull();
    const firstBody = (await first.json()) as Record<string, unknown>;
    const secondBody = (await second.json()) as Record<string, unknown>;
    expect(Object.keys(secondBody).toSorted()).toEqual(Object.keys(firstBody).toSorted());
    expect(secondBody.token).toBe(firstBody.token);
    expect(await usersWithEmail(email)).toHaveLength(1);
  });

  test.each([
    ["a password shorter than 8 characters", uniqueEmail(), "1234567"],
    ["a password longer than 128 characters", uniqueEmail(), "x".repeat(129)],
    ["a malformed email", "not-an-email", PASSWORD],
  ])("refuses %s", async (_name, email, password) => {
    const response = await signUp(email, password);

    expect(response.status).toBe(400);
    expect(await usersWithEmail(email)).toEqual([]);
  });

  test("accepts passwords of 8 and 128 characters", async () => {
    expect((await signUp(uniqueEmail(), "12345678")).status).toBe(200);
    expect((await signUp(uniqueEmail(), "x".repeat(128))).status).toBe(200);
  });

  test("stores a password hash, not the password", async () => {
    const email = uniqueEmail();
    await signUp(email);

    const [created] = await usersWithEmail(email);
    const rows = await db
      .select()
      .from(account)
      .where(eq(account.userId, created?.id ?? ""));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.password).toBeTruthy();
    expect(rows[0]?.password).not.toContain(PASSWORD);
  });
});

describe("sign in", () => {
  test("signs in with the right credentials and sets a persistent session cookie", async () => {
    const email = uniqueEmail();
    await signUp(email);

    const response = await signIn(email);

    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("better-auth.session_token=");
    expect(cookie).toMatch(/Max-Age=\d+/i);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  test("gives the same answer for a wrong password and an unknown email", async () => {
    const email = uniqueEmail();
    await signUp(email);

    const wrongPassword = await signIn(email, "wrong password");
    const unknownEmail = await signIn(uniqueEmail());

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });
});

describe("rate limit", () => {
  test.each([
    ["sign-in", (ip: string) => signIn(uniqueEmail(), PASSWORD, { "x-real-ip": ip })],
    ["sign-up", (ip: string) => signUp(uniqueEmail(), PASSWORD, { "x-real-ip": ip })],
  ])("refuses the 11th %s attempt from one IP in a minute", async (_name, attempt) => {
    const ip = uniqueIp();

    for (let count = 1; count <= 10; count++) {
      expect((await attempt(ip)).status).not.toBe(429);
    }
    const refused = await attempt(ip);

    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("x-retry-after"))).toBeGreaterThan(0);
  });

  test("counts each IP separately", async () => {
    const busyIp = uniqueIp();
    for (let count = 1; count <= 11; count++) {
      await signIn(uniqueEmail(), PASSWORD, { "x-real-ip": busyIp });
    }

    expect((await signIn(uniqueEmail(), PASSWORD, { "x-real-ip": uniqueIp() })).status).toBe(401);
  });
});

describe("sign out", () => {
  test("ends the session on that device", async () => {
    const email = uniqueEmail();
    await signUp(email);
    const cookie = (await signIn(email)).headers.get("set-cookie")?.split(";")[0] ?? "";
    const headers = new Headers({ cookie });
    expect(await auth.api.getSession({ headers })).not.toBeNull();

    const response = await post("/sign-out", {}, { cookie });

    expect(response.status).toBe(200);
    expect(await auth.api.getSession({ headers })).toBeNull();
  });
});
