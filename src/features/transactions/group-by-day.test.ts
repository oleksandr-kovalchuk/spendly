import { describe, expect, test } from "vitest";

import { groupByDay } from "./group-by-day";
import type { TransactionDto } from "./transactions.dal";

function transaction(
  id: string,
  occurredOn: string,
  type: TransactionDto["type"] = "expense",
  amountKopecks = 100,
): TransactionDto {
  return {
    id,
    type,
    amountKopecks,
    occurredOn,
    note: null,
    categoryId: "0198a8c0-0000-7000-8000-000000000001",
    category: { defaultKey: "food", name: null, icon: null },
  };
}

describe("groupByDay", () => {
  test("has no groups without transactions", () => {
    expect(groupByDay([])).toEqual([]);
  });

  test("puts the transactions of one day together and keeps their order", () => {
    const groups = groupByDay([
      transaction("a", "2026-03-10"),
      transaction("b", "2026-03-05"),
      transaction("c", "2026-03-10"),
    ]);

    expect(groups.map((g) => [g.date, g.transactions.map((t) => t.id)])).toEqual([
      ["2026-03-10", ["a", "c"]],
      ["2026-03-05", ["b"]],
    ]);
  });

  test("sorts the days newest first whatever the input order", () => {
    const groups = groupByDay([
      transaction("a", "2026-03-01"),
      transaction("b", "2026-03-31"),
      transaction("c", "2026-03-15"),
    ]);

    expect(groups.map((g) => g.date)).toEqual(["2026-03-31", "2026-03-15", "2026-03-01"]);
  });

  test("sums each day's income and expenses apart", () => {
    const groups = groupByDay([
      transaction("a", "2026-03-10", "expense", 12_550),
      transaction("b", "2026-03-10", "income", 4_200_000),
      transaction("c", "2026-03-10", "expense", 450),
      transaction("d", "2026-03-09", "expense", 300),
    ]);

    expect(
      groups.map(({ date, incomeKopecks, expenseKopecks }) => [
        date,
        incomeKopecks,
        expenseKopecks,
      ]),
    ).toEqual([
      ["2026-03-10", 4_200_000, 13_000],
      ["2026-03-09", 0, 300],
    ]);
  });

  test("does not change its input", () => {
    const input = [transaction("a", "2026-03-01"), transaction("b", "2026-03-02")];

    groupByDay(input);

    expect(input.map((t) => t.id)).toEqual(["a", "b"]);
  });
});
