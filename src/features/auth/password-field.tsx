"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ComponentProps } from "react";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

type PasswordFieldProps = Omit<ComponentProps<typeof InputGroupInput>, "type"> & {
  label: string;
  error?: string;
};

export function PasswordField({ label, error, ...inputProps }: PasswordFieldProps) {
  const t = useTranslations("Auth.fields");
  const id = useId();
  const errorId = `${id}-error`;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={isVisible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={t("showPassword")}
            aria-pressed={isVisible}
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  );
}
