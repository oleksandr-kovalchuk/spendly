"use client";

import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { TransactionForm, type CategoryOption } from "./transaction-form";
import type { TransactionDto } from "./transactions.dal";

type EditTransactionFormProps = { categories: CategoryOption[]; transaction: TransactionDto };

// The URL carries the transaction being edited, so leaving the form means dropping it;
// the other search params (the period) stay
export function EditTransactionForm({ categories, transaction }: EditTransactionFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  function handleClose() {
    const rest = new URLSearchParams(searchParams);
    rest.delete("edit");
    router.replace(rest.size > 0 ? `/${locale}?${rest.toString()}` : `/${locale}`);
  }

  return (
    <TransactionForm
      categories={categories}
      today={transaction.occurredOn}
      transaction={transaction}
      onSaved={handleClose}
      onCancel={handleClose}
    />
  );
}
