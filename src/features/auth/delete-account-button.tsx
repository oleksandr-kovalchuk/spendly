"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserXIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import { authClient } from "@/shared/auth/auth-client";
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

import { deleteAccountErrorOf, fieldErrorOf, type DeleteAccountError } from "./auth-errors";
import { deleteAccountSchema, type DeleteAccountValues } from "./auth-schemas";
import { PasswordField } from "./password-field";
import { useFieldErrorMessage } from "./use-field-error-message";

type Result = { status: "deleted" } | { status: "failed"; error: DeleteAccountError };

// An account without a password (Google) confirms with its recent sign-in instead
export function DeleteAccountButton({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations("Auth");
  const messageOf = useFieldErrorMessage();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<Result>();
  const form = useForm<DeleteAccountValues>({
    resolver: hasPassword ? zodResolver(deleteAccountSchema) : undefined,
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { password: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });
  // The page is about to reload after a delete, so nothing may be pressed again
  const isBusy = isSubmitting || result?.status === "deleted";

  function handleOpenChange(open: boolean) {
    // A request in flight can't be cancelled, so the dialog stays until it ends
    if (isBusy) return;
    setIsOpen(open);
    setResult(undefined);
    form.reset();
  }

  async function handleSubmit({ password }: DeleteAccountValues) {
    setResult(undefined);
    const { error } = await authClient.deleteUser(hasPassword ? { password } : {});
    if (!error) {
      setResult({ status: "deleted" });
      // A full page load drops everything the deleted user left in the client
      window.location.assign(`/${locale}/sign-in?accountDeleted=1`);
      return;
    }

    const fieldError = fieldErrorOf(error);
    if (fieldError?.field === "password") {
      form.setError("password", { message: fieldError.error });
      return;
    }
    setResult({ status: "failed", error: deleteAccountErrorOf(error) });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="destructive" size="lg" />}>
        <UserXIcon aria-hidden />
        {t("deleteAccount.action")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAccount.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAccount.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          {hasPassword ? (
            <PasswordField
              label={t("fields.password")}
              autoComplete="current-password"
              error={messageOf(errors.password?.message)}
              {...form.register("password")}
            />
          ) : null}
          {result?.status === "failed" ? (
            <FieldError>{t(`errors.${result.error}`)}</FieldError>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>{t("deleteAccount.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={isBusy}
              focusableWhenDisabled
            >
              {t("deleteAccount.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
