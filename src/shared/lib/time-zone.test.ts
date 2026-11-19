import { describe, expect, test } from "vitest";

import { monthOf, resolveTimeZone, todayIn } from "./time-zone";

describe("todayIn", () => {
  // 22:30 UTC on 16 November: already the 17th east of Kyiv, still the 16th in New York
  const instant = new Date("2026-11-16T22:30:00Z");

  test.each([
    ["UTC", "2026-11-16"],
    ["Europe/Kyiv", "2026-11-17"],
    ["America/New_York", "2026-11-16"],
    ["Pacific/Kiritimati", "2026-11-17"],
    ["Pacific/Pago_Pago", "2026-11-16"],
  ])("in %s it is %s", (timeZone, expected) => {
    expect(todayIn(timeZone, instant)).toBe(expected);
  });

  test("moves to the next day exactly at local midnight", () => {
    expect(todayIn("Europe/Kyiv", new Date("2026-11-16T21:59:59Z"))).toBe("2026-11-16");
    expect(todayIn("Europe/Kyiv", new Date("2026-11-16T22:00:00Z"))).toBe("2026-11-17");
  });

  test("follows daylight saving time", () => {
    // Kyiv is UTC+3 in summer and UTC+2 in winter
    expect(todayIn("Europe/Kyiv", new Date("2026-07-15T21:30:00Z"))).toBe("2026-07-16");
    expect(todayIn("Europe/Kyiv", new Date("2026-12-15T21:30:00Z"))).toBe("2026-12-15");
  });

  test("crosses the year", () => {
    expect(todayIn("Asia/Tokyo", new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
  });
});

describe("resolveTimeZone", () => {
  test("keeps a known time zone", () => {
    expect(resolveTimeZone("Europe/Kyiv")).toBe("Europe/Kyiv");
  });

  test.each([undefined, "", "Mars/Olympus", "<script>"])("falls back to UTC for %j", (value) => {
    expect(resolveTimeZone(value)).toBe("UTC");
  });
});

describe("monthOf", () => {
  test.each([
    ["2026-11-17", "2026-11-01", "2026-11-30"],
    ["2026-12-31", "2026-12-01", "2026-12-31"],
    ["2026-02-10", "2026-02-01", "2026-02-28"],
    ["2028-02-10", "2028-02-01", "2028-02-29"],
    ["2026-01-01", "2026-01-01", "2026-01-31"],
  ])("%s is in %s to %s", (day, from, to) => {
    expect(monthOf(day)).toEqual({ from, to });
  });
});
