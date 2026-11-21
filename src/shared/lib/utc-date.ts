// A day ("YYYY-MM-DD") has no time zone: as a UTC midnight, formatted with `timeZone: "UTC"`,
// it shows the same calendar day everywhere
export function utcDateOf(day: string) {
  return new Date(`${day}T00:00:00Z`);
}
