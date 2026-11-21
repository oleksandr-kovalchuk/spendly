"use client";

import { cva } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useLayoutEffect, useRef } from "react";

import { Button } from "@/shared/ui/button";

import { useAddTransaction } from "./add-transaction-context";

type Placement = "bar" | "sidebar" | "empty";

// In the bottom navigation a raised round button in the middle slot, in the sidebar a full-width
// one, in an empty list or chart one with its label
const buttonVariants = cva("", {
  variants: {
    placement: {
      bar: "size-12 rounded-full shadow-md [&_svg:not([class*='size-'])]:size-6",
      sidebar: "w-full",
      empty: "",
    },
  },
});

// Opens the one add form of the screen (AddTransactionProvider)
export function AddTransactionButton({ placement }: { placement: Placement }) {
  const t = useTranslations("Transactions");
  const id = useId();
  const { isOpen, opener, open } = useAddTransaction();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label = t("form.heading");
  const isIconOnly = placement === "bar";

  // An empty state's button goes away once the list has an item, often right after the closing
  // form has returned focus to it: focus moves to the screen instead of the page's start. A layout
  // effect's cleanup runs while the button is still in the document.
  useLayoutEffect(() => {
    const button = buttonRef.current;
    return () => {
      if (button !== null && button === document.activeElement) {
        document.querySelector("main")?.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <Button
      ref={buttonRef}
      size="lg"
      className={buttonVariants({ placement })}
      aria-label={isIconOnly ? label : undefined}
      aria-haspopup="dialog"
      aria-expanded={isOpen && opener?.id === id}
      onClick={(event) => open({ id, element: event.currentTarget })}
    >
      <PlusIcon aria-hidden />
      {isIconOnly ? null : label}
    </Button>
  );
}
