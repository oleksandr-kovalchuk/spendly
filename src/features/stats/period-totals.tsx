import { cva } from "class-variance-authority";
import { useFormatter, useTranslations } from "next-intl";
import { ViewTransition } from "react";

import { hryvniasOf, MONEY_FORMAT } from "@/shared/lib/money";
import { Card } from "@/shared/ui/card";

type PeriodTotalsProps = { incomeKopecks: number; expenseKopecks: number };

// On a narrow screen income and expenses share a row and the balance takes the next one;
// wider, all three sit in a row
const totalVariants = cva("gap-1 px-4", {
  variants: {
    total: { income: "", expenses: "", balance: "col-span-2 @xl:col-span-1" },
  },
});

// The balance keeps its minus sign when expenses exceed income. A changed value replaces the old
// one with a short slide (globals.css); there is no live region, so a screen reader isn't
// interrupted by it.
export function PeriodTotals({ incomeKopecks, expenseKopecks }: PeriodTotalsProps) {
  const t = useTranslations("Stats");
  const format = useFormatter();
  const totals = [
    { key: "income", kopecks: incomeKopecks },
    { key: "expenses", kopecks: expenseKopecks },
    { key: "balance", kopecks: incomeKopecks - expenseKopecks },
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-4 @xl:grid-cols-3">
      {totals.map(({ key, kopecks }) => (
        <Card key={key} className={totalVariants({ total: key })}>
          <dt className="text-sm text-muted-foreground">{t(key)}</dt>
          <dd className="text-xl font-semibold break-all tabular-nums @xl:text-2xl">
            <ViewTransition key={kopecks} enter="total-enter" exit="total-exit" default="none">
              <span className="block">{format.number(hryvniasOf(kopecks), MONEY_FORMAT)}</span>
            </ViewTransition>
          </dd>
        </Card>
      ))}
    </dl>
  );
}
