import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { PeriodSwipeArea } from "@/features/periods/period-swipe-area";
import { LazyEditTransactionSheet } from "@/features/transactions/lazy-edit-transaction-sheet";
import { groupByDay } from "@/features/transactions/group-by-day";
import { TransactionList } from "@/features/transactions/transaction-list";
import { TransactionListBoundary } from "@/features/transactions/transaction-list-boundary";
import { findTransaction, listTransactions } from "@/features/transactions/transactions.dal";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageHeading } from "@/shared/ui/page-heading";
import { AddTransactionControl } from "@/views/app-shell/add-transaction-control";
import { PageTransition } from "@/views/app-shell/page-transition";
import { PeriodSkeleton } from "@/views/app-shell/period-skeleton";
import { PeriodSlide } from "@/views/app-shell/period-slide";
import { getShownPeriod, getToday, type ScreenSearchParams } from "@/views/app-shell/screen-data";

// An invalid, repeated or unknown id is the same as a missing transaction
async function getEditingId(searchParams: ScreenSearchParams) {
  const { edit } = await searchParams;
  if (edit === undefined) return undefined;

  const parsed = z.uuid().safeParse(edit);
  if (!parsed.success) notFound();
  return parsed.data;
}

async function EditSheetSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const editingId = await getEditingId(searchParams);
  if (editingId === undefined) return null;

  const [{ today, period }, tCategories, categories, transaction] = await Promise.all([
    getShownPeriod(searchParams),
    getTranslations("Categories"),
    listCategories(),
    findTransaction(editingId),
  ]);
  if (!transaction) notFound();

  return (
    <LazyEditTransactionSheet
      key={transaction.id}
      categories={categories.map((category) => ({
        id: category.id,
        type: category.type,
        defaultKey: category.defaultKey,
        icon: category.icon,
        label: categoryLabel(category, tCategories),
      }))}
      transaction={transaction}
      listQuery={toPeriodQuery(period, today)}
    />
  );
}

async function PeriodSection() {
  return <PeriodControl today={await getToday()} />;
}

async function PeriodTransactions({ searchParams }: { searchParams: ScreenSearchParams }) {
  const { today, period } = await getShownPeriod(searchParams);
  const transactions = await listTransactions(period);

  return (
    <TransactionList
      groups={groupByDay(transactions)}
      periodQuery={toPeriodQuery(period, today)}
      emptyAction={<AddTransactionControl placement="empty" />}
    />
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}

export async function TransactionsPage({ searchParams }: PageProps<"/[locale]/transactions">) {
  const t = await getTranslations("Transactions");

  return (
    <PageTransition>
      <div className="grid stagger gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeading>{t("heading")}</PageHeading>
          <Suspense fallback={<PeriodSkeleton />}>
            <PeriodSection />
          </Suspense>
        </div>
        {/* Nothing shows until the sheet's data is there: it opens over a ready list */}
        <Suspense fallback={null}>
          <EditSheetSection searchParams={searchParams} />
        </Suspense>
        <PeriodSwipeArea>
          <PeriodSlide>
            <TransactionListBoundary>
              <Suspense fallback={<ListSkeleton />}>
                <PeriodTransactions searchParams={searchParams} />
              </Suspense>
            </TransactionListBoundary>
          </PeriodSlide>
        </PeriodSwipeArea>
      </div>
    </PageTransition>
  );
}
