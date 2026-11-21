import { expect, test } from "vitest";

import { fieldErrorOf, formErrorOf, googleErrorOf, isFieldError } from "./auth-errors";

test("a Better Auth field code maps to a field and its error", () => {
  expect(fieldErrorOf({ status: 400, code: "PASSWORD_TOO_SHORT" })).toEqual({
    field: "password",
    error: "passwordTooShort",
  });
  expect(fieldErrorOf({ status: 400, code: "INVALID_EMAIL" })?.field).toBe("email");
});

test("an unknown code has no field", () => {
  expect(fieldErrorOf({ status: 400, code: "SOMETHING" })).toBeUndefined();
  expect(fieldErrorOf({ status: 500 })).toBeUndefined();
});

test.each([
  [{ status: 429 }, "tooManyAttempts"],
  [{ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" }, "invalidCredentials"],
  [{ status: 500 }, "unknown"],
] as const)("%j is the form error %s", (failure, expected) => {
  expect(formErrorOf(failure)).toBe(expected);
});

test("only the known codes are field errors", () => {
  expect(isFieldError("emailInvalid")).toBe(true);
  expect(isFieldError("invalidCredentials")).toBe(false);
  expect(isFieldError(undefined)).toBe(false);
});

test.each([
  ["account_not_linked", "accountNotLinked"],
  ["invalid_code", "unknown"],
  ["state_mismatch", "unknown"],
] as const)("Google's %s error is the message %s", (code, expected) => {
  expect(googleErrorOf(code)).toBe(expected);
});

test("cancelling at Google, or no error, shows no message", () => {
  expect(googleErrorOf("access_denied")).toBeUndefined();
  expect(googleErrorOf(undefined)).toBeUndefined();
});
