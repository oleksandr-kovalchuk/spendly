import type { TransactionDto } from "./transactions.dal";

export type DayGroup = {
  date: string;
  transactions: TransactionDto[];
  incomeKopecks: number;
  expenseKopecks: number;
};

function sumOf(transactions: TransactionDto[], type: TransactionDto["type"]) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + transaction.amountKopecks, 0);
}

export function groupByDay(transactions: TransactionDto[]): DayGroup[] {
  const groups = new Map<string, TransactionDto[]>();
  for (const transaction of transactions) {
    const group = groups.get(transaction.occurredOn);
    if (group) group.push(transaction);
    else groups.set(transaction.occurredOn, [transaction]);
  }

  return [...groups]
    .map(([date, items]) => ({
      date,
      transactions: items,
      incomeKopecks: sumOf(items, "income"),
      expenseKopecks: sumOf(items, "expense"),
    }))
    .toSorted((a, b) => b.date.localeCompare(a.date));
}
