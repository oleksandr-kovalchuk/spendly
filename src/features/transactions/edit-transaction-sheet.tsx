"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { categoryLabel } from "@/shared/categories/category-label";
import { ResponsiveSheet } from "@/shared/sheet/responsive-sheet";
import { toast } from "@/shared/ui/toast";

import { DeleteTransactionButton } from "./delete-transaction-button";
import type { CategoryOption } from "./category-option";
import { listUrlOf, type ListScreen } from "./list-url";
import { TransactionForm } from "./transaction-form";
import type { TransactionDto } from "./transactions.dal";

type EditTransactionSheetProps = {
  categories: CategoryOption[];
  transaction: TransactionDto;
  screen: ListScreen;
  listQuery: Record<string, string>;
};

// Opens from the URL's `edit`; closing animates first, then drops it from the URL
export function EditTransactionSheet({
  categories,
  transaction,
  screen,
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

  // Toast after the sheet closes (see AGENTS.md)
  function handleOpenChangeComplete(open: boolean) {
    if (open) return;
    if (isSavedRef.current) toast.add({ type: "success", title: t("toast.updated") });
    router.replace(listUrlOf(locale, screen, listQuery), { scroll: false });
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
        screen={screen}
        listQuery={listQuery}
      />
    </ResponsiveSheet>
  );
}
