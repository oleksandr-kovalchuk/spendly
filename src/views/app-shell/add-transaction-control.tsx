import { cache, Suspense } from "react";

import { AddTransactionButton } from "@/features/transactions/add-transaction-button";
import { AddTransactionSheetHost } from "@/features/transactions/add-transaction-sheet-host";
import { CATEGORY_TYPES } from "@/shared/db/app-constants";
import { Skeleton } from "@/shared/ui/skeleton";

import { getCategoryOptions, getToday } from "./screen-data";

// The form and every Add button render from one query
const getAddFormData = cache(async () => {
  const [today, categories] = await Promise.all([getToday(), getCategoryOptions()]);
  return { today, categories };
});

async function AddTransaction() {
  await getAddFormData();

  return CATEGORY_TYPES.map((type) => <AddTransactionButton key={type} type={type} />);
}

async function AddTransactionSheetData() {
  const { today, categories } = await getAddFormData();

  return <AddTransactionSheetHost today={today} categories={categories} />;
}

// The buttons wait for the form's request data, so a tap opens a ready form
export function AddTransactionControl() {
  return (
    <div className="flex justify-center gap-2">
      <Suspense
        fallback={CATEGORY_TYPES.map((type) => (
          <Skeleton key={type} className="size-11 rounded-full" />
        ))}
      >
        <AddTransaction />
      </Suspense>
    </div>
  );
}

export function AddTransactionSheetSection() {
  return (
    <Suspense fallback={null}>
      <AddTransactionSheetData />
    </Suspense>
  );
}
