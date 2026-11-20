"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";

import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { isFieldError } from "./category-errors";
import { categoryNameSchema, type CategoryNameValues } from "./category-schema";
import { renameCategory } from "./rename-category.action";

type RenameCategoryFormProps = { id: string; label: string; onClose: () => void };
type FormError = "categoryNotFound" | "unknown";

export function RenameCategoryForm({ id, label, onClose }: RenameCategoryFormProps) {
  const t = useTranslations("Categories");
  const [formError, setFormError] = useState<FormError>();
  // Validating on blur would flag the field when focus moves to Cancel
  const form = useForm<CategoryNameValues>({
    resolver: zodResolver(categoryNameSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: label },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });
  const nameError = errors.name?.message;

  // The form replaces the Rename button, which had the focus
  useEffect(() => {
    form.setFocus("name", { shouldSelect: true });
  }, [form]);

  async function handleSubmit(values: CategoryNameValues) {
    // Saving an unchanged default would store its name and stop its translation
    if (values.name === label) {
      onClose();
      return;
    }
    setFormError(undefined);

    try {
      const result = await renameCategory({ id, name: values.name });
      const message = result.validationErrors?.name?._errors?.[0];
      if (message) {
        form.setError("name", { message }, { shouldFocus: true });
        return;
      }
      if (result.serverError || result.validationErrors) {
        setFormError(result.serverError === "categoryNotFound" ? "categoryNotFound" : "unknown");
        return;
      }
    } catch {
      setFormError("unknown");
      return;
    }

    onClose();
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="@container grid gap-3">
      <TextField
        label={t("form.renameLabel", { category: label })}
        type="text"
        autoComplete="off"
        error={
          nameError === undefined
            ? undefined
            : t(isFieldError(nameError) ? `errors.${nameError}` : "errors.unknown")
        }
        {...form.register("name")}
      />
      {formError ? <FieldError>{t(`errors.${formError}`)}</FieldError> : null}
      <div className="grid gap-2 @sm:flex">
        <Button type="submit" disabled={isSubmitting}>
          {t("form.save")}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
