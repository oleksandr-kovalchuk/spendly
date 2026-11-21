import { ChartBarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, type ComponentProps, type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";

import { PeriodTotals } from "./period-totals";
import { SpendingBar } from "./spending-bar";
import type { SpendingItem } from "./spending-item";
import { SpendingLegend } from "./spending-legend";

type PeriodStatsProps = {
  totals: ComponentProps<typeof PeriodTotals>;
  spending: SpendingItem[];
  emptyAction: ReactNode;
};

export function PeriodStats({ totals, spending, emptyAction }: PeriodStatsProps) {
  const t = useTranslations("Stats");
  const headingId = useId();

  return (
    <div className="@container">
      <div className="grid stagger gap-4 @3xl:grid-cols-12">
        <div className="@3xl:col-span-7">
          <PeriodTotals {...totals} />
        </div>
        <section aria-labelledby={headingId} className="@3xl:col-span-5">
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
                <>
                  <SpendingBar items={spending} />
                  <SpendingLegend items={spending} labelledBy={headingId} />
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
