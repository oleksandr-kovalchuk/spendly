"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
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

import { deleteCategory } from "./delete-category.action";

type DeleteCategoryButtonProps = {
  id: string;
  label: string;
  transactionCount: number;
  isOther: boolean;
  otherLabel: string;
};

const SERVER_ERRORS = ["categoryNotFound", "otherHasTransactions"] as const;

function errorOf(serverError: unknown) {
  return SERVER_ERRORS.find((code) => code === serverError) ?? "unknown";
}

export function DeleteCategoryButton({
  id,
  label,
  transactionCount,
  isOther,
  otherLabel,
}: DeleteCategoryButtonProps) {
  const t = useTranslations("Categories");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLElement | null>(null);
  const isDeletingRef = useRef(false);
  const { execute, isPending, hasErrored, result, reset } = useAction(deleteCategory, {
    onError: () => {
      isDeletingRef.current = false;
    },
  });
  // Other's transactions would have nowhere to go
  const isBlocked = isOther && transactionCount > 0;

  // The delete's refresh unmounts this row: toast then, and focus the list heading, not the page start
  useEffect(
    () => () => {
      if (!isDeletingRef.current) return;
      toast.add({ type: "success", title: t("toast.deleted") });
      headingRef.current?.focus();
    },
    [t],
  );

  function handleDelete() {
    headingRef.current = triggerRef.current?.closest("section")?.querySelector("h2") ?? null;
    isDeletingRef.current = true;
    execute({ id });
  }

  function handleOpenChange(open: boolean) {
    // A request in flight can't be cancelled, so the dialog stays until it ends
    if (isPending) return;
    setIsOpen(open);
    reset();
  }

  function description() {
    if (isBlocked) return t("delete.blockedDescription", { count: transactionCount });
    const key = transactionCount > 0 ? "delete.moveDescription" : "delete.emptyDescription";
    return t(key, { count: transactionCount, other: otherLabel });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon-sm"
            aria-label={t("delete.action", { category: label })}
          />
        }
      >
        <Trash2Icon aria-hidden />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(isBlocked ? "delete.blockedTitle" : "delete.title", { category: label })}
          </AlertDialogTitle>
          <AlertDialogDescription>{description()}</AlertDialogDescription>
        </AlertDialogHeader>
        {hasErrored ? <FieldError>{t(`errors.${errorOf(result.serverError)}`)}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t(isBlocked ? "delete.close" : "form.cancel")}
          </AlertDialogCancel>
          {isBlocked ? null : (
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              focusableWhenDisabled
              onClick={handleDelete}
            >
              {t("delete.confirm")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
