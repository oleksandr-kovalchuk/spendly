import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_BRANCH_URL: z.string().optional(),
    // Vercel sets it on every deployment: the production domain, for canonical links on previews
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    // Unset where Google sign-in is off, as on Vercel previews
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // Unset in CI and on previews: emails then stay pending in the outbox
    RESEND_API_KEY: z.string().optional(),
    // Resend's shared sender delivers only to the Resend account's own address
    EMAIL_FROM: z.string().default("Spendly <onboarding@resend.dev>"),
    // Vercel Cron sends it as a bearer token; unset, the cron route refuses every request
    CRON_SECRET: z.string().min(16).optional(),
    // Playwright's web server fixes "today" for E2E runs (decision 0010); Vercel refuses it below
    E2E_TODAY: z.iso.date().optional(),
    VERCEL_ENV: z.string().optional(),
  },
  createFinalSchema: (shape) =>
    z
      .object(shape)
      .refine(
        ({ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET }) =>
          (GOOGLE_CLIENT_ID === undefined) === (GOOGLE_CLIENT_SECRET === undefined),
        { message: "Set both Google keys or neither", path: ["GOOGLE_CLIENT_SECRET"] },
      )
      .refine(({ E2E_TODAY, VERCEL_ENV }) => E2E_TODAY === undefined || VERCEL_ENV === undefined, {
        message: "E2E_TODAY is only for E2E runs, never on Vercel",
        path: ["E2E_TODAY"],
      }),
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
});
