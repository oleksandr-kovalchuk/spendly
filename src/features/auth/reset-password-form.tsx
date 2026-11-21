"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import { authClient } from "@/shared/auth/auth-client";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { fieldErrorOf, formErrorOf, type FormError } from "./auth-errors";
import { resetPasswordSchema, type ResetPasswordValues } from "./auth-schemas";
import { PasswordField } from "./password-field";
import { useFieldErrorMessage } from "./use-field-error-message";

// Better Auth's code for a reset token that is unknown, used or expired
const INVALID_TOKEN = "INVALID_TOKEN";

type Result = { status: "invalidLink" } | { status: "failed"; error: FormError };

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations("Auth");
  const messageOf = useFieldErrorMessage();
  const locale = useLocale();
  const router = useRouter();
  const [result, setResult] = useState<Result | undefined>(
    token ? undefined : { status: "invalidLink" },
  );
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { password: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  async function handleSubmit({ password }: ResetPasswordValues) {
    if (!token) return;

    setResult(undefined);
    const { error } = await authClient.resetPassword({ token, newPassword: password });
    if (!error) {
      router.push(`/${locale}/sign-in?passwordReset=1`);
      return;
    }

    if (error.code === INVALID_TOKEN) {
      setResult({ status: "invalidLink" });
      return;
    }
    const fieldError = fieldErrorOf(error);
    if (fieldError?.field === "password") {
      form.setError("password", { message: fieldError.error });
      return;
    }
    setResult({ status: "failed", error: formErrorOf(error) });
  }

  if (result?.status === "invalidLink") {
    return (
      <div className="grid gap-4">
        <FieldError>{t("resetPassword.invalidLink")}</FieldError>
        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm text-foreground underline underline-offset-4"
        >
          {t("resetPassword.requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-4">
      <PasswordField
        label={t("fields.newPassword")}
        autoComplete="new-password"
        error={messageOf(errors.password?.message)}
        {...form.register("password")}
      />
      <p className="text-sm text-muted-foreground">{t("signUp.passwordHint")}</p>
      {result?.status === "failed" ? <FieldError>{t(`errors.${result.error}`)}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSubmitting} focusableWhenDisabled>
        {t("resetPassword.submit")}
      </Button>
    </form>
  );
}
