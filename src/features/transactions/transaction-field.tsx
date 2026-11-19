"use client";

import { useId, type ReactNode } from "react";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined };
type TransactionFieldProps = {
  label: string;
  error: string | undefined;
  children: (controlProps: ControlProps) => ReactNode;
};

// Links the label and the error to the control, whatever the control is
export function TransactionField({ label, error, children }: TransactionFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  );
}
