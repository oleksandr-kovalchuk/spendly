import { cva } from "class-variance-authority";
import { getTranslations } from "next-intl/server";
import { cache, Suspense } from "react";

import { AddTransactionButton } from "@/features/transactions/add-transaction-button";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { Skeleton } from "@/shared/ui/skeleton";

import { getCurrentUserOrSignIn, getToday } from "./screen-data";

type Placement = "bar" | "sidebar";

// The size of each placement's button
const skeletonVariants = cva("", {
  variants: { placement: { bar: "size-12 rounded-full", sidebar: "h-9 w-full" } },
});

// The bottom navigation and the sidebar each have an Add button: both render from one query
const getAddFormData = cache(async () => {
  const [user, today, tCategories] = await Promise.all([
    getCurrentUserOrSignIn(),
    getToday(),
    getTranslations("Categories"),
  ]);
  const categories = await listCategories(user.id);

  return {
    today,
    categories: categories.map((category) => ({
      id: category.id,
      type: category.type,
      label: categoryLabel(category, tCategories),
    })),
  };
});

async function AddTransaction({ placement }: { placement: Placement }) {
  const { today, categories } = await getAddFormData();

  // A new "today" (the time zone cookie set after the first load) resets the form's date
  return <AddTransactionButton placement={placement} today={today} categories={categories} />;
}

// The form needs the user's categories and today in their time zone, both request data
export function AddTransactionControl({ placement }: { placement: Placement }) {
  return (
    <Suspense fallback={<Skeleton className={skeletonVariants({ placement })} />}>
      <AddTransaction placement={placement} />
    </Suspense>
  );
}
