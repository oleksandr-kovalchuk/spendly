"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm, useFormState } from "react-hook-form";

import { DEFAULT_CATEGORY_ICON, type CategoryType } from "@/shared/db/app-constants";
import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { ownCategorySchema, type OwnCategoryValues } from "./category-schema";
import { createCategory } from "./create-category.action";
import { IconPicker } from "./icon-picker";
import { useNameErrorMessage } from "./use-name-error-message";

type CreateCategoryFormProps = { type: CategoryType; onSaved: () => void };

export function CreateCategoryForm({ type, onSaved }: CreateCategoryFormProps) {
  const t = useTranslations("Categories");
  const nameErrorMessage = useNameErrorMessage();
  const [hasFailed, setHasFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();
  // Validating the name on blur would flag it whenever focus passes through to the icons
  const form = useForm<OwnCategoryValues>({
    resolver: zodResolver(ownCategorySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "", icon: DEFAULT_CATEGORY_ICON },
  });
  const { errors } = useFormState({ control: form.control });
  const nameError = errors.name?.message;

  // The sheet closes in the commit that shows the new category, as TransactionForm explains
  function handleSubmit(values: OwnCategoryValues) {
    setHasFailed(false);

    startSaving(async () => {
      try {
        const result = await createCategory({ type, ...values });
        const message = result.validationErrors?.name?._errors?.[0];
        if (message) {
          form.setError("name", { message }, { shouldFocus: true });
          return;
        }
        if (result.serverError || result.validationErrors) {
          setHasFailed(true);
          return;
        }
      } catch {
        setHasFailed(true);
        return;
      }

      startSaving(onSaved);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="grid gap-4">
      <TextField
        label={t("form.nameLabel")}
        type="text"
        autoComplete="off"
        error={nameErrorMessage(nameError)}
        {...form.register("name")}
      />
      <Controller
        control={form.control}
        name="icon"
        render={({ field }) => (
          <IconPicker name={field.name} value={field.value} onChange={field.onChange} />
        )}
      />
      {hasFailed ? <FieldError>{t("errors.unknown")}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSaving} focusableWhenDisabled>
        {t("form.add")}
      </Button>
    </form>
  );
}
