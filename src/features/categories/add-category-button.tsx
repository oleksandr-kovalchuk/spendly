"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import type { CategoryType } from "@/shared/db/app-constants";
import { Button } from "@/shared/ui/button";

const AddCategorySheet = dynamic(
  () => import("./add-category-sheet").then((mod) => mod.AddCategorySheet),
  { ssr: false },
);

// The visible "Add" starts the name, which says the type, so voice control finds it by what shows
export function AddCategoryButton({ type }: { type: CategoryType }) {
  const t = useTranslations("Categories");
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    setHasOpened(true);
    setIsOpen(true);
  }

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        aria-label={t(`list.${type}Add`)}
        onClick={handleOpen}
      >
        <PlusIcon aria-hidden />
        {t("form.add")}
      </Button>
      {/* Closing returns focus to this button, also where a tap doesn't focus it (Safari) */}
      {hasOpened ? (
        <AddCategorySheet
          type={type}
          open={isOpen}
          onOpenChange={setIsOpen}
          finalFocus={() => buttonRef.current}
        />
      ) : null}
    </>
  );
}
