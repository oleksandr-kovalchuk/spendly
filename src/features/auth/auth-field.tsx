"use client";

import { useId, type ComponentProps } from "react";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type AuthFieldProps = ComponentProps<typeof Input> & { label: string; error?: string };

export function AuthField({ label, error, ...inputProps }: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  );
}
