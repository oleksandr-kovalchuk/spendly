import { z } from "zod";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/shared/auth/password-rules";

// Messages are codes: the forms translate them
const email = z.email({ error: "emailInvalid" });

export const signUpSchema = z.object({
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, "passwordTooShort")
    .max(MAX_PASSWORD_LENGTH, "passwordTooLong"),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "passwordRequired"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
