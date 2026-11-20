"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/shared/ui/button";

import { RenameCategoryForm } from "./rename-category-form";

export function CategoryItem({ id, label }: { id: string; label: string }) {
  const t = useTranslations("Categories");
  const [isRenaming, setIsRenaming] = useState(false);
  const renameButtonRef = useRef<HTMLButtonElement>(null);

  // Focus goes back to the Rename button, which the closing form gives way to
  function handleClose() {
    flushSync(() => setIsRenaming(false));
    renameButtonRef.current?.focus();
  }

  if (isRenaming) {
    return (
      <li className="py-3">
        <RenameCategoryForm id={id} label={label} onClose={handleClose} />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 py-2">
      <span className="min-w-0 font-medium break-words">{label}</span>
      <Button
        ref={renameButtonRef}
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t("list.rename", { category: label })}
        onClick={() => setIsRenaming(true)}
      >
        {t("list.renameAction")}
      </Button>
    </li>
  );
}
