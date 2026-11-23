"use client";

import { cva } from "class-variance-authority";
import { Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";
import { toast } from "@/shared/ui/toast";

import { deleteTransaction } from "./delete-transaction.action";
import type { ListScreen } from "./list-url";

type Placement = "sheet" | "row";

type DeleteTransactionButtonProps = {
  transactionId: string;
  label: string;
  screen: ListScreen;
  listQuery: Record<string, string>;
  placement?: Placement;
};

const TRIGGER_VARIANT = { sheet: "outline", row: "destructive" } as const;

const triggerVariants = cva("", {
  variants: { placement: { sheet: "", row: "size-full flex-col gap-1 rounded-none text-xs" } },
});

export function DeleteTransactionButton({
  transactionId,
  label,
  screen,
  listQuery,
  placement = "sheet",
}: DeleteTransactionButtonProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const isDeletingRef = useRef(false);
  const { execute, isPending, hasErrored, result, reset } = useAction(deleteTransaction, {
    onError: () => {
      isDeletingRef.current = false;
    },
  });
  const error = result.serverError === "transactionNotFound" ? "transactionNotFound" : "unknown";

  // On unmount, once the redirect's view transition ends: a toast during it makes React skip it
  useEffect(
    () => () => {
      if (isDeletingRef.current) toast.add({ type: "success", title: t("toast.deleted") });
    },
    [t],
  );

  function handleDelete() {
    isDeletingRef.current = true;
    execute({ id: transactionId, locale, screen, listQuery });
  }

  function handleOpenChange(open: boolean) {
    if (isPending) return;
    setIsOpen(open);
    reset();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            variant={TRIGGER_VARIANT[placement]}
            size="lg"
            className={triggerVariants({ placement })}
          />
        }
      >
        {placement === "row" ? <Trash2Icon aria-hidden className="size-5" /> : null}
        {t("delete.action")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete.description", { category: label })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {hasErrored ? <FieldError>{t(`errors.${error}`)}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            focusableWhenDisabled
            onClick={handleDelete}
          >
            {t("delete.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
