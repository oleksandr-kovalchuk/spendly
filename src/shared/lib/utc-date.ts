// A day has no time zone: a UTC midnight formatted in UTC shows the same day everywhere
export const DAY_TIME_ZONE = "UTC";

export function utcDateOf(day: string) {
  return new Date(`${day}T00:00:00Z`);
}
