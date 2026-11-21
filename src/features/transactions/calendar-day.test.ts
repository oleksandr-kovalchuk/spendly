import { expect, test } from "vitest";

import { dayOf, localDateOf } from "./calendar-day";

test("turns a day into a local midnight and back without shifting it", () => {
  const date = localDateOf("2026-03-31");

  expect(date?.getHours()).toBe(0);
  expect(date && dayOf(date)).toBe("2026-03-31");
});

test("keeps years below 100", () => {
  const date = localDateOf("0099-01-02");

  expect(date && dayOf(date)).toBe("0099-01-02");
});

test("has no date for an invalid day", () => {
  expect(localDateOf("2026-3-1")).toBeUndefined();
  expect(localDateOf("")).toBeUndefined();
});
