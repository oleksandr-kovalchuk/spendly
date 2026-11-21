import { cva } from "class-variance-authority";
import { getTranslations } from "next-intl/server";
import { cache, Suspense } from "react";

import { AddTransactionButton } from "@/features/transactions/add-transaction-button";
import { AddTransactionSheetHost } from "@/features/transactions/add-transaction-sheet-host";
import { categoryLabel } from "@/shared/categories/category-label";
import { listCategories } from "@/shared/categories/categories.dal";
import { Skeleton } from "@/shared/ui/skeleton";

import { getCurrentUserOrSignIn, getToday } from "./screen-data";

type Placement = "bar" | "sidebar" | "empty";

// The size of each placement's button
const skeletonVariants = cva("", {
  variants: {
    placement: { bar: "size-12 rounded-full", sidebar: "h-9 w-full", empty: "h-9 w-40" },
  },
});

// The form and every Add button render from one query
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
  await getAddFormData();

  return <AddTransactionButton placement={placement} />;
}

async function AddTransactionSheetData() {
  const { today, categories } = await getAddFormData();

  // A new "today" (the time zone cookie set after the first load) resets the form's date
  return <AddTransactionSheetHost today={today} categories={categories} />;
}

// The form needs the user's categories and today in their time zone, both request data: an Add
// button shows with them, so a tap on it opens a ready form
export function AddTransactionControl({ placement }: { placement: Placement }) {
  return (
    <Suspense fallback={<Skeleton className={skeletonVariants({ placement })} />}>
      <AddTransaction placement={placement} />
    </Suspense>
  );
}

// The one add form every Add button opens (AddTransactionProvider)
export function AddTransactionSheetSection() {
  return (
    <Suspense fallback={null}>
      <AddTransactionSheetData />
    </Suspense>
  );
}
