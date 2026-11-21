"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm, useFormState } from "react-hook-form";

import {
  DEFAULT_CATEGORY_ICON,
  type CategoryIconKey,
  type DefaultCategoryKey,
} from "@/shared/db/app-constants";
import { TextField } from "@/shared/forms/text-field";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";

import { ownCategorySchema, type OwnCategoryValues } from "./category-schema";
import { IconPicker } from "./icon-picker";
import { updateCategory } from "./update-category.action";
import { useNameErrorMessage } from "./use-name-error-message";

type EditCategoryFormProps = {
  id: string;
  label: string;
  defaultKey: DefaultCategoryKey | null;
  icon: CategoryIconKey | null;
  // Called with whether anything was saved
  onDone: (isSaved: boolean) => void;
};
type FormError = "categoryNotFound" | "unknown";

export function EditCategoryForm({ id, label, defaultKey, icon, onDone }: EditCategoryFormProps) {
  const t = useTranslations("Categories");
  const nameErrorMessage = useNameErrorMessage();
  const [formError, setFormError] = useState<FormError>();
  const [isSaving, startSaving] = useTransition();
  const isDefault = defaultKey !== null;
  const currentIcon = icon ?? DEFAULT_CATEGORY_ICON;
  // Validating on blur would flag the field when focus moves to the icons or the close button
  const form = useForm<OwnCategoryValues>({
    resolver: zodResolver(ownCategorySchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: label, icon: currentIcon },
  });
  const { errors } = useFormState({ control: form.control });
  const nameError = errors.name?.message;

  // The sheet closes in the commit that shows the change, as TransactionForm explains
  function handleSubmit(values: OwnCategoryValues) {
    // Saving an unchanged default would store its name and stop its translation
    if (values.name === label && (isDefault || values.icon === currentIcon)) {
      onDone(false);
      return;
    }
    setFormError(undefined);

    startSaving(async () => {
      try {
        const result = await updateCategory(
          isDefault ? { id, name: values.name } : { id, name: values.name, icon: values.icon },
        );
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

      startSaving(() => onDone(true));
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
      {isDefault ? null : (
        <Controller
          control={form.control}
          name="icon"
          render={({ field }) => (
            <IconPicker name={field.name} value={field.value} onChange={field.onChange} />
          )}
        />
      )}
      {formError ? <FieldError>{t(`errors.${formError}`)}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSaving} focusableWhenDisabled>
        {t("form.save")}
      </Button>
    </form>
  );
}
