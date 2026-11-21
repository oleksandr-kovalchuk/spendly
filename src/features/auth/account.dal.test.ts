import { eq } from "drizzle-orm";
import { expect, test, vi } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { account } from "@/shared/db/auth-schema";
import { db } from "@/shared/db/client";

import { hasPassword } from "./account.dal";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));

function signIn(cookie: string) {
  requestHeaders.current = new Headers({ cookie });
}

test("a user who signed up with a password has one", async () => {
  const { cookie } = await createUser();
  signIn(cookie);

  expect(await hasPassword()).toBe(true);
});

test("a user with only a Google account has no password", async () => {
  const { id, cookie } = await createUser();
  await db
    .update(account)
    .set({ providerId: "google", password: null })
    .where(eq(account.userId, id));

  signIn(cookie);

  expect(await hasPassword()).toBe(false);
});
