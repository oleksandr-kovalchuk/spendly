"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cva } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { useState, useTransition, type Ref } from "react";
import { Controller, useForm, useFormState, useWatch } from "react-hook-form";

import { CATEGORY_TYPES, type CategoryType } from "@/shared/db/app-constants";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { addTransaction } from "./add-transaction.action";
import { amountInputOf } from "./amount";
import { AmountInput } from "./amount-input";
import type { CategoryOption } from "./category-option";
import { CategoryTiles } from "./category-tiles";
import { TransactionDatePicker } from "./transaction-date-picker";
import { TransactionField } from "./transaction-field";
import { isFieldError } from "./transaction-errors";
import { transactionSchema, type TransactionValues } from "./transaction-schema";
import type { TransactionDto } from "./transactions.dal";
import { updateTransaction } from "./update-transaction.action";

type TransactionFormProps = {
  categories: CategoryOption[];
  onSaved: (values: TransactionValues) => void;
  amountRef?: Ref<HTMLDivElement>;
} & (
  | { today: string; transaction?: undefined }
  | { transaction: TransactionDto; today?: undefined }
);
type FormError = "categoryNotFound" | "transactionNotFound" | "unknown";
type FieldName = "amount" | "categoryId" | "date" | "note";

const FIELD_NAMES = ["amount", "categoryId", "date", "note"] as const satisfies FieldName[];

const typeHighlightVariants = cva(
  "rounded-lg bg-primary shadow-aurora-sm transition-transform duration-300 ease-out-soft",
  { variants: { type: { expense: "", income: "translate-x-full rtl:-translate-x-full" } } },
);

export function TransactionForm(props: TransactionFormProps) {
  return <TransactionFormFields key={props.transaction?.id ?? `new-${props.today}`} {...props} />;
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
  amountRef,
}: TransactionFormProps) {
  const t = useTranslations("Transactions");
  const [formError, setFormError] = useState<FormError>();
  const [isSaving, startSaving] = useTransition();

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
          date: today ?? "",
          note: "",
        },
  });
  const { errors } = useFormState({ control: form.control });
  const type = useWatch({ control: form.control, name: "type" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const typeField = form.register("type");

  function messageOf(message: string | undefined) {
    if (message === undefined) return undefined;
    return t(isFieldError(message) ? `errors.${message}` : "errors.unknown");
  }

  function handleSubmit(values: TransactionValues) {
    setFormError(undefined);

    startSaving(async () => {
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

      startSaving(() => onSaved(values));
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="@container grid gap-5">
      <fieldset>
        <legend className="sr-only">{t("form.type")}</legend>
        <div className="relative grid grid-cols-2 rounded-xl bg-muted p-1 has-focus-visible:ring-3 has-focus-visible:ring-ring">
          <span aria-hidden="true" className="absolute inset-1 grid grid-cols-2">
            <span className={typeHighlightVariants({ type })} />
          </span>
          {CATEGORY_TYPES.map((value) => (
            <label
              key={value}
              className="relative flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors duration-300 has-checked:font-semibold has-checked:text-primary-foreground"
            >
              <input
                type="radio"
                value={value}
                className="sr-only"
                {...typeField}
                onChange={(event) => {
                  void typeField.onChange(event);
                  form.setValue("categoryId", firstCategoryOf(value));
                }}
              />
              {t(`form.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <AmountInput
        ref={amountRef}
        label={t("form.amount")}
        placeholder={t("form.amountPlaceholder")}
        type={type}
        value={amount}
        error={messageOf(errors.amount?.message)}
        registration={form.register("amount")}
      />
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <CategoryTiles
            legend={t("form.category")}
            categories={categories.filter((category) => category.type === type)}
            name={field.name}
            value={field.value}
            error={messageOf(fieldState.error?.message)}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <div className="grid gap-4 @md:grid-cols-2">
        <Controller
          control={form.control}
          name="date"
          render={({ field, fieldState }) => (
            <TransactionField label={t("form.date")} error={messageOf(fieldState.error?.message)}>
              {(controlProps) => (
                <TransactionDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  controlProps={controlProps}
                />
              )}
            </TransactionField>
          )}
        />
        <TransactionField label={t("form.note")} error={messageOf(errors.note?.message)}>
          {(controlProps) => (
            <Input type="text" autoComplete="off" {...controlProps} {...form.register("note")} />
          )}
        </TransactionField>
      </div>
      {formError ? <FieldError>{t(`errors.${formError}`)}</FieldError> : null}
      <Button type="submit" size="xl" disabled={isSaving} focusableWhenDisabled>
        {t(transaction ? "form.save" : "form.submit")}
      </Button>
    </form>
  );
}
