"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

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

import { deleteTransaction } from "./delete-transaction.action";

export function DeleteTransactionButton({
  transactionId,
  label,
}: {
  transactionId: string;
  label: string;
}) {
  const t = useTranslations("Transactions");
  const [isOpen, setIsOpen] = useState(false);
  const { execute, isPending, hasErrored, result, reset } = useAction(deleteTransaction, {
    onSuccess: () => setIsOpen(false),
  });
  const error = result.serverError === "transactionNotFound" ? "transactionNotFound" : "unknown";

  function handleOpenChange(open: boolean) {
    // A request in flight can't be cancelled, so the dialog stays until it ends
    if (isPending) return;
    setIsOpen(open);
    reset();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm" aria-label={t("list.delete", { category: label })} />
        }
      >
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
            onClick={() => execute({ id: transactionId })}
          >
            {t("delete.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
