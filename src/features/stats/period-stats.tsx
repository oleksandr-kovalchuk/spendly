import { ChartBarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import { PeriodTotals } from "./period-totals";
import { SpendingChart } from "./spending-chart";
import type { SpendingItem } from "./spending-item";
import { SpendingLegend } from "./spending-legend";

type PeriodStatsProps = {
  totals: { incomeKopecks: number; expenseKopecks: number };
  spending: SpendingItem[];
  // Shown in the empty chart: the button that opens the add form
  emptyAction: ReactNode;
};

export function PeriodStats({ totals, spending, emptyAction }: PeriodStatsProps) {
  const t = useTranslations("Stats");
  const headingId = useId();

  return (
    <div className="@container grid gap-4">
      <PeriodTotals {...totals} />
      <section aria-labelledby={headingId}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id={headingId}>{t("byCategory")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spending.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ChartBarIcon aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>{t("noExpenses")}</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>{emptyAction}</EmptyContent>
              </Empty>
            ) : (
              <div className="grid gap-4 @xl:grid-cols-2">
                <SpendingChart items={spending} />
                <SpendingLegend items={spending} labelledBy={headingId} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
