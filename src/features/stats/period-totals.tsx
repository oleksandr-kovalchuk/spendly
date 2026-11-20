import { useFormatter, useTranslations } from "next-intl";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";

type PeriodTotalsProps = { incomeKopecks: number; expenseKopecks: number };

// The balance keeps its minus sign when expenses exceed income
export function PeriodTotals({ incomeKopecks, expenseKopecks }: PeriodTotalsProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const totals = [
    { key: "income", kopecks: incomeKopecks },
    { key: "expenses", kopecks: expenseKopecks },
    { key: "balance", kopecks: incomeKopecks - expenseKopecks },
  ] as const;

  return (
    <dl className="grid gap-2 @md:grid-cols-3">
      {totals.map(({ key, kopecks }) => (
        <div
          key={key}
          className="flex items-baseline justify-between gap-4 rounded-lg border border-border px-3 py-2 @md:grid @md:justify-start @md:gap-1"
        >
          <dt className="text-sm text-muted-foreground">{t(key)}</dt>
          <dd className="font-semibold break-all tabular-nums @md:text-lg">
            {format.number(hryvniasOf(kopecks), MONEY_FORMAT)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
