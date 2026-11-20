import { describe, expect, test } from "vitest";

import { createUser } from "@/shared/auth/test-user";
import { listCategories } from "@/shared/categories/categories.dal";
import { transactions } from "@/shared/db/app-schema";
import { db } from "@/shared/db/client";

import { getPeriodTotals, listSpendingByCategory } from "./stats.dal";

const MONTH = { from: "2026-03-01", to: "2026-03-31" };

async function setup() {
  const { id } = await createUser();
  const categories = await listCategories(id);
  const find = (defaultKey: string) => {
    const category = categories.find((c) => c.defaultKey === defaultKey);
    if (!category) throw new Error(`The default category ${defaultKey} is missing`);
    return category;
  };
  const add = (categoryId: string, amountKopecks: number, occurredOn = "2026-03-10") =>
    db.insert(transactions).values({ userId: id, categoryId, amountKopecks, occurredOn });

  return { id, food: find("food"), transport: find("transport"), salary: find("salary"), add };
}

describe("period totals", () => {
  test("sums the income and the expenses of the period", async () => {
    const { id, food, transport, salary, add } = await setup();
    await add(salary.id, 100_000);
    await add(food.id, 30_000);
    await add(transport.id, 20_000);

    expect(await getPeriodTotals(id, MONTH)).toEqual({
      incomeKopecks: 100_000,
      expenseKopecks: 50_000,
    });
  });

  test("includes both ends of the range and nothing outside it", async () => {
    const { id, food, salary, add } = await setup();
    await add(food.id, 100, "2026-03-01");
    await add(food.id, 200, "2026-03-31");
    await add(food.id, 400, "2026-02-28");
    await add(salary.id, 800, "2026-04-01");

    expect(await getPeriodTotals(id, MONTH)).toEqual({ incomeKopecks: 0, expenseKopecks: 300 });
  });

  test("is zero for a period without transactions", async () => {
    const { id } = await setup();

    expect(await getPeriodTotals(id, MONTH)).toEqual({ incomeKopecks: 0, expenseKopecks: 0 });
  });

  test("sums amounts above the 32-bit range exactly", async () => {
    const { id, food, add } = await setup();
    await add(food.id, 99_999_999_999);
    await add(food.id, 99_999_999_999);

    expect(await getPeriodTotals(id, MONTH)).toEqual({
      incomeKopecks: 0,
      expenseKopecks: 199_999_999_998,
    });
  });

  test("leaves out another user's transactions", async () => {
    const { id, food, add } = await setup();
    const other = await setup();
    await add(food.id, 100);
    await other.add(other.food.id, 5_000);
    await other.add(other.salary.id, 7_000);

    expect(await getPeriodTotals(id, MONTH)).toEqual({ incomeKopecks: 0, expenseKopecks: 100 });
  });
});

describe("spending by category", () => {
  test("sums the expenses per category, largest first, without income", async () => {
    const { id, food, transport, salary, add } = await setup();
    await add(transport.id, 20_000);
    await add(food.id, 10_000);
    await add(food.id, 20_000);
    await add(salary.id, 100_000);

    expect(await listSpendingByCategory(id, MONTH)).toEqual([
      {
        categoryId: food.id,
        category: { defaultKey: "food", name: null },
        amountKopecks: 30_000,
      },
      {
        categoryId: transport.id,
        category: { defaultKey: "transport", name: null },
        amountKopecks: 20_000,
      },
    ]);
  });

  test("leaves out other periods and another user's transactions", async () => {
    const { id, food, add } = await setup();
    const other = await setup();
    await add(food.id, 100);
    await add(food.id, 400, "2026-04-01");
    await other.add(other.food.id, 5_000);

    expect(await listSpendingByCategory(id, MONTH)).toEqual([
      expect.objectContaining({ categoryId: food.id, amountKopecks: 100 }),
    ]);
  });

  test("is empty for a period without expenses", async () => {
    const { id, salary, add } = await setup();
    await add(salary.id, 100_000);

    expect(await listSpendingByCategory(id, MONTH)).toEqual([]);
  });
});
