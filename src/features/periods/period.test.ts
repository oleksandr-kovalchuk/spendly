import { describe, expect, it } from "vitest";

import { PERIOD_EARLIER, PERIOD_LATER } from "@/shared/lib/period-transition";

import {
  directionTo,
  isCalendarDay,
  isCurrentPeriod,
  parsePeriod,
  periodOf,
  stepPeriod,
  toPeriodQuery,
  toPeriodSearch,
} from "./period";

const TODAY = "2026-11-20";

describe("isCalendarDay", () => {
  it.each(["2026-11-20", "2024-02-29", "0001-01-01", "9999-12-31"])("accepts %s", (value) => {
    expect(isCalendarDay(value)).toBe(true);
  });

  it.each(["2026-02-29", "2026-13-01", "2026-11-31", "2026-1-5", "0000-01-01", "20261120", ""])(
    "rejects %s",
    (value) => {
      expect(isCalendarDay(value)).toBe(false);
    },
  );
});

describe("periodOf", () => {
  it("is the day itself for a day", () => {
    expect(periodOf("day", TODAY)).toEqual({ type: "day", from: TODAY, to: TODAY });
  });

  it.each([
    ["2026-11-16", "2026-11-16", "2026-11-22"],
    ["2026-11-22", "2026-11-16", "2026-11-22"],
    ["2026-11-20", "2026-11-16", "2026-11-22"],
    ["2026-12-30", "2026-12-28", "2027-01-03"],
    ["2026-03-01", "2026-02-23", "2026-03-01"],
  ])("puts %s in the Monday week %s to %s", (day, from, to) => {
    expect(periodOf("week", day)).toEqual({ type: "week", from, to });
  });

  it.each([
    ["2026-11-20", "2026-11-01", "2026-11-30"],
    ["2026-02-10", "2026-02-01", "2026-02-28"],
    ["2024-02-10", "2024-02-01", "2024-02-29"],
    ["2026-12-31", "2026-12-01", "2026-12-31"],
  ])("puts %s in the month %s to %s", (day, from, to) => {
    expect(periodOf("month", day)).toEqual({ type: "month", from, to });
  });

  it("covers the whole year for a year", () => {
    expect(periodOf("year", TODAY)).toEqual({ type: "year", from: "2026-01-01", to: "2026-12-31" });
  });

  it("keeps years below 100", () => {
    expect(periodOf("month", "0050-03-15")).toEqual({
      type: "month",
      from: "0050-03-01",
      to: "0050-03-31",
    });
  });
});

describe("stepPeriod", () => {
  it("steps from November 2026 back to October 2026", () => {
    expect(stepPeriod(periodOf("month", TODAY), -1)).toEqual(periodOf("month", "2026-10-01"));
  });

  it("steps a month across the year", () => {
    expect(stepPeriod(periodOf("month", "2026-12-05"), 1)).toEqual(periodOf("month", "2027-01-01"));
  });

  it("steps a week by seven days", () => {
    expect(stepPeriod(periodOf("week", TODAY), 1)).toEqual({
      type: "week",
      from: "2026-11-23",
      to: "2026-11-29",
    });
    expect(stepPeriod(periodOf("week", TODAY), -1)).toEqual({
      type: "week",
      from: "2026-11-09",
      to: "2026-11-15",
    });
  });

  it("steps a day and a year", () => {
    expect(stepPeriod(periodOf("day", "2026-03-01"), -1)).toEqual(periodOf("day", "2026-02-28"));
    expect(stepPeriod(periodOf("year", TODAY), 1)).toEqual(periodOf("year", "2027-01-01"));
  });

  it("stops at the supported years", () => {
    expect(stepPeriod(periodOf("year", "9999-06-01"), 1)).toBeUndefined();
    expect(stepPeriod(periodOf("day", "0001-01-01"), -1)).toBeUndefined();
  });
});

describe("parsePeriod", () => {
  it("is today without a period", () => {
    expect(parsePeriod({}, TODAY)).toEqual(periodOf("day", TODAY));
  });

  it("is the current period of a type without a date", () => {
    expect(parsePeriod({ period: "week" }, TODAY)).toEqual({
      type: "week",
      from: "2026-11-16",
      to: "2026-11-22",
    });
  });

  it("is the period holding the date", () => {
    expect(parsePeriod({ period: "week", date: "2026-11-11" }, TODAY)).toEqual(
      periodOf("week", "2026-11-09"),
    );
    expect(parsePeriod({ date: "2026-10-01" }, TODAY)).toEqual(periodOf("day", "2026-10-01"));
  });

  it.each([
    { period: "decade" },
    { period: "" },
    { period: ["week", "day"] },
    { period: "week", date: "2026-02-30" },
    { period: "week", date: "yesterday" },
    { period: "year", date: "" },
    { date: ["2026-10-01", "2026-09-01"] },
  ])("falls back to today for %j", (search) => {
    expect(parsePeriod(search, TODAY)).toEqual(periodOf("day", TODAY));
  });
});

describe("toPeriodSearch", () => {
  it("writes nothing for today", () => {
    expect(toPeriodSearch(periodOf("day", TODAY), TODAY)).toEqual({ period: null, date: null });
  });

  it("writes only the type for the current period of another type", () => {
    expect(toPeriodSearch(periodOf("week", TODAY), TODAY)).toEqual({ period: "week", date: null });
  });

  it("writes the start of a past period", () => {
    expect(toPeriodSearch(periodOf("week", "2026-11-11"), TODAY)).toEqual({
      period: "week",
      date: "2026-11-09",
    });
    expect(toPeriodSearch(periodOf("day", "2026-10-15"), TODAY)).toEqual({
      period: null,
      date: "2026-10-15",
    });
  });

  it("round-trips through parsePeriod", () => {
    const period = periodOf("month", "2025-07-04");
    const search = toPeriodSearch(period, TODAY);
    expect(parsePeriod(search, TODAY)).toEqual(period);
  });
});

describe("toPeriodQuery", () => {
  it("leaves out the defaults", () => {
    expect(toPeriodQuery(periodOf("day", TODAY), TODAY)).toEqual({});
    expect(toPeriodQuery(periodOf("month", TODAY), TODAY)).toEqual({ period: "month" });
    expect(toPeriodQuery(periodOf("week", TODAY), TODAY)).toEqual({ period: "week" });
    expect(toPeriodQuery(periodOf("year", "2025-03-01"), TODAY)).toEqual({
      period: "year",
      date: "2025-01-01",
    });
  });
});

describe("isCurrentPeriod", () => {
  it("holds today", () => {
    expect(isCurrentPeriod(periodOf("year", TODAY), TODAY)).toBe(true);
    expect(isCurrentPeriod(periodOf("day", "2026-11-19"), TODAY)).toBe(false);
  });
});

describe("directionTo", () => {
  it.each([
    ["2026-11-19", PERIOD_EARLIER],
    ["2026-11-21", PERIOD_LATER],
    ["2026-11-20", undefined],
  ])("goes from the shown day to %s as %s", (day, direction) => {
    expect(directionTo(day, periodOf("day", TODAY))).toBe(direction);
  });

  it("doesn't move to a day inside the shown period", () => {
    expect(directionTo("2026-11-03", periodOf("month", TODAY))).toBeUndefined();
  });
});
