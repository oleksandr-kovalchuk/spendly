"use client";

import { useLocale, useTranslations } from "next-intl";
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

type DeleteTransactionButtonProps = {
  transactionId: string;
  label: string;
  // The list's period, which the action returns to
  listQuery: Record<string, string>;
};

// A delete ends on the list without the edit form, so the success is a navigation
export function DeleteTransactionButton({
  transactionId,
  label,
  listQuery,
}: DeleteTransactionButtonProps) {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { execute, isPending, hasErrored, result, reset } = useAction(deleteTransaction);
  const error = result.serverError === "transactionNotFound" ? "transactionNotFound" : "unknown";

  function handleOpenChange(open: boolean) {
    // A request in flight can't be cancelled, so the dialog stays until it ends
    if (isPending) return;
    setIsOpen(open);
    reset();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="outline" size="lg" />}>
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
            onClick={() => execute({ id: transactionId, locale, listQuery })}
          >
            {t("delete.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
