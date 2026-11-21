// A day ("YYYY-MM-DD") has no time zone: as a UTC midnight, formatted in `DAY_TIME_ZONE`,
// it shows the same calendar day everywhere
export const DAY_TIME_ZONE = "UTC";

export function utcDateOf(day: string) {
  return new Date(`${day}T00:00:00Z`);
}
