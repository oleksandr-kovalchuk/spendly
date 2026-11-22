"use client";

import { cva } from "class-variance-authority";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useLayoutEffect, useRef } from "react";

import { Button } from "@/shared/ui/button";

import { useAddTransaction } from "./add-transaction-context";

type Placement = "bar" | "sidebar" | "empty";

const buttonVariants = cva("", {
  variants: {
    placement: {
      bar: "size-12 rounded-2xl shadow-aurora [&_svg:not([class*='size-'])]:size-6",
      sidebar: "h-11 w-full rounded-xl",
      empty: "",
    },
  },
});

export function AddTransactionButton({ placement }: { placement: Placement }) {
  const t = useTranslations("Transactions");
  const id = useId();
  const { isOpen, opener, open } = useAddTransaction();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label = t("form.heading");
  const isIconOnly = placement === "bar";

  // An empty state's button unmounts once the list has an item, often while focused: focus moves to
  // the screen, not the page's start. A layout effect's cleanup still sees the button in the document
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
