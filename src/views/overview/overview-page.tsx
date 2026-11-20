import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PeriodControl } from "@/features/periods/period-control";
import { PeriodStats } from "@/features/stats/period-stats";
import { getPeriodTotals, listSpendingByCategory } from "@/features/stats/stats.dal";
import { StatsBoundary } from "@/features/stats/stats-boundary";
import { categoryLabel } from "@/shared/categories/category-label";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageTransition } from "@/views/app-shell/page-transition";
import { PeriodSkeleton } from "@/views/app-shell/period-skeleton";
import {
  getCurrentUserOrSignIn,
  getShownPeriod,
  getToday,
  type ScreenSearchParams,
} from "@/views/app-shell/screen-data";

async function PeriodSection() {
  return <PeriodControl today={await getToday()} />;
}

async function PeriodStatsSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const [user, { period }, tCategories] = await Promise.all([
    getCurrentUserOrSignIn(),
    getShownPeriod(searchParams),
    getTranslations("Categories"),
  ]);
  const [totals, spending] = await Promise.all([
    getPeriodTotals(user.id, period),
    listSpendingByCategory(user.id, period),
  ]);

  return (
    <PeriodStats
      totals={totals}
      spending={spending.map((item) => ({
        id: item.categoryId,
        label: categoryLabel(item.category, tCategories),
        amountKopecks: item.amountKopecks,
      }))}
    />
  );
}

function StatsSkeleton() {
  return (
    <div className="@container grid gap-4">
      <div className="grid gap-2 @md:grid-cols-3">
        <Skeleton className="h-10 @md:h-17" />
        <Skeleton className="h-10 @md:h-17" />
        <Skeleton className="h-10 @md:h-17" />
      </div>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export async function OverviewPage({ searchParams }: PageProps<"/[locale]">) {
  const t = await getTranslations("Home");

  return (
    <PageTransition>
      <div className="grid gap-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
        <div className="grid gap-4">
          <Suspense fallback={<PeriodSkeleton />}>
            <PeriodSection />
          </Suspense>
          <StatsBoundary>
            <Suspense fallback={<StatsSkeleton />}>
              <PeriodStatsSection searchParams={searchParams} />
            </Suspense>
          </StatsBoundary>
        </div>
      </div>
    </PageTransition>
  );
}
