"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { ResponsiveSheet } from "@/shared/sheet/responsive-sheet";
import { toast } from "@/shared/ui/toast";

import type { CategoryOption } from "./category-option";
import { flyToTotal } from "./fly-to-total";
import { TransactionForm } from "./transaction-form";
import type { TransactionValues } from "./transaction-schema";

type AddTransactionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
  today: string;
  categories: CategoryOption[];
};

export function AddTransactionSheet({
  open,
  onOpenChange,
  finalFocus,
  today,
  categories,
}: AddTransactionSheetProps) {
  const t = useTranslations("Transactions");
  const isSavedRef = useRef(false);
  const amountRef = useRef<HTMLDivElement>(null);

  function handleSaved({ type }: TransactionValues) {
    isSavedRef.current = true;
    if (amountRef.current) flyToTotal(amountRef.current, type);
    onOpenChange(false);
  }

  function handleInitialFocus() {
    return amountRef.current?.querySelector("input") ?? null;
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
      initialFocus={handleInitialFocus}
      finalFocus={finalFocus}
      title={t("form.heading")}
    >
      <TransactionForm
        today={today}
        categories={categories}
        onSaved={handleSaved}
        amountRef={amountRef}
      />
    </ResponsiveSheet>
  );
}
