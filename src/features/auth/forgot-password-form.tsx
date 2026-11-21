"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import { authClient } from "@/shared/auth/auth-client";
import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { fieldErrorOf, formErrorOf, type FormError } from "./auth-errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "./auth-schemas";
import { useFieldErrorMessage } from "./use-field-error-message";

type Result = { status: "sent"; email: string } | { status: "failed"; error: FormError };

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const messageOf = useFieldErrorMessage();
  const locale = useLocale();
  const [result, setResult] = useState<Result>();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  async function handleSubmit({ email }: ForgotPasswordValues) {
    setResult(undefined);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    });
    if (!error) {
      setResult({ status: "sent", email });
      return;
    }

    const fieldError = fieldErrorOf(error);
    if (fieldError?.field === "email") {
      form.setError("email", { message: fieldError.error });
      return;
    }
    setResult({ status: "failed", error: formErrorOf(error) });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("forgotPassword.intro")}</p>
      {result?.status === "sent" ? (
        <output className="block rounded-lg bg-muted px-3 py-2 text-sm">
          {t("forgotPassword.sent", { email: result.email })}
        </output>
      ) : null}
      <TextField
        label={t("fields.email")}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={messageOf(errors.email?.message)}
        {...form.register("email")}
      />
      {result?.status === "failed" ? <FieldError>{t(`errors.${result.error}`)}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSubmitting} focusableWhenDisabled>
        {t("forgotPassword.submit")}
      </Button>
    </form>
  );
}
