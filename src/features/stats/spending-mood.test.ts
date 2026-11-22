import { expect, test } from "vitest";

import { spendingMoodOf } from "./spending-mood";

test("stays cool while half of the income or less is spent", () => {
  expect(spendingMoodOf(100_000, 0)).toBe(0);
  expect(spendingMoodOf(100_000, 50_000)).toBe(0);
});

test("warms in proportion between half and all of the income", () => {
  expect(spendingMoodOf(100_000, 75_000)).toBe(0.5);
});

test("is fully warm once the income is spent", () => {
  expect(spendingMoodOf(100_000, 100_000)).toBe(1);
  expect(spendingMoodOf(100_000, 250_000)).toBe(1);
});

test("is fully warm when spending has no income, and cool with neither", () => {
  expect(spendingMoodOf(0, 1)).toBe(1);
  expect(spendingMoodOf(0, 0)).toBe(0);
});
