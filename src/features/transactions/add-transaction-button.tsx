"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useLayoutEffect, useRef } from "react";

import type { CategoryType } from "@/shared/db/app-constants";
import { Button } from "@/shared/ui/button";

import { useAddTransaction } from "./add-transaction-context";

const ICONS = { expense: MinusIcon, income: PlusIcon } as const;

export function AddTransactionButton({ type }: { type: CategoryType }) {
  const t = useTranslations("Transactions");
  const id = useId();
  const { isOpen, opener, open } = useAddTransaction();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const Icon = ICONS[type];

  // An empty state's button can unmount while focused; only a layout effect's cleanup still sees it
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
      size="icon-lg"
      variant={type}
      className="size-11 rounded-full duration-200 ease-out hover:shadow-soft motion-safe:hover:scale-110"
      aria-label={t(`form.add.${type}`)}
      aria-haspopup="dialog"
      aria-expanded={isOpen && opener?.id === id}
      onClick={(event) => open({ id, element: event.currentTarget, type })}
    >
      <Icon aria-hidden className="size-6" />
    </Button>
  );
}
