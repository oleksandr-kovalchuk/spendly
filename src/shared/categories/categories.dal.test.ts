import { readFile } from "node:fs/promises";

import { and, eq, TransactionRollbackError } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { categories } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";
import { user } from "@/shared/db/auth-schema";

import { listCategories } from "./categories.dal";
import { DEFAULT_CATEGORIES } from "./default-categories";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));

function signIn(cookie: string) {
  requestHeaders.current = new Headers({ cookie });
}

const BACKFILL_MIGRATION = "drizzle/0002_backfill_default_categories.sql";

function keysOf(list: { type: string; defaultKey: string | null }[]) {
  return list.map(({ type, defaultKey }) => `${type}:${defaultKey}`).toSorted();
}

describe("default categories", () => {
  test("sign-up gives the user every default category, with no custom name", async () => {
    const { cookie } = await createUser();
    signIn(cookie);

    const found = await listCategories();

    expect(keysOf(found)).toEqual(keysOf([...DEFAULT_CATEGORIES]));
    expect(found.every((category) => category.name === null)).toBe(true);
  });

  test("lists the defaults in their documented order", async () => {
    const { cookie } = await createUser();
    signIn(cookie);

    const found = await listCategories();

    expect(found.map(({ type, defaultKey }) => `${type}:${defaultKey}`)).toEqual(
      DEFAULT_CATEGORIES.map(({ type, defaultKey }) => `${type}:${defaultKey}`),
    );
  });

  test("a user who deleted every category doesn't get the defaults back", async () => {
    const { id, cookie } = await createUser();
    await db.delete(categories).where(eq(categories.userId, id));
    signIn(cookie);

    expect(await listCategories()).toEqual([]);
  });

  test("a user sees only their own categories", async () => {
    const [first, second] = await Promise.all([createUser(), createUser()]);

    const found = await db.select().from(categories).where(eq(categories.userId, first.id));

    expect(found.every((category) => category.userId === first.id)).toBe(true);
    expect(found).toHaveLength(DEFAULT_CATEGORIES.length);
    signIn(second.cookie);
    expect((await listCategories()).map(({ id }) => id)).not.toContain(found[0]?.id);
  });

  test("the database refuses a duplicate default and a category without a name", async () => {
    const { id } = await createUser();

    await expect(
      db.insert(categories).values({ userId: id, type: "expense", defaultKey: "food" }),
    ).rejects.toThrow();
    await expect(db.insert(categories).values({ userId: id, type: "expense" })).rejects.toThrow();
  });

  test("the database refuses an icon on a default and an icon outside the set", async () => {
    const { id } = await createUser();

    await expect(
      db
        .update(categories)
        .set({ icon: "coffee" })
        .where(and(eq(categories.userId, id), eq(categories.defaultKey, "food"))),
    ).rejects.toThrow();
    await expect(
      // @ts-expect-error: the column's type allows only the set, the check guards other writers
      db.insert(categories).values({ userId: id, type: "expense", name: "Coffee", icon: "rocket" }),
    ).rejects.toThrow();
  });

  test("the database refuses a renamed default's name outside 1 to 40 characters", async () => {
    const { id } = await createUser();
    const rename = (name: string) =>
      db
        .update(categories)
        .set({ name })
        .where(and(eq(categories.userId, id), eq(categories.defaultKey, "food")));

    await expect(rename("")).rejects.toThrow();
    await expect(rename("x".repeat(41))).rejects.toThrow();
    await expect(rename("x".repeat(40))).resolves.toBeDefined();
  });
});

describe("the backfill migration", () => {
  test("gives users that have no categories the defaults, and is safe to run again", async () => {
    const lateUserId = `late-${crypto.randomUUID()}`;
    await db.insert(user).values({
      id: lateUserId,
      name: "",
      email: `${lateUserId}@example.com`,
      emailVerified: false,
    });
    const { id: signedUpId } = await createUser();
    const sql = await readFile(BACKFILL_MIGRATION, "utf8");
    let found: { type: string; defaultKey: string | null }[] = [];
    let signedUpCount = 0;

    // Rolled back: it restores defaults for every user, including ones parallel tests delete
    await db
      .transaction(async (tx) => {
        await tx.execute(sql);
        await tx.execute(sql);
        found = await tx.select().from(categories).where(eq(categories.userId, lateUserId));
        signedUpCount = await tx.$count(categories, eq(categories.userId, signedUpId));
        tx.rollback();
      })
      .catch((error: unknown) => {
        if (!(error instanceof TransactionRollbackError)) throw error;
      });

    expect(keysOf(found)).toEqual(keysOf([...DEFAULT_CATEGORIES]));
    expect(signedUpCount).toBe(DEFAULT_CATEGORIES.length);
  });
});
