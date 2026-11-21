import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { PeriodStats } from "@/features/stats/period-stats";
import { getPeriodTotals, listSpendingByCategory } from "@/features/stats/stats.dal";
import { StatsBoundary } from "@/features/stats/stats-boundary";
import { LatestTransactions } from "@/features/transactions/latest-transactions";
import { TransactionListBoundary } from "@/features/transactions/transaction-list-boundary";
import { listTransactions } from "@/features/transactions/transactions.dal";
import { categoryLabel } from "@/shared/categories/category-label";
import { categoryColor } from "@/shared/categories/category-look";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageHeading } from "@/shared/ui/page-heading";
import { AddTransactionControl } from "@/views/app-shell/add-transaction-control";
import { PageTransition } from "@/views/app-shell/page-transition";
import { PeriodSkeleton } from "@/views/app-shell/period-skeleton";
import { getShownPeriod, getToday, type ScreenSearchParams } from "@/views/app-shell/screen-data";

const LATEST_COUNT = 5;

async function PeriodSection() {
  return <PeriodControl today={await getToday()} />;
}

async function PeriodStatsSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const [{ period }, tCategories] = await Promise.all([
    getShownPeriod(searchParams),
    getTranslations("Categories"),
  ]);
  const [totals, spending] = await Promise.all([
    getPeriodTotals(period),
    listSpendingByCategory(period),
  ]);

  return (
    <PeriodStats
      totals={totals}
      spending={spending.map((item) => ({
        id: item.categoryId,
        label: categoryLabel(item.category, tCategories),
        amountKopecks: item.amountKopecks,
        color: categoryColor({ id: item.categoryId, defaultKey: item.category.defaultKey }),
      }))}
      emptyAction={<AddTransactionControl placement="empty" />}
    />
  );
}

// Its own section: the totals don't wait for the list, and an empty period shows no block
async function LatestSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const { today, period } = await getShownPeriod(searchParams);
  const transactions = await listTransactions(period, LATEST_COUNT);
  if (transactions.length === 0) return null;

  return (
    <LatestTransactions transactions={transactions} periodQuery={toPeriodQuery(period, today)} />
  );
}

function StatsSkeleton() {
  return (
    <div className="@container">
      <div className="grid gap-4 @3xl:grid-cols-12">
        <Skeleton className="h-64 rounded-3xl @3xl:col-span-7 @3xl:h-72" />
        <Skeleton className="h-56 rounded-2xl @3xl:col-span-5 @3xl:h-72" />
      </div>
    </div>
  );
}

export async function OverviewPage({ searchParams }: PageProps<"/[locale]">) {
  const t = await getTranslations("Home");

  return (
    <PageTransition>
      <div className="grid stagger gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeading>{t("heading")}</PageHeading>
          <Suspense fallback={<PeriodSkeleton />}>
            <PeriodSection />
          </Suspense>
        </div>
        <StatsBoundary>
          <Suspense fallback={<StatsSkeleton />}>
            <PeriodStatsSection searchParams={searchParams} />
          </Suspense>
        </StatsBoundary>
        <TransactionListBoundary>
          <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
            <LatestSection searchParams={searchParams} />
          </Suspense>
        </TransactionListBoundary>
      </div>
    </PageTransition>
  );
}
