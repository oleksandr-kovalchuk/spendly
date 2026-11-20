import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { LazyEditTransactionSheet } from "@/features/transactions/lazy-edit-transaction-sheet";
import { groupByDay } from "@/features/transactions/group-by-day";
import { TransactionList } from "@/features/transactions/transaction-list";
import { TransactionListBoundary } from "@/features/transactions/transaction-list-boundary";
import { findTransaction, listTransactions } from "@/features/transactions/transactions.dal";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { Skeleton } from "@/shared/ui/skeleton";
import { PageTransition } from "@/views/app-shell/page-transition";
import { PeriodSkeleton } from "@/views/app-shell/period-skeleton";
import {
  getCurrentUserOrSignIn,
  getShownPeriod,
  getToday,
  type ScreenSearchParams,
} from "@/views/app-shell/screen-data";

// An invalid, repeated or unknown id is the same as a missing transaction
async function getEditingId(searchParams: ScreenSearchParams) {
  const { edit } = await searchParams;
  if (edit === undefined) return undefined;

  const parsed = z.uuid().safeParse(edit);
  if (!parsed.success) notFound();
  return parsed.data;
}

// The edit sheet opens over the list when the URL names a transaction
async function EditSheetSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const editingId = await getEditingId(searchParams);
  if (editingId === undefined) return null;

  const [user, { today, period }, tCategories] = await Promise.all([
    getCurrentUserOrSignIn(),
    getShownPeriod(searchParams),
    getTranslations("Categories"),
  ]);
  const [categories, transaction] = await Promise.all([
    listCategories(user.id),
    findTransaction(user.id, editingId),
  ]);
  if (!transaction) notFound();

  return (
    <LazyEditTransactionSheet
      key={transaction.id}
      categories={categories.map((category) => ({
        id: category.id,
        type: category.type,
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
  const [user, { today, period }] = await Promise.all([
    getCurrentUserOrSignIn(),
    getShownPeriod(searchParams),
  ]);
  const transactions = await listTransactions(user.id, period);

  // Edit links keep the period, so the list stays where the user is
  return (
    <TransactionList groups={groupByDay(transactions)} periodQuery={toPeriodQuery(period, today)} />
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

export async function TransactionsPage({ searchParams }: PageProps<"/[locale]/transactions">) {
  const t = await getTranslations("Transactions");

  return (
    <PageTransition>
      <div className="grid gap-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
        {/* Nothing shows until the sheet's data is there: it opens over a ready list */}
        <Suspense fallback={null}>
          <EditSheetSection searchParams={searchParams} />
        </Suspense>
        <div className="grid gap-4">
          <Suspense fallback={<PeriodSkeleton />}>
            <PeriodSection />
          </Suspense>
          <TransactionListBoundary>
            <Suspense fallback={<ListSkeleton />}>
              <PeriodTransactions searchParams={searchParams} />
            </Suspense>
          </TransactionListBoundary>
        </div>
      </div>
    </PageTransition>
  );
}
