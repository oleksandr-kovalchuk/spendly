"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { ResponsiveSheet } from "@/shared/sheet/responsive-sheet";
import { toast } from "@/shared/ui/toast";

import type { CategoryOption } from "./category-option";
import { TransactionForm } from "./transaction-form";

type AddTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
  today: string;
  categories: CategoryOption[];
};

// The saved transaction shows through the action's refresh; the screen stays as it was.
// The toast waits until the sheet has closed: a toast's first render and measuring are
// synchronous, and landing as the refreshed screen's view transition starts, they make React skip it
export function AddTransactionSheet({
  open,
  onOpenChange,
  finalFocus,
  today,
  categories,
}: AddTransactionSheetProps) {
  const t = useTranslations("Transactions");
  const isSavedRef = useRef(false);

  function handleSaved() {
    isSavedRef.current = true;
    onOpenChange(false);
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    if (isOpen || !isSavedRef.current) return;
    isSavedRef.current = false;
    toast.add({ type: "success", title: t("toast.added") });
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      finalFocus={finalFocus}
      title={t("form.heading")}
    >
      <TransactionForm today={today} categories={categories} onSaved={handleSaved} />
    </ResponsiveSheet>
  );
}
