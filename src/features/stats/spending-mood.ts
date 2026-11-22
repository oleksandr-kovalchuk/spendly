const CALM_SHARE = 0.5;

// 0 up to half of the income spent, 1 from all of it; spending without income counts as all of it
export function spendingMoodOf(incomeKopecks: number, expenseKopecks: number) {
  if (incomeKopecks <= 0) return expenseKopecks > 0 ? 1 : 0;

  const share = expenseKopecks / incomeKopecks;
  return Math.min(Math.max((share - CALM_SHARE) / (1 - CALM_SHARE), 0), 1);
}
