"use client";

import { cva } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import type { CategoryOption } from "./transaction-form";

// The sheet and its form aren't needed for the first paint: they load after it, and a tap
// before that opens the sheet once it's there
const AddTransactionSheet = dynamic(
  () => import("./add-transaction-sheet").then((mod) => mod.AddTransactionSheet),
  { ssr: false },
);

type Placement = "bar" | "sidebar";
type AddTransactionButtonProps = {
  placement: Placement;
  today: string;
  categories: CategoryOption[];
};

// In the bottom navigation a raised round button in the middle slot, in the sidebar a full-width one
const buttonVariants = cva("", {
  variants: {
    placement: {
      bar: "size-12 rounded-full shadow-md [&_svg:not([class*='size-'])]:size-6",
      sidebar: "w-full",
    },
  },
});

export function AddTransactionButton({ placement, today, categories }: AddTransactionButtonProps) {
  const t = useTranslations("Transactions");
  const [isOpen, setIsOpen] = useState(false);
  // Closing returns focus here, also where a tap doesn't focus the button (Safari)
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label = t("form.heading");

  return (
    <>
      <Button
        ref={buttonRef}
        size="lg"
        className={buttonVariants({ placement })}
        aria-label={placement === "bar" ? label : undefined}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <PlusIcon aria-hidden />
        {placement === "sidebar" ? label : null}
      </Button>
      <AddTransactionSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        finalFocus={buttonRef}
        today={today}
        categories={categories}
      />
    </>
  );
}
