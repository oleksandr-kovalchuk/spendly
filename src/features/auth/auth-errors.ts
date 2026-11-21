import type { AuthFailure } from "@/shared/auth/auth-client";

const FIELD_ERRORS = [
  "emailInvalid",
  "passwordTooShort",
  "passwordTooLong",
  "passwordRequired",
  "passwordIncorrect",
] as const;

export type FieldError = (typeof FIELD_ERRORS)[number];
export type FormError = "invalidCredentials" | "tooManyAttempts" | "unknown";
export type GoogleError = "accountNotLinked" | "unknown";
export type DeleteAccountError = "signInAgain" | "tooManyAttempts" | "unknown";

const TOO_MANY_REQUESTS = 429;
// The error codes Better Auth's OAuth callback adds to the sign-in page's URL
const GOOGLE_ACCOUNT_NOT_LINKED = "account_not_linked";
const GOOGLE_ACCESS_DENIED = "access_denied";

export function isFieldError(value: unknown): value is FieldError {
  return FIELD_ERRORS.some((code) => code === value);
}

const FIELD_ERROR_BY_AUTH_CODE: Record<string, { field: "email" | "password"; error: FieldError }> =
  {
    INVALID_EMAIL: { field: "email", error: "emailInvalid" },
    PASSWORD_TOO_SHORT: { field: "password", error: "passwordTooShort" },
    PASSWORD_TOO_LONG: { field: "password", error: "passwordTooLong" },
    INVALID_PASSWORD: { field: "password", error: "passwordIncorrect" },
  };

export function fieldErrorOf({ code }: AuthFailure) {
  return code ? FIELD_ERROR_BY_AUTH_CODE[code] : undefined;
}

export function formErrorOf({ status, code }: AuthFailure): FormError {
  if (status === TOO_MANY_REQUESTS) return "tooManyAttempts";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "invalidCredentials";

  return "unknown";
}

// An account without a password can be deleted only with a session from the last day
export function deleteAccountErrorOf({ status, code }: AuthFailure): DeleteAccountError {
  if (status === TOO_MANY_REQUESTS) return "tooManyAttempts";
  if (code === "SESSION_EXPIRED") return "signInAgain";

  return "unknown";
}

// Cancelling on Google's page is the user's choice, not an error to show
export function googleErrorOf(code: string | undefined): GoogleError | undefined {
  if (code === undefined || code === GOOGLE_ACCESS_DENIED) return undefined;
  if (code === GOOGLE_ACCOUNT_NOT_LINKED) return "accountNotLinked";

  return "unknown";
}
