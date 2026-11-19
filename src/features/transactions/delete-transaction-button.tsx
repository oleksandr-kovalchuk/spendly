"use client";

import { useTranslations } from "next-intl";
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

type DeleteError = "transactionNotFound" | "unknown";

export function DeleteTransactionButton({
  transactionId,
  label,
}: {
  transactionId: string;
  label: string;
}) {
  const t = useTranslations("Transactions");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<DeleteError>();

  function handleOpenChange(open: boolean) {
    // A request in flight can't be cancelled, so the dialog stays until it ends
    if (isDeleting) return;
    setIsOpen(open);
    setError(undefined);
  }

  async function handleConfirm() {
    setError(undefined);
    setIsDeleting(true);
    try {
      const result = await deleteTransaction({ id: transactionId });
      if (result.serverError || result.validationErrors) {
        setError(result.serverError === "transactionNotFound" ? "transactionNotFound" : "unknown");
        return;
      }
      setIsOpen(false);
    } catch {
      setError("unknown");
    } finally {
      setIsDeleting(false);
    }
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
        {error ? <FieldError>{t(`errors.${error}`)}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleConfirm}>
            {t("delete.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
