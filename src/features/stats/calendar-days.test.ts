import { describe, expect, test } from "vitest";

import { addDays, daysOf, spendingLevelOf, weekColumnOf, weekOfDays } from "./calendar-days";

describe("calendar days", () => {
  test("lists every day of a month, both ends included", () => {
    const days = daysOf({ from: "2026-02-01", to: "2026-02-28" });

    expect(days).toHaveLength(28);
    expect(days[0]).toBe("2026-02-01");
    expect(days.at(-1)).toBe("2026-02-28");
  });

  test("steps over a month's and a year's end", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  test("puts Monday in the first column and Sunday in the last", () => {
    expect(weekColumnOf("2026-11-02")).toBe(1);
    expect(weekColumnOf("2026-11-01")).toBe(7);
    expect(weekOfDays().map(weekColumnOf)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("spending level", () => {
  test("is none without spending", () => {
    expect(spendingLevelOf(0, 0)).toBe("none");
    expect(spendingLevelOf(0, 5000)).toBe("none");
  });

  test("is top for the largest day", () => {
    expect(spendingLevelOf(5000, 5000)).toBe("top");
  });

  test("spreads smaller days over the lower levels", () => {
    expect(spendingLevelOf(1, 10_000)).toBe("low");
    expect(spendingLevelOf(1000, 10_000)).toBe("medium");
    expect(spendingLevelOf(4000, 10_000)).toBe("high");
  });
});
