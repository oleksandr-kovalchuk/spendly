import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { directionTo, periodOf, toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { PeriodSwipeArea } from "@/features/periods/period-swipe-area";
import { PeriodStats } from "@/features/stats/period-stats";
import { daysOf } from "@/features/stats/calendar-days";
import { SpendingCalendar } from "@/features/stats/spending-calendar";
import {
  getPeriodTotals,
  listSpendingByCategory,
  listSpendingByDay,
} from "@/features/stats/stats.dal";
import { StatsBoundary } from "@/features/stats/stats-boundary";
import { LatestTransactions } from "@/features/transactions/latest-transactions";
import { LazyEditTransactionSheet } from "@/features/transactions/lazy-edit-transaction-sheet";
import { TransactionListBoundary } from "@/features/transactions/transaction-list-boundary";
import { findTransaction, listTransactions } from "@/features/transactions/transactions.dal";
import { categoryLabel } from "@/shared/categories/category-label";
import { categoryColor } from "@/shared/categories/category-look";
import { monthOf } from "@/shared/lib/time-zone";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageHeading } from "@/shared/ui/page-heading";
import { AddTransactionControl } from "@/views/app-shell/add-transaction-control";
import { PageTransition } from "@/views/app-shell/page-transition";
import { PeriodSkeleton } from "@/views/app-shell/period-skeleton";
import { PeriodSlide } from "@/views/app-shell/period-slide";
import {
  getCategoryOptions,
  getEditingId,
  getShownPeriod,
  getToday,
  type ScreenSearchParams,
} from "@/views/app-shell/screen-data";

const LATEST_COUNT = 5;

async function PeriodSection() {
  return <PeriodControl today={await getToday()} />;
}

async function PeriodStatsSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const [{ today, period }, tCategories] = await Promise.all([
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
        transactionsQuery: { ...toPeriodQuery(period, today), category: item.categoryId },
      }))}
      emptyAction={<AddTransactionControl />}
    />
  );
}

async function SpendingCalendarSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const { today, period } = await getShownPeriod(searchParams);
  if (period.type === "year") return null;

  const month = monthOf(period.from);
  const spending = new Map(
    (await listSpendingByDay(month)).map(({ day, amountKopecks }) => [day, amountKopecks]),
  );
  const isMarked = period.type === "day" || period.type === "week";

  return (
    <SpendingCalendar
      days={daysOf(month).map((day) => ({
        day,
        amountKopecks: spending.get(day) ?? 0,
        query: toPeriodQuery(periodOf("day", day), today),
        direction: directionTo(day, period),
        isSelected: isMarked && period.from <= day && day <= period.to,
      }))}
    />
  );
}

async function LatestSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const { today, period } = await getShownPeriod(searchParams);
  const transactions = await listTransactions(period, LATEST_COUNT);
  if (transactions.length === 0) return null;

  return (
    <LatestTransactions transactions={transactions} periodQuery={toPeriodQuery(period, today)} />
  );
}

async function EditSheetSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const editingId = await getEditingId(searchParams);
  if (editingId === undefined) return null;

  const [{ today, period }, categories, transaction] = await Promise.all([
    getShownPeriod(searchParams),
    getCategoryOptions(),
    findTransaction(editingId),
  ]);
  if (!transaction) notFound();

  return (
    <LazyEditTransactionSheet
      key={transaction.id}
      categories={categories}
      transaction={transaction}
      screen="overview"
      listQuery={toPeriodQuery(period, today)}
    />
  );
}

function StatsSkeleton() {
  return (
    <div className="@container">
      <div className="grid gap-4 @3xl:grid-cols-12">
        <Skeleton className="h-64 rounded-3xl @3xl:col-span-6 @3xl:h-72" />
        <Skeleton className="h-56 rounded-2xl @3xl:col-span-6 @3xl:h-72" />
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
        <Suspense fallback={null}>
          <EditSheetSection searchParams={searchParams} />
        </Suspense>
        <PeriodSwipeArea>
          <PeriodSlide>
            <StatsBoundary>
              <Suspense fallback={<StatsSkeleton />}>
                <PeriodStatsSection searchParams={searchParams} />
              </Suspense>
            </StatsBoundary>
            <StatsBoundary>
              <Suspense fallback={<Skeleton className="h-16 rounded-2xl" />}>
                <SpendingCalendarSection searchParams={searchParams} />
              </Suspense>
            </StatsBoundary>
            <TransactionListBoundary>
              <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
                <LatestSection searchParams={searchParams} />
              </Suspense>
            </TransactionListBoundary>
          </PeriodSlide>
        </PeriodSwipeArea>
      </div>
    </PageTransition>
  );
}
