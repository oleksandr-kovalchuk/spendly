import type { TransactionDto } from "./transactions.dal";

export type DayGroup = { date: string; transactions: TransactionDto[] };

// Newest day first; inside a day the order of the input is kept
export function groupByDay(transactions: TransactionDto[]): DayGroup[] {
  const groups = new Map<string, TransactionDto[]>();
  for (const transaction of transactions) {
    const group = groups.get(transaction.occurredOn);
    if (group) group.push(transaction);
    else groups.set(transaction.occurredOn, [transaction]);
  }

  return [...groups]
    .map(([date, items]) => ({ date, transactions: items }))
    .toSorted((a, b) => b.date.localeCompare(a.date));
}
