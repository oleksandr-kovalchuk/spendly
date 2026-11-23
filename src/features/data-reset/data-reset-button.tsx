"use client";

import { EraserIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

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

import { clearTransactions } from "./clear-transactions.action";
import { resetData } from "./reset-data.action";

type Kind = "transactions" | "all";

const ACTIONS = { transactions: clearTransactions, all: resetData } as const;
const ICONS = {
  transactions: <EraserIcon aria-hidden />,
  all: <RotateCcwIcon aria-hidden />,
} as const;

export function DataResetButton({ kind }: { kind: Kind }) {
  const t = useTranslations("DataReset");
  const [isOpen, setIsOpen] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDoneRef = useRef(false);

  function handleOpenChange(open: boolean) {
    // A request in flight can't be cancelled, so the dialog stays until it ends
    if (isPending) return;
    setIsOpen(open);
    setHasFailed(false);
  }

  // Toast after the dialog closes (see AGENTS.md)
  function handleOpenChangeComplete(open: boolean) {
    if (open || !isDoneRef.current) return;
    isDoneRef.current = false;
    toast.add({ type: "success", title: t(`${kind}.toast`) });
  }

  // Close in the action's transition (see AGENTS.md)
  function handleConfirm() {
    setHasFailed(false);
    startTransition(async () => {
      try {
        const result = await ACTIONS[kind]();
        if (result.serverError) {
          setHasFailed(true);
          return;
        }
      } catch {
        setHasFailed(true);
        return;
      }

      isDoneRef.current = true;
      startTransition(() => {
        setIsOpen(false);
      });
    });
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <AlertDialogTrigger render={<Button variant="outline" size="lg" />}>
        {ICONS[kind]}
        {t(`${kind}.action`)}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`${kind}.title`)}</AlertDialogTitle>
          <AlertDialogDescription>{t(`${kind}.description`)}</AlertDialogDescription>
        </AlertDialogHeader>
        {hasFailed ? <FieldError>{t("error")}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            focusableWhenDisabled
            onClick={handleConfirm}
          >
            {t(`${kind}.confirm`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
