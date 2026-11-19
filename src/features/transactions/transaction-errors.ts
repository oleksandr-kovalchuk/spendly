const FIELD_ERRORS = [
  "amountRequired",
  "amountInvalid",
  "amountTooLarge",
  "categoryInvalid",
  "dateInvalid",
  "noteTooLong",
] as const;

export type FieldError = (typeof FIELD_ERRORS)[number];

export function isFieldError(value: unknown): value is FieldError {
  return FIELD_ERRORS.some((code) => code === value);
}
