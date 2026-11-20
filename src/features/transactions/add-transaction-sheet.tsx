"use client";

import { useTranslations } from "next-intl";
import type { RefObject } from "react";

import { TransactionForm, type CategoryOption } from "./transaction-form";
import { TransactionSheet } from "./transaction-sheet";

type AddTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: RefObject<HTMLElement | null>;
  today: string;
  categories: CategoryOption[];
};

// The saved transaction shows through the action's refresh; the screen stays as it was
export function AddTransactionSheet({
  open,
  onOpenChange,
  finalFocus,
  today,
  categories,
}: AddTransactionSheetProps) {
  const t = useTranslations("Transactions");

  return (
    <TransactionSheet
      open={open}
      onOpenChange={onOpenChange}
      finalFocus={finalFocus}
      title={t("form.heading")}
    >
      <TransactionForm today={today} categories={categories} onSaved={() => onOpenChange(false)} />
    </TransactionSheet>
  );
}
