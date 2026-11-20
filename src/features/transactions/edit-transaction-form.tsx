"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { TransactionForm, type CategoryOption } from "./transaction-form";
import type { TransactionDto } from "./transactions.dal";

type EditTransactionFormProps = { categories: CategoryOption[]; transaction: TransactionDto };

// The URL carries the transaction being edited, so leaving the form means dropping it
export function EditTransactionForm({ categories, transaction }: EditTransactionFormProps) {
  const router = useRouter();
  const locale = useLocale();

  function handleClose() {
    router.replace(`/${locale}`);
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
