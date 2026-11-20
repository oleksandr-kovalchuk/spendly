"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import type { CategoryType } from "@/shared/db/app-schema";
import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { isFieldError } from "./category-errors";
import { categoryNameSchema, type CategoryNameValues } from "./category-schema";
import { createCategory } from "./create-category.action";

type Status = "idle" | "added" | "failed";

export function CreateCategoryForm({ type }: { type: CategoryType }) {
  const t = useTranslations("Categories");
  const [status, setStatus] = useState<Status>("idle");
  // A single field: validating on blur would flag it whenever focus passes through
  const form = useForm<CategoryNameValues>({
    resolver: zodResolver(categoryNameSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "" },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });
  const nameError = errors.name?.message;

  async function handleSubmit(values: CategoryNameValues) {
    setStatus("idle");

    try {
      const result = await createCategory({ type, name: values.name });
      const message = result.validationErrors?.name?._errors?.[0];
      if (message) {
        form.setError("name", { message }, { shouldFocus: true });
        return;
      }
      if (result.serverError || result.validationErrors) {
        setStatus("failed");
        return;
      }
    } catch {
      setStatus("failed");
      return;
    }

    form.reset({ name: "" });
    setStatus("added");
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="@container grid gap-3">
      <TextField
        label={t(`form.${type}Label`)}
        type="text"
        autoComplete="off"
        error={
          nameError === undefined
            ? undefined
            : t(isFieldError(nameError) ? `errors.${nameError}` : "errors.unknown")
        }
        {...form.register("name")}
      />
      {status === "failed" ? <FieldError>{t("errors.unknown")}</FieldError> : null}
      {status === "added" ? (
        <output className="block rounded-lg bg-muted px-3 py-2 text-sm">{t("form.added")}</output>
      ) : null}
      <Button type="submit" size="lg" disabled={isSubmitting} className="@sm:justify-self-start">
        {t("form.add")}
      </Button>
    </form>
  );
}
