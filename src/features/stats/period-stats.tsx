import { ChartBarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ComponentProps, type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import { BalanceBar } from "./balance-bar";
import { PeriodTotals } from "./period-totals";
import { SpendingBreakdown } from "./spending-breakdown";
import type { SpendingItem } from "./spending-item";
import { spendingMoodOf } from "./spending-mood";

type PeriodStatsProps = {
  totals: ComponentProps<typeof PeriodTotals>;
  spending: SpendingItem[];
  emptyAction: ReactNode;
};

export function PeriodStats({ totals, spending, emptyAction }: PeriodStatsProps) {
  const t = useTranslations("Stats");
  const headingId = useId();

  // The bar sits outside the query container: its containment would pin a fixed child to it
  return (
    <div className="balance-scope">
      <BalanceBar
        balanceKopecks={totals.balanceKopecks}
        mood={spendingMoodOf(totals.incomeKopecks, totals.expenseKopecks)}
      />
      <div className="@container">
        <div className="grid stagger gap-4 @3xl:grid-cols-12">
          <div className="balance-timeline @3xl:col-span-6">
            <PeriodTotals {...totals} />
          </div>
          <section aria-labelledby={headingId} className="@3xl:col-span-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  <h2 id={headingId}>{t("byCategory")}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid content-start gap-4">
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
                  <SpendingBreakdown items={spending} labelledBy={headingId} />
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
