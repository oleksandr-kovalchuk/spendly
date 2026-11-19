import { readFile } from "node:fs/promises";

import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { categories } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";
import { user } from "@/shared/db/auth-schema";

import { listCategories } from "./categories.dal";
import { DEFAULT_CATEGORIES } from "./default-categories";

const BACKFILL_MIGRATION = "drizzle/0002_backfill_default_categories.sql";

function keysOf(list: { type: string; defaultKey: string | null }[]) {
  return list.map(({ type, defaultKey }) => `${type}:${defaultKey}`).toSorted();
}

describe("default categories", () => {
  test("sign-up gives the user every default category, with no custom name", async () => {
    const { id } = await createUser();

    const found = await listCategories(id);

    expect(keysOf(found)).toEqual(keysOf([...DEFAULT_CATEGORIES]));
    expect(found.every((category) => category.name === null)).toBe(true);
  });

  test("lists the defaults in their documented order", async () => {
    const { id } = await createUser();

    const found = await listCategories(id);

    expect(found.map(({ type, defaultKey }) => `${type}:${defaultKey}`)).toEqual(
      DEFAULT_CATEGORIES.map(({ type, defaultKey }) => `${type}:${defaultKey}`),
    );
  });

  test("a user whose sign-up hook failed gets the defaults when the list is first read", async () => {
    const { id } = await createUser();
    await db.delete(categories).where(eq(categories.userId, id));

    expect(keysOf(await listCategories(id))).toEqual(keysOf([...DEFAULT_CATEGORIES]));
  });

  test("a user sees only their own categories", async () => {
    const [first, second] = await Promise.all([createUser(), createUser()]);

    const found = await db.select().from(categories).where(eq(categories.userId, first.id));

    expect(found.every((category) => category.userId === first.id)).toBe(true);
    expect(found).toHaveLength(DEFAULT_CATEGORIES.length);
    expect((await listCategories(second.id)).map(({ id }) => id)).not.toContain(found[0]?.id);
  });

  test("the database refuses a duplicate default and a category without a name", async () => {
    const { id } = await createUser();

    await expect(
      db.insert(categories).values({ userId: id, type: "expense", defaultKey: "food" }),
    ).rejects.toThrow();
    await expect(db.insert(categories).values({ userId: id, type: "expense" })).rejects.toThrow();
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

    await db.execute(sql);
    await db.execute(sql);

    const found = await db.select().from(categories).where(eq(categories.userId, lateUserId));
    expect(keysOf(found)).toEqual(keysOf([...DEFAULT_CATEGORIES]));
    expect(await db.$count(categories, eq(categories.userId, signedUpId))).toBe(
      DEFAULT_CATEGORIES.length,
    );
  });
});
