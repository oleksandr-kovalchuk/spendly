const FIELD_ERRORS = ["nameRequired", "nameTooLong", "nameTaken"] as const;

export type FieldError = (typeof FIELD_ERRORS)[number];

export function isFieldError(value: unknown): value is FieldError {
  return FIELD_ERRORS.some((code) => code === value);
}
