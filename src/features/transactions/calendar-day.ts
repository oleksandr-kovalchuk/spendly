// A transaction's day ("YYYY-MM-DD") has no time zone. The calendar works with local-midnight
// dates, and display formats a UTC date with `timeZone: "UTC"`, so no zone shifts the day.
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function partsOf(day: string) {
  const match = DAY_PATTERN.exec(day);
  if (!match) return undefined;
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1, day: Number(match[3]) };
}

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

export function localDateOf(day: string): Date | undefined {
  const parts = partsOf(day);
  if (!parts) return undefined;
  const date = new Date(0);
  // `setFullYear` keeps years below 100, which the Date constructor would move to the 1900s
  date.setFullYear(parts.year, parts.monthIndex, parts.day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function dayOf(date: Date) {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}
