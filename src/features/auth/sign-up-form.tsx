"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm, useFormState } from "react-hook-form";
import { useState } from "react";

import { authClient } from "@/shared/auth/auth-client";
import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { fieldErrorOf, formErrorOf, type FormError } from "./auth-errors";
import { signUpSchema, type SignUpValues } from "./auth-schemas";
import { PasswordField } from "./password-field";
import { useFieldErrorMessage } from "./use-field-error-message";

export function SignUpForm() {
  const t = useTranslations("Auth");
  const messageOf = useFieldErrorMessage();
  const locale = useLocale();
  const router = useRouter();
  const [formError, setFormError] = useState<FormError>();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });

  async function handleSubmit({ email, password }: SignUpValues) {
    setFormError(undefined);
    // Better Auth requires a name, and the app has none
    const { error } = await authClient.signUp.email({ email, password, name: "" });
    if (!error) {
      const query = new URLSearchParams({ email, registered: "1" });
      router.push(`/${locale}/sign-in?${query}`);
      return;
    }

    const fieldError = fieldErrorOf(error);
    if (fieldError) {
      form.setError(fieldError.field, { message: fieldError.error });
      return;
    }
    setFormError(formErrorOf(error));
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-4">
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
        autoComplete="new-password"
        error={messageOf(errors.password?.message)}
        {...form.register("password")}
      />
      <p className="text-sm text-muted-foreground">{t("signUp.passwordHint")}</p>
      {formError ? <FieldError>{t(`errors.${formError}`)}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSubmitting} focusableWhenDisabled>
        {t("signUp.submit")}
      </Button>
    </form>
  );
}
