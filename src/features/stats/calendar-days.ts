const DAYS_PER_WEEK = 7;
const MONDAY = 1;
const A_MONDAY = "2024-01-01";
const SPENDING_LEVELS = ["low", "medium", "high", "top"] as const;

export type SpendingLevel = "none" | (typeof SPENDING_LEVELS)[number];

function dateOf(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

function dayOf(date: Date) {
  return date.toISOString().slice(0, "YYYY-MM-DD".length);
}

export function addDays(day: string, days: number) {
  const date = dateOf(day);
  date.setUTCDate(date.getUTCDate() + days);
  return dayOf(date);
}

export function daysOf(range: { from: string; to: string }) {
  const days: string[] = [];
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) days.push(day);
  return days;
}

export function weekOfDays() {
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(A_MONDAY, index));
}

export function weekColumnOf(day: string) {
  return ((dateOf(day).getUTCDay() - MONDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK) + 1;
}

export function spendingLevelOf(amountKopecks: number, maxKopecks: number): SpendingLevel {
  if (amountKopecks <= 0 || maxKopecks <= 0) return "none";
  const index = Math.ceil(Math.sqrt(amountKopecks / maxKopecks) * SPENDING_LEVELS.length) - 1;

  return SPENDING_LEVELS[Math.min(Math.max(index, 0), SPENDING_LEVELS.length - 1)] ?? "top";
}
