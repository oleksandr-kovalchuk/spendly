"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import type { CategoryType } from "@/shared/db/app-constants";
import { ResponsiveSheet } from "@/shared/sheet/responsive-sheet";
import { toast } from "@/shared/ui/toast";

import type { CategoryOption } from "./category-option";
import { flyToTotal } from "./fly-to-total";
import { TransactionForm } from "./transaction-form";

type AddTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
  type: CategoryType;
  today: string;
  categories: CategoryOption[];
};

export function AddTransactionSheet({
  open,
  onOpenChange,
  finalFocus,
  type,
  today,
  categories,
}: AddTransactionSheetProps) {
  const t = useTranslations("Transactions");
  const isSavedRef = useRef(false);
  const amountRef = useRef<HTMLDivElement>(null);

  function handleSaved() {
    isSavedRef.current = true;
    if (amountRef.current) flyToTotal(amountRef.current, type);
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
      title={t(`form.heading.${type}`)}
    >
      <TransactionForm
        type={type}
        today={today}
        categories={categories}
        onSaved={handleSaved}
        amountRef={amountRef}
      />
    </ResponsiveSheet>
  );
}
