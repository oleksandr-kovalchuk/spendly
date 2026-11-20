import { getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";

import { parsePeriod, toPeriodQuery } from "@/features/periods/period";
import { PeriodControl } from "@/features/periods/period-control";
import { loadPeriodSearch } from "@/features/periods/period-search";
import { EditTransactionForm } from "@/features/transactions/edit-transaction-form";
import { groupByDay } from "@/features/transactions/group-by-day";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { TransactionList } from "@/features/transactions/transaction-list";
import { TransactionListBoundary } from "@/features/transactions/transaction-list-boundary";
import { findTransaction, listTransactions } from "@/features/transactions/transactions.dal";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { getCurrentUser } from "@/shared/auth/session";
import { resolveTimeZone, TIME_ZONE_COOKIE, todayIn } from "@/shared/lib/time-zone";
import { Skeleton } from "@/shared/ui/skeleton";

async function getCurrentUserOrSignIn() {
  const user = await getCurrentUser();
  if (!user) redirect(`/${await getLocale()}/sign-in`);

  return user;
}

async function getToday() {
  const timeZone = resolveTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  // The current time is never prerendered or prefetched
  await connection();
  return todayIn(timeZone, new Date());
}

type SearchParams = PageProps<"/[locale]">["searchParams"];

// An invalid, repeated or unknown id is the same as a missing transaction
async function getEditingId(searchParams: SearchParams) {
  const { edit } = await searchParams;
  if (edit === undefined) return undefined;

  const parsed = z.uuid().safeParse(edit);
  if (!parsed.success) notFound();
  return parsed.data;
}

async function getPeriodSearch(searchParams: SearchParams) {
  return loadPeriodSearch(await searchParams);
}

async function TransactionFormSection({ searchParams }: { searchParams: SearchParams }) {
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

async function PeriodTransactions({ searchParams }: { searchParams: SearchParams }) {
  const [user, today, editingId, search] = await Promise.all([
    getCurrentUserOrSignIn(),
    getToday(),
    getEditingId(searchParams),
    getPeriodSearch(searchParams),
  ]);
  const period = parsePeriod(search, today);
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

function PeriodSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-8 w-28 justify-self-center" />
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

export async function HomePage({ searchParams }: PageProps<"/[locale]">) {
  const t = await getTranslations("Home");
  const tTransactions = await getTranslations("Transactions");

  return (
    <div className="grid gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
      <Suspense fallback={<FormSkeleton />}>
        <TransactionFormSection searchParams={searchParams} />
      </Suspense>
      <section className="grid gap-4">
        <h2 className="text-lg font-medium">{tTransactions("list.heading")}</h2>
        <Suspense fallback={<PeriodSkeleton />}>
          <PeriodSection />
        </Suspense>
        <TransactionListBoundary>
          <Suspense fallback={<ListSkeleton />}>
            <PeriodTransactions searchParams={searchParams} />
          </Suspense>
        </TransactionListBoundary>
      </section>
    </div>
  );
}
