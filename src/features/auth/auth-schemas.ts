import * as z from "zod/mini";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/shared/auth/password-rules";

// Messages are codes: the forms translate them
const email = z.email({ error: "emailInvalid" });

const newPassword = z
  .string()
  .check(
    z.minLength(MIN_PASSWORD_LENGTH, "passwordTooShort"),
    z.maxLength(MAX_PASSWORD_LENGTH, "passwordTooLong"),
  );

export const signUpSchema = z.object({ email, password: newPassword });

const currentPassword = z.string().check(z.minLength(1, "passwordRequired"));

export const signInSchema = z.object({ email, password: currentPassword });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password: newPassword });

export const deleteAccountSchema = z.object({ password: currentPassword });

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
