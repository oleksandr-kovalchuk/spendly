"use client";

import { cva } from "class-variance-authority";
import { useLocale } from "next-intl";
import { useId, type Ref } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import type { CategoryType } from "@/shared/db/app-constants";
import { SIGNED_MONEY_FORMAT } from "@/shared/lib/money";
import { FieldError } from "@/shared/ui/field";
import { Label } from "@/shared/ui/label";

type AmountInputProps = {
  ref?: Ref<HTMLDivElement>;
  label: string;
  placeholder: string;
  type: CategoryType;
  value: string;
  error: string | undefined;
  registration: UseFormRegisterReturn<"amount">;
};

const MEDIUM_FROM_LENGTH = 8;
const SMALL_FROM_LENGTH = 11;

const displayVariants = cva(
  "flex max-w-full items-baseline justify-center gap-1.5 border-b-2 px-2 pb-1 font-semibold tracking-tight tabular-nums transition-colors has-focus-visible:border-ring",
  {
    variants: {
      tone: {
        empty: "text-muted-foreground",
        expense: "text-expense",
        income: "text-income",
      },
      size: { lg: "text-5xl", md: "text-4xl", sm: "text-3xl" },
      isInvalid: { true: "border-destructive", false: "border-input" },
    },
  },
);

const currencyVariants = cva("font-medium", {
  variants: { size: { lg: "text-3xl", md: "text-2xl", sm: "text-xl" } },
});

function sizeOf(length: number) {
  if (length >= SMALL_FROM_LENGTH) return "sm";
  if (length >= MEDIUM_FROM_LENGTH) return "md";
  return "lg";
}

function moneyPartsOf(locale: string, type: CategoryType) {
  const parts = new Intl.NumberFormat(locale, SIGNED_MONEY_FORMAT).formatToParts(
    type === "expense" ? -1 : 1,
  );

  return {
    sign: parts.find((part) => part.type === "minusSign" || part.type === "plusSign")?.value,
    currency: parts.find((part) => part.type === "currency")?.value,
  };
}

export function AmountInput({
  ref,
  label,
  placeholder,
  type,
  value,
  error,
  registration,
}: AmountInputProps) {
  const locale = useLocale();
  const id = useId();
  const errorId = `${id}-error`;
  const size = sizeOf(Math.max(value.length, placeholder.length));
  const { sign, currency } = moneyPartsOf(locale, type);

  return (
    <div className="grid justify-items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        ref={ref}
        className={displayVariants({
          tone: value === "" ? "empty" : type,
          size,
          isInvalid: Boolean(error),
        })}
      >
        <span aria-hidden="true">{sign}</span>
        <span className="relative min-w-0">
          <span aria-hidden="true" className="invisible px-px whitespace-pre">
            {value === "" ? placeholder : value}
          </span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="absolute inset-0 size-full bg-transparent text-center outline-none placeholder:text-muted-foreground focus:placeholder:text-transparent"
            {...registration}
          />
        </span>
        {/* After the number in every language: before it, it crowds the sign */}
        <span aria-hidden="true" className={currencyVariants({ size })}>
          {currency}
        </span>
      </div>
      {error ? (
        <FieldError id={errorId} className="text-center">
          {error}
        </FieldError>
      ) : null}
    </div>
  );
}
