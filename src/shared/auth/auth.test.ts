import { randomUUID } from "node:crypto";

import { and, eq, like } from "drizzle-orm";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { after } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import { categories, emailOutbox, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";
import { account, session, user, verification } from "@/shared/db/auth-schema";

import { auth } from "./auth";

const ORIGIN = "http://localhost:3000";
const PASSWORD = "correct horse battery";

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

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

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function startGoogleSignIn(headers?: Record<string, string>) {
  return post(
    "/sign-in/social",
    { provider: "google", callbackURL: "/en", errorCallbackURL: "/en/sign-in" },
    headers,
  );
}

function base64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

// Google's token endpoint answers the code exchange; Better Auth reads the profile from its ID token
function fakeGoogleTokenEndpoint(profile: { sub: string; email: string }) {
  const idToken = [
    base64Url({ alg: "RS256", typ: "JWT" }),
    base64Url({ ...profile, email_verified: true, name: "Google User" }),
    "signature",
  ].join(".");
  server.use(
    http.post(GOOGLE_TOKEN_URL, () =>
      HttpResponse.json({
        access_token: "access-token",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid email profile",
        id_token: idToken,
      }),
    ),
  );
}

function cookiesOf(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

// What the browser does: open Google's page, come back to the callback with a code
async function signInWithGoogle(profile: { sub: string; email: string }) {
  fakeGoogleTokenEndpoint(profile);
  const started = await startGoogleSignIn();
  const { url } = (await started.json()) as { url: string };
  const state = new URL(url).searchParams.get("state") ?? "";

  return auth.handler(
    new Request(`${ORIGIN}/api/auth/callback/google?code=google-code&state=${state}`, {
      headers: { cookie: cookiesOf(started), "x-real-ip": uniqueIp() },
    }),
  );
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

describe("Google sign-in", () => {
  test("starts at Google's page with the app's client and callback", async () => {
    const response = await startGoogleSignIn();

    expect(response.status).toBe(200);
    const { url } = (await response.json()) as { url: string };
    const google = new URL(url);
    expect(google.origin + google.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(google.searchParams.get("client_id")).toBe("test-google-client-id");
    expect(google.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/api/auth/callback/google`);
  });

  test("the first sign-in creates the account with the default categories and signs in", async () => {
    const email = uniqueEmail();

    const response = await signInWithGoogle({ sub: randomUUID(), email });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/en");
    expect(cookiesOf(response)).toContain("better-auth.session_token=");
    const [created] = await usersWithEmail(email);
    expect(created).toBeDefined();
    const defaults = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, created?.id ?? ""));
    expect(defaults.length).toBeGreaterThan(0);
  });

  test("a returning user signs in to the same account", async () => {
    const profile = { sub: randomUUID(), email: uniqueEmail() };
    await signInWithGoogle(profile);

    const response = await signInWithGoogle(profile);

    expect(response.headers.get("location")).toBe("/en");
    expect(cookiesOf(response)).toContain("better-auth.session_token=");
    expect(await usersWithEmail(profile.email)).toHaveLength(1);
  });

  // The app doesn't verify emails, so anyone could have signed up with this one
  test("isn't linked to a password account with the same email", async () => {
    const email = uniqueEmail();
    await signUp(email);

    const response = await signInWithGoogle({ sub: randomUUID(), email });

    expect(response.headers.get("location")).toBe("/en/sign-in?error=account_not_linked");
    expect(cookiesOf(response)).not.toContain("better-auth.session_token=");
    const [existing] = await usersWithEmail(email);
    const googleAccounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, existing?.id ?? ""), eq(account.providerId, "google")));
    expect(googleAccounts).toEqual([]);
  });
});

describe("rate limit", () => {
  test.each([
    ["sign-in", (ip: string) => signIn(uniqueEmail(), PASSWORD, { "x-real-ip": ip })],
    ["sign-up", (ip: string) => signUp(uniqueEmail(), PASSWORD, { "x-real-ip": ip })],
    ["Google sign-in", (ip: string) => startGoogleSignIn({ "x-real-ip": ip })],
    [
      "account deletion",
      (ip: string) => post("/delete-user", { password: PASSWORD }, { "x-real-ip": ip }),
    ],
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

describe("delete account", () => {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

  async function signedInWithPassword() {
    const email = uniqueEmail();
    await signUp(email);
    const cookie = (await signIn(email)).headers.get("set-cookie")?.split(";")[0] ?? "";
    const [created] = await usersWithEmail(email);

    return { id: created?.id ?? "", cookie };
  }

  async function signedInWithGoogle() {
    const email = uniqueEmail();
    const cookie = cookiesOf(await signInWithGoogle({ sub: randomUUID(), email }));
    const [created] = await usersWithEmail(email);

    return { id: created?.id ?? "", cookie };
  }

  function deleteAccount(cookie: string, body: Record<string, string> = {}) {
    return post("/delete-user", body, { cookie });
  }

  async function codeOf(response: Response) {
    const body = (await response.json()) as { code?: string };
    return body.code;
  }

  async function usersWithId(id: string) {
    return db.select({ id: user.id }).from(user).where(eq(user.id, id));
  }

  test("deletes a password account with all its data when the password is right", async () => {
    const { id, cookie } = await signedInWithPassword();
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.userId, id));
    await db.insert(transactions).values({
      userId: id,
      categoryId: category?.id ?? "",
      amountKopecks: 100,
      occurredOn: "2026-11-21",
    });

    const response = await deleteAccount(cookie, { password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/better-auth\.session_token=;/);
    expect(await usersWithId(id)).toEqual([]);
    expect(await db.select().from(account).where(eq(account.userId, id))).toEqual([]);
    expect(await db.select().from(session).where(eq(session.userId, id))).toEqual([]);
    expect(await db.select().from(categories).where(eq(categories.userId, id))).toEqual([]);
    expect(await db.select().from(transactions).where(eq(transactions.userId, id))).toEqual([]);
  });

  test("keeps the account when the password is wrong", async () => {
    const { id, cookie } = await signedInWithPassword();

    const response = await deleteAccount(cookie, { password: "wrong password" });

    expect(response.status).toBe(400);
    expect(await codeOf(response)).toBe("INVALID_PASSWORD");
    expect(await usersWithId(id)).toHaveLength(1);
  });

  // Better Auth alone accepts a session from the last day instead of the password
  test("a password account needs its password, even right after signing in", async () => {
    const { id, cookie } = await signedInWithPassword();

    const response = await deleteAccount(cookie);

    expect(response.status).toBe(400);
    expect(await codeOf(response)).toBe("PASSWORD_REQUIRED");
    expect(await usersWithId(id)).toHaveLength(1);
  });

  test("deletes a Google account signed in during the last day", async () => {
    const { id, cookie } = await signedInWithGoogle();

    const response = await deleteAccount(cookie);

    expect(response.status).toBe(200);
    expect(await usersWithId(id)).toEqual([]);
  });

  test("asks a Google account to sign in again when its session is older than a day", async () => {
    const { id, cookie } = await signedInWithGoogle();
    await db
      .update(session)
      .set({ createdAt: new Date(Date.now() - TWO_DAYS_MS) })
      .where(eq(session.userId, id));

    const response = await deleteAccount(cookie);

    expect(response.status).toBe(400);
    expect(await codeOf(response)).toBe("SESSION_EXPIRED");
    expect(await usersWithId(id)).toHaveLength(1);
  });

  test("refuses a request without a session", async () => {
    const response = await deleteAccount("", { password: PASSWORD });

    expect(response.status).toBe(401);
  });
});

describe("password reset", () => {
  const RESET_PAGE = "/uk/reset-password";
  const NEW_PASSWORD = "a brand new password";
  const background: Promise<unknown>[] = [];

  beforeEach(() => {
    // Better Auth hands the email to after(), which Next runs once the response is out
    vi.mocked(after).mockImplementation((task) => {
      background.push(typeof task === "function" ? Promise.resolve().then(task) : task);
    });
  });

  async function requestReset(email: string, headers?: Record<string, string>) {
    const response = await post(
      "/request-password-reset",
      { email, redirectTo: RESET_PAGE },
      headers,
    );
    await Promise.all(background.splice(0));
    return response;
  }

  async function userIdOf(email: string) {
    const [found] = await usersWithEmail(email);
    if (!found) throw new Error(`No user with ${email}`);
    return found.id;
  }

  function outboxOf(userId: string) {
    return db
      .select({ kind: emailOutbox.kind, locale: emailOutbox.locale, status: emailOutbox.status })
      .from(emailOutbox)
      .where(eq(emailOutbox.userId, userId));
  }

  // What the emailed link carries; E2E reads it the same way
  async function resetTokenOf(email: string) {
    const [row] = await db
      .select({ identifier: verification.identifier })
      .from(verification)
      .where(
        and(
          eq(verification.value, await userIdOf(email)),
          like(verification.identifier, "reset-password:%"),
        ),
      );
    if (!row) throw new Error(`No reset token for ${email}`);
    return row.identifier.slice("reset-password:".length);
  }

  function resetPassword(token: string, newPassword = NEW_PASSWORD) {
    return post("/reset-password", { token, newPassword });
  }

  describe("request", () => {
    test("records an email in the page's language for a password account", async () => {
      const email = uniqueEmail();
      await signUp(email);

      const response = await requestReset(email);

      expect(response.status).toBe(200);
      // Tests have no Resend key, so the email stays pending
      expect(await outboxOf(await userIdOf(email))).toEqual([
        { kind: "password_reset", locale: "uk", status: "pending" },
      ]);
    });

    test("answers the same for an unknown email", async () => {
      const email = uniqueEmail();
      await signUp(email);

      const known = await requestReset(email);
      const unknown = await requestReset(uniqueEmail());

      expect(unknown.status).toBe(known.status);
      expect(await unknown.json()).toEqual(await known.json());
    });

    test("sends nothing to a Google-only account", async () => {
      const email = uniqueEmail();
      await signInWithGoogle({ sub: randomUUID(), email });

      expect((await requestReset(email)).status).toBe(200);
      expect(await outboxOf(await userIdOf(email))).toEqual([]);
    });

    test("sends an account no more than 3 emails an hour", async () => {
      const email = uniqueEmail();
      await signUp(email);

      for (let count = 1; count <= 4; count++) {
        expect((await requestReset(email)).status).toBe(200);
      }

      expect(await outboxOf(await userIdOf(email))).toHaveLength(3);
    });

    test("refuses the 4th request from one IP in a minute", async () => {
      const ip = uniqueIp();

      for (let count = 1; count <= 3; count++) {
        expect((await requestReset(uniqueEmail(), { "x-real-ip": ip })).status).toBe(200);
      }

      expect((await requestReset(uniqueEmail(), { "x-real-ip": ip })).status).toBe(429);
    });
  });

  describe("link", () => {
    test("opens the reset page with the token", async () => {
      const email = uniqueEmail();
      await signUp(email);
      await requestReset(email);
      const token = await resetTokenOf(email);

      const response = await auth.handler(
        new Request(`${ORIGIN}/api/auth/reset-password/${token}?callbackURL=${RESET_PAGE}`),
      );

      expect(response.headers.get("location")).toBe(`${ORIGIN}${RESET_PAGE}?token=${token}`);
    });

    test("opens the reset page with an error for an unknown token", async () => {
      const response = await auth.handler(
        new Request(`${ORIGIN}/api/auth/reset-password/unknown?callbackURL=${RESET_PAGE}`),
      );

      expect(response.headers.get("location")).toBe(`${ORIGIN}${RESET_PAGE}?error=INVALID_TOKEN`);
    });
  });

  describe("new password", () => {
    test("replaces the old password and ends every session", async () => {
      const email = uniqueEmail();
      await signUp(email);
      const cookie = (await signIn(email)).headers.get("set-cookie")?.split(";")[0] ?? "";
      await requestReset(email);

      const response = await resetPassword(await resetTokenOf(email));

      expect(response.status).toBe(200);
      expect((await signIn(email)).status).toBe(401);
      expect((await signIn(email, NEW_PASSWORD)).status).toBe(200);
      expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
    });

    test("refuses a token that was already used", async () => {
      const email = uniqueEmail();
      await signUp(email);
      await requestReset(email);
      const token = await resetTokenOf(email);
      await resetPassword(token);

      const response = await resetPassword(token, "yet another password");

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "INVALID_TOKEN" });
      expect((await signIn(email, NEW_PASSWORD)).status).toBe(200);
    });

    test("refuses a password shorter than 8 characters and keeps the old one", async () => {
      const email = uniqueEmail();
      await signUp(email);
      await requestReset(email);

      const response = await resetPassword(await resetTokenOf(email), "1234567");

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "PASSWORD_TOO_SHORT" });
      expect((await signIn(email)).status).toBe(200);
    });
  });
});
