import { describe, expect, test } from "vitest";

import { groupByDay } from "./group-by-day";
import type { TransactionDto } from "./transactions.dal";

function transaction(id: string, occurredOn: string): TransactionDto {
  return {
    id,
    type: "expense",
    amountKopecks: 100,
    occurredOn,
    note: null,
    category: { defaultKey: "food", name: null },
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

  test("does not change its input", () => {
    const input = [transaction("a", "2026-03-01"), transaction("b", "2026-03-02")];

    groupByDay(input);

    expect(input.map((t) => t.id)).toEqual(["a", "b"]);
  });
});
