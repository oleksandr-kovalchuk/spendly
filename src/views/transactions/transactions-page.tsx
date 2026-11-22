import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { z } from "zod";

import { toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { PeriodSwipeArea } from "@/features/periods/period-swipe-area";
import { CategoryFilter } from "@/features/transactions/category-filter";
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

async function getEditingId(searchParams: ScreenSearchParams) {
  const { edit } = await searchParams;
  if (edit === undefined) return undefined;

  const parsed = z.uuid().safeParse(edit);
  if (!parsed.success) notFound();
  return parsed.data;
}

const getCategories = cache(listCategories);

const getShownList = cache(async (searchParams: ScreenSearchParams) => {
  const [{ today, period }, { category: rawCategory }] = await Promise.all([
    getShownPeriod(searchParams),
    searchParams,
  ]);
  const categoryId = z.uuid().safeParse(rawCategory).data;
  const category =
    categoryId === undefined
      ? undefined
      : (await getCategories()).find((candidate) => candidate.id === categoryId);
  const periodQuery = toPeriodQuery(period, today);
  const listQuery = category ? { ...periodQuery, category: category.id } : periodQuery;

  return { period, category, periodQuery, listQuery };
});

async function EditSheetSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const editingId = await getEditingId(searchParams);
  if (editingId === undefined) return null;

  const [{ listQuery }, tCategories, categories, transaction] = await Promise.all([
    getShownList(searchParams),
    getTranslations("Categories"),
    getCategories(),
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
      listQuery={listQuery}
    />
  );
}

async function CategoryFilterSection({ searchParams }: { searchParams: ScreenSearchParams }) {
  const [{ category, periodQuery }, tCategories] = await Promise.all([
    getShownList(searchParams),
    getTranslations("Categories"),
  ]);
  if (!category) return null;

  return (
    <CategoryFilter
      category={{
        id: category.id,
        defaultKey: category.defaultKey,
        icon: category.icon,
        label: categoryLabel(category, tCategories),
      }}
      clearQuery={periodQuery}
    />
  );
}

async function PeriodSection() {
  return <PeriodControl today={await getToday()} />;
}

async function PeriodTransactions({ searchParams }: { searchParams: ScreenSearchParams }) {
  const { period, category, listQuery } = await getShownList(searchParams);
  const transactions = await listTransactions({ ...period, categoryId: category?.id });

  return (
    <TransactionList
      groups={groupByDay(transactions)}
      listQuery={listQuery}
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
        <Suspense fallback={null}>
          <CategoryFilterSection searchParams={searchParams} />
        </Suspense>
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
