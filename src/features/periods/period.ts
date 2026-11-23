import { PERIOD_EARLIER, PERIOD_LATER, type PeriodDirection } from "@/shared/lib/period-transition";
import { monthOf } from "@/shared/lib/time-zone";

export const PERIOD_TYPES = ["day", "week", "month", "year"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

const DEFAULT_PERIOD_TYPE: PeriodType = "day";
const DAYS_PER_WEEK = 7;
const MONDAY = 1;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Inclusive `YYYY-MM-DD` days
export type Period = { type: PeriodType; from: string; to: string };

// The URL's raw values: a repeated key arrives as an array
type RawValue = string | string[] | null | undefined;
export type PeriodSearch = { period: PeriodType | null; date: string | null };

// `Date.UTC` would move years below 100 to the 1900s
function toDate(year: number, monthIndex: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  return date;
}

function toDay(date: Date) {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDay(day: string) {
  const [, year = "", month = "", date = ""] = DAY_PATTERN.exec(day) ?? [];
  return toDate(Number(year), Number(month) - 1, Number(date));
}

export function isCalendarDay(value: string) {
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);

  return year >= MIN_YEAR && year <= MAX_YEAR && toDay(parseDay(value)) === value;
}

export function periodOf(type: PeriodType, day: string): Period {
  const date = parseDay(day);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  switch (type) {
    case "day":
      return { type, from: day, to: day };
    case "week": {
      const daysSinceMonday = (date.getUTCDay() - MONDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
      const start = toDate(year, month, date.getUTCDate() - daysSinceMonday);
      const end = toDate(year, month, date.getUTCDate() - daysSinceMonday + DAYS_PER_WEEK - 1);
      return { type, from: toDay(start), to: toDay(end) };
    }
    case "month":
      return { type, ...monthOf(day) };
    case "year":
      return { type, from: toDay(toDate(year, 0, 1)), to: toDay(toDate(year, 11, 31)) };
    default:
      throw new Error("Unhandled period type", { cause: type satisfies never });
  }
}

// Undefined past the supported years
export function stepPeriod(period: Period, direction: -1 | 1): Period | undefined {
  const day = direction === -1 ? parseDay(period.from) : parseDay(period.to);
  const next = toDate(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + direction);
  const nextDay = toDay(next);

  return isCalendarDay(nextDay) ? periodOf(period.type, nextDay) : undefined;
}

function single(value: RawValue) {
  return typeof value === "string" ? value : undefined;
}

// A missing type is a day and a missing date is today; anything invalid is today
export function parsePeriod(search: { period?: RawValue; date?: RawValue }, today: string): Period {
  const fallback = periodOf(DEFAULT_PERIOD_TYPE, today);
  const rawType = search.period ?? DEFAULT_PERIOD_TYPE;
  const rawDate = search.date ?? today;
  const type = PERIOD_TYPES.find((candidate) => candidate === single(rawType));
  const date = single(rawDate);
  if (!type || date === undefined || !isCalendarDay(date)) return fallback;

  return periodOf(type, date);
}

export function directionTo(day: string, period: Period): PeriodDirection | undefined {
  if (day < period.from) return PERIOD_EARLIER;
  if (day > period.to) return PERIOD_LATER;
  return undefined;
}

export function isCurrentPeriod(period: Period, today: string) {
  return period.from <= today && today <= period.to;
}

// The URL keeps neither default: the day type and a date in the current period
export function toPeriodSearch(period: Period, today: string): PeriodSearch {
  return {
    period: period.type === DEFAULT_PERIOD_TYPE ? null : period.type,
    date: isCurrentPeriod(period, today) ? null : period.from,
  };
}

export function toPeriodQuery(period: Period, today: string) {
  const search = toPeriodSearch(period, today);
  const query: Record<string, string> = {};
  if (search.period) query.period = search.period;
  if (search.date) query.date = search.date;
  return query;
}
