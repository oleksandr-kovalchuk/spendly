import { useTranslations } from "next-intl";
import { useId } from "react";

import { PeriodTotals } from "./period-totals";
import { SpendingChart } from "./spending-chart";
import type { SpendingItem } from "./spending-item";
import { SpendingLegend } from "./spending-legend";

type PeriodStatsProps = {
  totals: { incomeKopecks: number; expenseKopecks: number };
  spending: SpendingItem[];
};

export function PeriodStats({ totals, spending }: PeriodStatsProps) {
  const t = useTranslations("Stats");
  const headingId = useId();

  return (
    <div className="@container grid gap-4">
      <PeriodTotals {...totals} />
      <div className="grid gap-3">
        <h3 id={headingId} className="text-sm font-medium">
          {t("byCategory")}
        </h3>
        {spending.length === 0 ? (
          <p className="text-muted-foreground">{t("noExpenses")}</p>
        ) : (
          <div className="grid gap-4 @xl:grid-cols-2">
            <SpendingChart items={spending} />
            <SpendingLegend items={spending} labelledBy={headingId} />
          </div>
        )}
      </div>
    </div>
  );
}
