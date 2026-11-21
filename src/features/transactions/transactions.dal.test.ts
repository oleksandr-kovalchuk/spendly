import { eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";
import { transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import {
  deleteTransaction,
  findTransaction,
  insertTransaction,
  listTransactions,
  updateTransaction,
} from "./transactions.dal";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: { current: new Headers() } }));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(requestHeaders.current) }));

const MONTH = { from: "2026-03-01", to: "2026-03-31" };

function signIn(cookie: string) {
  requestHeaders.current = new Headers({ cookie });
}

async function setup() {
  const { id, cookie } = await createUser();
  signIn(cookie);
  const categories = await listCategories();
  const expense = categories.find((c) => c.type === "expense" && c.defaultKey === "food");
  const income = categories.find((c) => c.type === "income" && c.defaultKey === "salary");
  if (!expense || !income) throw new Error("Default categories are missing");
  return { id, cookie, expense, income };
}

// Leaves the user signed in
async function addOne(user: { id: string; cookie: string }, categoryId: string) {
  await insertTransaction(user.id, {
    categoryId,
    amountKopecks: 12_550,
    occurredOn: "2026-03-10",
    note: "lunch",
  });
  signIn(user.cookie);
  const [stored] = await listTransactions(MONTH);
  if (!stored) throw new Error("The transaction was not stored");
  return stored;
}

describe("transactions", () => {
  test("lists a transaction with the type and category of its category", async () => {
    const { id, expense } = await setup();
    const result = await insertTransaction(id, {
      categoryId: expense.id,
      amountKopecks: 12_550,
      occurredOn: "2026-03-10",
      note: "lunch",
    });

    expect(result).toEqual({ isAdded: true });
    expect(await listTransactions(MONTH)).toEqual([
      {
        id: expect.any(String),
        type: "expense",
        amountKopecks: 12_550,
        occurredOn: "2026-03-10",
        note: "lunch",
        categoryId: expense.id,
        category: { defaultKey: "food", name: null, icon: null },
      },
    ]);
  });

  test("lists the newest day first, and the last added first within a day", async () => {
    const { id, expense, income } = await setup();
    const add = (categoryId: string, occurredOn: string, amountKopecks: number) =>
      insertTransaction(id, { categoryId, occurredOn, amountKopecks, note: null });
    await add(expense.id, "2026-03-05", 100);
    await add(income.id, "2026-03-20", 200);
    await add(expense.id, "2026-03-20", 300);

    const listed = await listTransactions(MONTH);

    expect(listed.map((t) => [t.occurredOn, t.amountKopecks])).toEqual([
      ["2026-03-20", 300],
      ["2026-03-20", 200],
      ["2026-03-05", 100],
    ]);
  });

  test("lists only the newest transactions up to the limit", async () => {
    const { id, expense } = await setup();
    const add = (occurredOn: string, amountKopecks: number) =>
      insertTransaction(id, { categoryId: expense.id, occurredOn, amountKopecks, note: null });
    await add("2026-03-05", 100);
    await add("2026-03-20", 200);
    await add("2026-03-12", 300);

    const listed = await listTransactions(MONTH, 2);

    expect(listed.map((t) => t.amountKopecks)).toEqual([200, 300]);
  });

  test("includes the first and the last day of the range and nothing outside", async () => {
    const { id, expense } = await setup();
    for (const occurredOn of ["2026-02-28", "2026-03-01", "2026-03-31", "2026-04-01"]) {
      await insertTransaction(id, {
        categoryId: expense.id,
        occurredOn,
        amountKopecks: 100,
        note: null,
      });
    }

    const listed = await listTransactions(MONTH);

    expect(listed.map((t) => t.occurredOn)).toEqual(["2026-03-31", "2026-03-01"]);
  });

  test("a user sees only their own transactions", async () => {
    const owner = await setup();
    const other = await setup();
    await insertTransaction(owner.id, {
      categoryId: owner.expense.id,
      occurredOn: "2026-03-10",
      amountKopecks: 100,
      note: null,
    });

    signIn(other.cookie);
    expect(await listTransactions(MONTH)).toEqual([]);
  });

  test("another user's category is refused and nothing is stored", async () => {
    const owner = await setup();
    const other = await setup();

    const result = await insertTransaction(other.id, {
      categoryId: owner.expense.id,
      occurredOn: "2026-03-10",
      amountKopecks: 100,
      note: null,
    });

    expect(result).toEqual({ isAdded: false, error: "categoryNotFound" });
    expect(await db.select().from(transactions).where(eq(transactions.userId, other.id))).toEqual(
      [],
    );
  });

  test("the database refuses another user's category even when the check is skipped", async () => {
    const owner = await setup();
    const other = await setup();

    await expect(
      db.insert(transactions).values({
        userId: other.id,
        categoryId: owner.expense.id,
        occurredOn: "2026-03-10",
        amountKopecks: 100,
      }),
    ).rejects.toThrow();
  });

  test.each([0, -5, 100_000_000_000])("the database refuses the amount %i", async (amount) => {
    const { id, expense } = await setup();

    await expect(
      db.insert(transactions).values({
        userId: id,
        categoryId: expense.id,
        occurredOn: "2026-03-10",
        amountKopecks: amount,
      }),
    ).rejects.toThrow();
  });

  test("the database refuses a note over 200 characters", async () => {
    const { id, expense } = await setup();

    await expect(
      db.insert(transactions).values({
        userId: id,
        categoryId: expense.id,
        occurredOn: "2026-03-10",
        amountKopecks: 100,
        note: "x".repeat(201),
      }),
    ).rejects.toThrow();
  });

  test("finds a transaction of the user", async () => {
    const user = await setup();
    const { expense } = user;
    const stored = await addOne(user, expense.id);

    expect(await findTransaction(stored.id)).toEqual(stored);
  });

  test("another user's transaction is not found", async () => {
    const owner = await setup();
    const other = await setup();
    const stored = await addOne(owner, owner.expense.id);

    signIn(other.cookie);
    expect(await findTransaction(stored.id)).toBeUndefined();
  });

  test("updates every field, and the type follows the category", async () => {
    const user = await setup();
    const { id, expense, income } = user;
    const stored = await addOne(user, expense.id);

    const result = await updateTransaction(id, stored.id, {
      categoryId: income.id,
      amountKopecks: 300_000,
      occurredOn: "2026-03-20",
      note: null,
    });

    expect(result).toEqual({ isUpdated: true });
    expect(await listTransactions(MONTH)).toEqual([
      {
        id: stored.id,
        type: "income",
        amountKopecks: 300_000,
        occurredOn: "2026-03-20",
        note: null,
        categoryId: income.id,
        category: { defaultKey: "salary", name: null, icon: null },
      },
    ]);
  });

  test("another user's transaction is not updated", async () => {
    const owner = await setup();
    const other = await setup();
    const stored = await addOne(owner, owner.expense.id);

    const result = await updateTransaction(other.id, stored.id, {
      categoryId: other.expense.id,
      amountKopecks: 1,
      occurredOn: "2026-03-11",
      note: "mine now",
    });

    expect(result).toEqual({ isUpdated: false, error: "transactionNotFound" });
    signIn(owner.cookie);
    expect(await listTransactions(MONTH)).toEqual([stored]);
    signIn(other.cookie);
    expect(await listTransactions(MONTH)).toEqual([]);
  });

  test("another user's category is refused and nothing changes", async () => {
    const owner = await setup();
    const other = await setup();
    const stored = await addOne(other, other.expense.id);

    const result = await updateTransaction(other.id, stored.id, {
      categoryId: owner.expense.id,
      amountKopecks: 1,
      occurredOn: "2026-03-11",
      note: null,
    });

    expect(result).toEqual({ isUpdated: false, error: "categoryNotFound" });
    signIn(other.cookie);
    expect(await listTransactions(MONTH)).toEqual([stored]);
  });

  test("deletes a transaction of the user", async () => {
    const user = await setup();
    const { id, expense } = user;
    const stored = await addOne(user, expense.id);

    expect(await deleteTransaction(id, stored.id)).toEqual({ isDeleted: true });
    expect(await listTransactions(MONTH)).toEqual([]);
    expect(await deleteTransaction(id, stored.id)).toEqual({ isDeleted: false });
  });

  test("another user's transaction is not deleted", async () => {
    const owner = await setup();
    const other = await setup();
    const stored = await addOne(owner, owner.expense.id);

    expect(await deleteTransaction(other.id, stored.id)).toEqual({ isDeleted: false });
    signIn(owner.cookie);
    expect(await listTransactions(MONTH)).toEqual([stored]);
  });
});
