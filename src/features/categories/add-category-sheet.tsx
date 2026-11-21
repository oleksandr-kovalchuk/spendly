"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import type { CategoryType } from "@/shared/db/app-constants";
import { toast } from "@/shared/ui/toast";

import { CategorySheet } from "./category-sheet";
import { CreateCategoryForm } from "./create-category-form";

type AddCategorySheetProps = {
  type: CategoryType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
};

// The toast waits until the sheet has closed, as AddTransactionSheet explains
export function AddCategorySheet({ type, open, onOpenChange, finalFocus }: AddCategorySheetProps) {
  const t = useTranslations("Categories");
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
    <CategorySheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      finalFocus={finalFocus}
      title={t(`form.${type}Heading`)}
    >
      <CreateCategoryForm type={type} onSaved={handleSaved} />
    </CategorySheet>
  );
}
