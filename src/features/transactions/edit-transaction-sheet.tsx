"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { categoryLabel } from "@/shared/categories/category-label";

import { DeleteTransactionButton } from "./delete-transaction-button";
import { TransactionForm, type CategoryOption } from "./transaction-form";
import { TransactionSheet } from "./transaction-sheet";
import type { TransactionDto } from "./transactions.dal";

type EditTransactionSheetProps = {
  categories: CategoryOption[];
  transaction: TransactionDto;
  // The list's period, which closing returns to
  listQuery: Record<string, string>;
};

// The URL names the transaction being edited, so the sheet opens with the page. Closing animates
// first and then drops it from the URL, keeping the period.
export function EditTransactionSheet({
  categories,
  transaction,
  listQuery,
}: EditTransactionSheetProps) {
  const t = useTranslations("Transactions");
  const tCategories = useTranslations("Categories");
  const router = useRouter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(true);

  function handleOpenChangeComplete(open: boolean) {
    if (open) return;
    const query = new URLSearchParams(listQuery);
    // The list stays where it was under the sheet
    router.replace(`/${locale}/transactions${query.size > 0 ? `?${query.toString()}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <TransactionSheet
      open={isOpen}
      onOpenChange={setIsOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
      title={t("form.editHeading")}
    >
      <TransactionForm
        categories={categories}
        transaction={transaction}
        onSaved={() => setIsOpen(false)}
      />
      <DeleteTransactionButton
        transactionId={transaction.id}
        label={categoryLabel(transaction.category, tCategories)}
        listQuery={listQuery}
      />
    </TransactionSheet>
  );
}
