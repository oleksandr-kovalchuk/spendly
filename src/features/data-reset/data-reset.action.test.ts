import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UNAUTHORIZED_ERROR } from "@/shared/auth/authed-action";
import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";
import { DEFAULT_CATEGORIES } from "@/shared/categories/default-categories";
import { categories, transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { clearTransactions } from "./clear-transactions.action";
import { resetData } from "./reset-data.action";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));

const DEFAULT_KEYS = DEFAULT_CATEGORIES.map(({ type, defaultKey }) => `${type}:${defaultKey}`);

function keysOf(list: { type: string; defaultKey: string | null; name: string | null }[]) {
  return list.map(({ type, defaultKey, name }) => `${type}:${defaultKey ?? name}`);
}

// A user with a transaction, a renamed default, a deleted default and a category of their own
async function userWithData() {
  const { id, cookie } = await createUser();
  const [food] = await db
    .update(categories)
    .set({ name: "Groceries" })
    .where(and(eq(categories.userId, id), eq(categories.defaultKey, "food")))
    .returning({ id: categories.id });
  if (!food) throw new Error("The default Food category is missing");
  await db
    .delete(categories)
    .where(and(eq(categories.userId, id), eq(categories.defaultKey, "transport")));
  const [coffee] = await db
    .insert(categories)
    .values({ userId: id, type: "expense", name: "Coffee", icon: "coffee" })
    .returning({ id: categories.id });
  if (!coffee) throw new Error("Coffee was not created");
  await db.insert(transactions).values([
    { userId: id, categoryId: food.id, amountKopecks: 1_000, occurredOn: "2026-03-10" },
    { userId: id, categoryId: coffee.id, amountKopecks: 500, occurredOn: "2026-03-11" },
  ]);

  return { id, cookie };
}

async function signedInWithData() {
  const created = await userWithData();
  requestHeaders.current = new Headers({ cookie: created.cookie });
  return created;
}

function transactionCountOf(userId: string) {
  return db.$count(transactions, eq(transactions.userId, userId));
}

beforeEach(() => {
  requestHeaders.current = new Headers();
});

describe("clearTransactions", () => {
  test("deletes every transaction of the user", async () => {
    const { id } = await signedInWithData();

    const result = await clearTransactions();

    expect(result.serverError).toBeUndefined();
    expect(await transactionCountOf(id)).toBe(0);
  });

  test("keeps the categories as they are", async () => {
    await signedInWithData();
    const before = await listCategories();

    await clearTransactions();

    expect(await listCategories()).toEqual(before);
  });

  test("leaves other users' transactions", async () => {
    const other = await userWithData();
    await signedInWithData();

    await clearTransactions();

    expect(await transactionCountOf(other.id)).toBe(2);
  });

  test("rejects a request without a session", async () => {
    const result = await clearTransactions();

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});

describe("resetData", () => {
  test("deletes every transaction of the user", async () => {
    const { id } = await signedInWithData();

    const result = await resetData();

    expect(result.serverError).toBeUndefined();
    expect(await transactionCountOf(id)).toBe(0);
  });

  test("leaves only the default categories, with their default names, deleted ones included", async () => {
    await signedInWithData();

    await resetData();

    const found = await listCategories();
    expect(keysOf(found)).toEqual(DEFAULT_KEYS);
    expect(found.every((category) => category.name === null && category.icon === null)).toBe(true);
  });

  test("leaves other users' data", async () => {
    const other = await userWithData();
    requestHeaders.current = new Headers({ cookie: other.cookie });
    const otherCategories = await listCategories();
    await signedInWithData();

    await resetData();

    expect(await transactionCountOf(other.id)).toBe(2);
    requestHeaders.current = new Headers({ cookie: other.cookie });
    expect(await listCategories()).toEqual(otherCategories);
  });

  test("rejects a request without a session", async () => {
    const result = await resetData();

    expect(result.serverError).toBe(UNAUTHORIZED_ERROR);
  });
});
