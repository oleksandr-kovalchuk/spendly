"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { categoryLabel } from "@/shared/categories/category-label";
import { ResponsiveSheet } from "@/shared/sheet/responsive-sheet";
import { toast } from "@/shared/ui/toast";

import { DeleteTransactionButton } from "./delete-transaction-button";
import type { CategoryOption } from "./category-option";
import { TransactionForm } from "./transaction-form";
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
  const isSavedRef = useRef(false);

  function handleSaved() {
    isSavedRef.current = true;
    setIsOpen(false);
  }

  // The toast waits until the sheet has closed, as AddTransactionSheet explains
  function handleOpenChangeComplete(open: boolean) {
    if (open) return;
    if (isSavedRef.current) toast.add({ type: "success", title: t("toast.updated") });
    const query = new URLSearchParams(listQuery);
    router.replace(`/${locale}/transactions${query.size > 0 ? `?${query.toString()}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <ResponsiveSheet
      open={isOpen}
      onOpenChange={setIsOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
      title={t("form.editHeading")}
    >
      <TransactionForm categories={categories} transaction={transaction} onSaved={handleSaved} />
      <DeleteTransactionButton
        transactionId={transaction.id}
        label={categoryLabel(transaction.category, tCategories)}
        listQuery={listQuery}
      />
    </ResponsiveSheet>
  );
}
