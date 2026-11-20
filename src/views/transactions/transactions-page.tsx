import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { EditTransactionForm } from "@/features/transactions/edit-transaction-form";
import { groupByDay } from "@/features/transactions/group-by-day";
import { TransactionForm } from "@/features/transactions/transaction-form";
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

async function TransactionFormSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const [user, today, tCategories, editingId] = await Promise.all([
    getCurrentUserOrSignIn(),
    getToday(),
    getTranslations("Categories"),
    getEditingId(searchParams),
  ]);
  const [categories, transaction] = await Promise.all([
    listCategories(user.id),
    editingId === undefined ? undefined : findTransaction(user.id, editingId),
  ]);
  if (editingId !== undefined && !transaction) notFound();

  const options = categories.map((category) => ({
    id: category.id,
    type: category.type,
    label: categoryLabel(category, tCategories),
  }));

  return transaction ? (
    <EditTransactionForm categories={options} transaction={transaction} />
  ) : (
    <TransactionForm today={today} categories={options} />
  );
}

async function PeriodSection() {
  return <PeriodControl today={await getToday()} />;
}

async function PeriodTransactions({ searchParams }: { searchParams: ScreenSearchParams }) {
  const [user, { today, period }, editingId] = await Promise.all([
    getCurrentUserOrSignIn(),
    getShownPeriod(searchParams),
    getEditingId(searchParams),
  ]);
  const transactions = await listTransactions(user.id, period);

  // Edit links keep the period, so the list stays where the user is
  return (
    <TransactionList
      groups={groupByDay(transactions)}
      editingId={editingId}
      periodQuery={toPeriodQuery(period, today)}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
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
        <Suspense fallback={<FormSkeleton />}>
          <TransactionFormSection searchParams={searchParams} />
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
