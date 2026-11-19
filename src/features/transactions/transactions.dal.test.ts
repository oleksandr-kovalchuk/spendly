import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";
import { transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { insertTransaction, listTransactions } from "./transactions.dal";

const MONTH = { from: "2026-03-01", to: "2026-03-31" };

async function setup() {
  const { id } = await createUser();
  const categories = await listCategories(id);
  const expense = categories.find((c) => c.type === "expense" && c.defaultKey === "food");
  const income = categories.find((c) => c.type === "income" && c.defaultKey === "salary");
  if (!expense || !income) throw new Error("Default categories are missing");
  return { id, expense, income };
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
    expect(await listTransactions(id, MONTH)).toEqual([
      {
        id: expect.any(String),
        type: "expense",
        amountKopecks: 12_550,
        occurredOn: "2026-03-10",
        note: "lunch",
        category: { defaultKey: "food", name: null },
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

    const listed = await listTransactions(id, MONTH);

    expect(listed.map((t) => [t.occurredOn, t.amountKopecks])).toEqual([
      ["2026-03-20", 300],
      ["2026-03-20", 200],
      ["2026-03-05", 100],
    ]);
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

    const listed = await listTransactions(id, MONTH);

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

    expect(await listTransactions(other.id, MONTH)).toEqual([]);
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
});
