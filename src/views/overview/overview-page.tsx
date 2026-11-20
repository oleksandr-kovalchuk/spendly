import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PeriodControl } from "@/features/periods/period-control";
import { PeriodStats } from "@/features/stats/period-stats";
import { getPeriodTotals, listSpendingByCategory } from "@/features/stats/stats.dal";
import { StatsBoundary } from "@/features/stats/stats-boundary";
import { categoryLabel } from "@/shared/categories/category-label";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageHeading } from "@/shared/ui/page-heading";
import { AddTransactionControl } from "@/views/app-shell/add-transaction-control";
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
      emptyAction={<AddTransactionControl placement="empty" />}
    />
  );
}

// The size of the totals cards and the spending card
function StatsSkeleton() {
  return (
    <div className="@container grid gap-4">
      <div className="grid grid-cols-2 gap-4 @xl:grid-cols-3">
        <Skeleton className="h-21 rounded-xl @xl:h-23" />
        <Skeleton className="h-21 rounded-xl @xl:h-23" />
        <Skeleton className="col-span-2 h-21 rounded-xl @xl:col-span-1 @xl:h-23" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}

export async function OverviewPage({ searchParams }: PageProps<"/[locale]">) {
  const t = await getTranslations("Home");

  return (
    <PageTransition>
      <div className="grid gap-6">
        <PageHeading>{t("heading")}</PageHeading>
        <Suspense fallback={<PeriodSkeleton />}>
          <PeriodSection />
        </Suspense>
        <StatsBoundary>
          <Suspense fallback={<StatsSkeleton />}>
            <PeriodStatsSection searchParams={searchParams} />
          </Suspense>
        </StatsBoundary>
      </div>
    </PageTransition>
  );
}
