"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, useFormState, useWatch } from "react-hook-form";

import { CATEGORY_TYPES, type CategoryType } from "@/shared/db/app-schema";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";

import { addTransaction } from "./add-transaction.action";
import { amountInputOf } from "./amount";
import { TransactionField } from "./transaction-field";
import { isFieldError } from "./transaction-errors";
import { transactionSchema, type TransactionValues } from "./transaction-schema";
import type { TransactionDto } from "./transactions.dal";
import { updateTransaction } from "./update-transaction.action";

export type CategoryOption = { id: string; type: CategoryType; label: string };
type TransactionFormProps = {
  categories: CategoryOption[];
  today: string;
  // Edits this transaction instead of adding one
  transaction?: TransactionDto;
  onSaved?: () => void;
  onCancel?: () => void;
};
type FormError = "categoryNotFound" | "transactionNotFound" | "unknown";
type FieldName = "amount" | "categoryId" | "date" | "note";

const FIELD_NAMES = ["amount", "categoryId", "date", "note"] as const satisfies FieldName[];

// The first visit renders with UTC "today" until the time zone cookie is set, so a new "today" remounts the form to reset the date default
export function TransactionForm(props: TransactionFormProps) {
  return (
    <TransactionFormFields key={`${props.transaction?.id ?? "new"}-${props.today}`} {...props} />
  );
}

function formErrorOf(serverError: string): FormError {
  if (serverError === "categoryNotFound" || serverError === "transactionNotFound") {
    return serverError;
  }
  return "unknown";
}

function TransactionFormFields({
  categories,
  today,
  transaction,
  onSaved,
  onCancel,
}: TransactionFormProps) {
  const t = useTranslations("Transactions");
  const [formError, setFormError] = useState<FormError>();
  const [isAdded, setIsAdded] = useState(false);

  function firstCategoryOf(type: CategoryType) {
    return categories.find((category) => category.type === type)?.id ?? "";
  }

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: amountInputOf(transaction.amountKopecks),
          categoryId: transaction.categoryId,
          date: transaction.occurredOn,
          note: transaction.note ?? "",
        }
      : {
          type: "expense",
          amount: "",
          categoryId: firstCategoryOf("expense"),
          date: today,
          note: "",
        },
  });
  const { errors, isSubmitting } = useFormState({ control: form.control });
  const type = useWatch({ control: form.control, name: "type" });
  const typeField = form.register("type");

  function messageOf(message: string | undefined) {
    if (message === undefined) return undefined;
    return t(isFieldError(message) ? `errors.${message}` : "errors.unknown");
  }

  async function handleSubmit(values: TransactionValues) {
    setFormError(undefined);
    setIsAdded(false);

    try {
      const result = transaction
        ? await updateTransaction({ ...values, id: transaction.id })
        : await addTransaction(values);

      const fieldErrors = result.validationErrors;
      if (fieldErrors) {
        for (const name of FIELD_NAMES) {
          const message = fieldErrors[name]?._errors?.[0];
          if (message) form.setError(name, { message });
        }
        return;
      }
      if (result.serverError) {
        setFormError(formErrorOf(result.serverError));
        return;
      }
    } catch {
      setFormError("unknown");
      return;
    }

    if (transaction) {
      onSaved?.();
      return;
    }

    form.reset({ ...values, amount: "", note: "" });
    setIsAdded(true);
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
      aria-labelledby="transaction-form-heading"
      className="@container grid gap-4"
    >
      <h2 id="transaction-form-heading" className="text-lg font-medium">
        {t(transaction ? "form.editHeading" : "form.heading")}
      </h2>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t("form.type")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_TYPES.map((value) => (
            <label
              key={value}
              className="flex h-8 cursor-pointer items-center justify-center rounded-lg border border-input text-sm has-checked:border-primary has-checked:bg-primary/10 has-checked:font-medium has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                value={value}
                className="sr-only"
                {...typeField}
                onChange={(event) => {
                  void typeField.onChange(event);
                  // A category belongs to one type, so the old pick can't stay
                  form.setValue("categoryId", firstCategoryOf(value));
                }}
              />
              {t(`form.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 @md:grid-cols-2">
        <TransactionField label={t("form.amount")} error={messageOf(errors.amount?.message)}>
          {(controlProps) => (
            <Input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              {...controlProps}
              {...form.register("amount")}
            />
          )}
        </TransactionField>
        <TransactionField label={t("form.date")} error={messageOf(errors.date?.message)}>
          {(controlProps) => (
            <Input type="date" autoComplete="off" {...controlProps} {...form.register("date")} />
          )}
        </TransactionField>
      </div>
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <TransactionField label={t("form.category")} error={messageOf(fieldState.error?.message)}>
            {(controlProps) => (
              <NativeSelect
                className="w-full"
                {...controlProps}
                name={field.name}
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
              >
                {categories
                  .filter((category) => category.type === type)
                  .map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.label}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            )}
          </TransactionField>
        )}
      />
      <TransactionField label={t("form.note")} error={messageOf(errors.note?.message)}>
        {(controlProps) => (
          <Input type="text" autoComplete="off" {...controlProps} {...form.register("note")} />
        )}
      </TransactionField>
      {formError ? <FieldError>{t(`errors.${formError}`)}</FieldError> : null}
      {isAdded ? (
        <output className="block rounded-lg bg-muted px-3 py-2 text-sm">{t("form.added")}</output>
      ) : null}
      <div className="grid gap-2 @md:grid-cols-2">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {t(transaction ? "form.save" : "form.submit")}
        </Button>
        {transaction ? (
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            {t("form.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
