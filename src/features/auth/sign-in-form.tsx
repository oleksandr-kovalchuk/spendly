"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import { authClient } from "@/shared/auth/auth-client";
import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { formErrorOf, type FormError, type GoogleError } from "./auth-errors";
import { signInSchema, type SignInValues } from "./auth-schemas";
import { PasswordField } from "./password-field";
import { useFieldErrorMessage } from "./use-field-error-message";

export type SignInNotice = "registered" | "passwordReset" | "accountDeleted";

type SignInFormProps = {
  defaultEmail?: string;
  notice?: SignInNotice;
  googleError?: GoogleError;
};

export function SignInForm({ defaultEmail = "", notice, googleError }: SignInFormProps) {
  const t = useTranslations("Auth");
  const messageOf = useFieldErrorMessage();
  const locale = useLocale();
  const [formError, setFormError] = useState<FormError>();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: defaultEmail, password: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  async function handleSubmit(values: SignInValues) {
    setFormError(undefined);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setFormError(formErrorOf(error));
      return;
    }

    // A client navigation would reuse the prefetched signed-out redirect (decision 0004)
    window.location.assign(`/${locale}`);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-4">
      {notice ? (
        <output className="block rounded-lg bg-muted px-3 py-2 text-sm">
          {t(`signIn.${notice}`)}
        </output>
      ) : null}
      {googleError ? <FieldError>{t(`errors.${googleError}`)}</FieldError> : null}
      <TextField
        label={t("fields.email")}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={messageOf(errors.email?.message)}
        {...form.register("email")}
      />
      <PasswordField
        label={t("fields.password")}
        autoComplete="current-password"
        error={messageOf(errors.password?.message)}
        {...form.register("password")}
      />
      <Link
        href={`/${locale}/forgot-password`}
        className="inline-flex min-h-6 items-center justify-self-end text-sm text-foreground underline underline-offset-4"
      >
        {t("signIn.forgotPassword")}
      </Link>
      {formError ? <FieldError>{t(`errors.${formError}`)}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSubmitting} focusableWhenDisabled>
        {t("signIn.submit")}
      </Button>
    </form>
  );
}
