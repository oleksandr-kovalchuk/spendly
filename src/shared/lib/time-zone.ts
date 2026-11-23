export const TIME_ZONE_COOKIE = "time-zone";
const FALLBACK_TIME_ZONE = "UTC";

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// The cookie is client input: anything that isn't a known zone falls back to UTC
export function resolveTimeZone(value: string | undefined) {
  return value && isTimeZone(value) ? value : FALLBACK_TIME_ZONE;
}

export function todayIn(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function monthOf(day: string) {
  const [year = 0, month = 0] = day.split("-").map(Number);
  // Day 0 of the next month is this month's last day
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = day.slice(0, "YYYY-MM".length);

  return { from: `${prefix}-01`, to: `${prefix}-${String(lastDay).padStart(2, "0")}` };
}
