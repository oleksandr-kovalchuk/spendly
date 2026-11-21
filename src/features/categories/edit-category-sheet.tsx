"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import type { CategoryIconKey, DefaultCategoryKey } from "@/shared/db/app-constants";
import { toast } from "@/shared/ui/toast";

import { CategorySheet } from "./category-sheet";
import { EditCategoryForm } from "./edit-category-form";

type EditCategorySheetProps = {
  id: string;
  label: string;
  defaultKey: DefaultCategoryKey | null;
  icon: CategoryIconKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
};

// The toast waits until the sheet has closed, as AddTransactionSheet explains
export function EditCategorySheet({
  id,
  label,
  defaultKey,
  icon,
  open,
  onOpenChange,
  finalFocus,
}: EditCategorySheetProps) {
  const t = useTranslations("Categories");
  const isSavedRef = useRef(false);
  const isDefault = defaultKey !== null;

  function handleDone(isSaved: boolean) {
    isSavedRef.current = isSaved;
    onOpenChange(false);
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    if (isOpen || !isSavedRef.current) return;
    isSavedRef.current = false;
    toast.add({ type: "success", title: t(isDefault ? "toast.renamed" : "toast.updated") });
  }

  return (
    <CategorySheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      finalFocus={finalFocus}
      title={t(isDefault ? "list.rename" : "list.edit", { category: label })}
    >
      <EditCategoryForm
        id={id}
        label={label}
        defaultKey={defaultKey}
        icon={icon}
        onDone={handleDone}
      />
    </CategorySheet>
  );
}
