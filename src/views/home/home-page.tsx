import { getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { groupByDay } from "@/features/transactions/group-by-day";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { TransactionList } from "@/features/transactions/transaction-list";
import { TransactionListBoundary } from "@/features/transactions/transaction-list-boundary";
import { listTransactions } from "@/features/transactions/transactions.dal";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { getCurrentUser } from "@/shared/auth/session";
import { monthOf, resolveTimeZone, TIME_ZONE_COOKIE, todayIn } from "@/shared/lib/time-zone";
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

async function AddTransaction() {
  const [user, today, tCategories] = await Promise.all([
    getCurrentUserOrSignIn(),
    getToday(),
    getTranslations("Categories"),
  ]);
  const categories = await listCategories(user.id);

  return (
    <TransactionForm
      today={today}
      categories={categories.map((category) => ({
        id: category.id,
        type: category.type,
        label: categoryLabel(category, tCategories),
      }))}
    />
  );
}

async function MonthTransactions() {
  const [user, today] = await Promise.all([getCurrentUserOrSignIn(), getToday()]);
  const transactions = await listTransactions(user.id, monthOf(today));

  return <TransactionList groups={groupByDay(transactions)} />;
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

export async function HomePage() {
  const t = await getTranslations("Home");
  const tTransactions = await getTranslations("Transactions");

  return (
    <div className="grid gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("heading")}</h1>
      <Suspense fallback={<FormSkeleton />}>
        <AddTransaction />
      </Suspense>
      <section className="grid gap-4">
        <h2 className="text-lg font-medium">{tTransactions("list.heading")}</h2>
        <TransactionListBoundary>
          <Suspense fallback={<ListSkeleton />}>
            <MonthTransactions />
          </Suspense>
        </TransactionListBoundary>
      </section>
    </div>
  );
}
