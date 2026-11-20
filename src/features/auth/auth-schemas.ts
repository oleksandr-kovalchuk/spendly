// The mini build: the forms load it in the browser, where the full one adds ~30 KB
import * as z from "zod/mini";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/shared/auth/password-rules";

// Messages are codes: the forms translate them
const email = z.email({ error: "emailInvalid" });

export const signUpSchema = z.object({
  email,
  password: z
    .string()
    .check(
      z.minLength(MIN_PASSWORD_LENGTH, "passwordTooShort"),
      z.maxLength(MAX_PASSWORD_LENGTH, "passwordTooLong"),
    ),
});

export const signInSchema = z.object({
  email,
  password: z.string().check(z.minLength(1, "passwordRequired")),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
