import type { AuthFailure } from "@/shared/auth/auth-client";

const FIELD_ERRORS = [
  "emailInvalid",
  "passwordTooShort",
  "passwordTooLong",
  "passwordRequired",
] as const;

export type FieldError = (typeof FIELD_ERRORS)[number];
export type FormError = "invalidCredentials" | "tooManyAttempts" | "unknown";

const TOO_MANY_REQUESTS = 429;

export function isFieldError(value: unknown): value is FieldError {
  return FIELD_ERRORS.some((code) => code === value);
}

const FIELD_ERROR_BY_AUTH_CODE: Record<string, { field: "email" | "password"; error: FieldError }> =
  {
    INVALID_EMAIL: { field: "email", error: "emailInvalid" },
    PASSWORD_TOO_SHORT: { field: "password", error: "passwordTooShort" },
    PASSWORD_TOO_LONG: { field: "password", error: "passwordTooLong" },
  };

export function fieldErrorOf({ code }: AuthFailure) {
  return code ? FIELD_ERROR_BY_AUTH_CODE[code] : undefined;
}

export function formErrorOf({ status, code }: AuthFailure): FormError {
  if (status === TOO_MANY_REQUESTS) return "tooManyAttempts";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "invalidCredentials";

  return "unknown";
}
