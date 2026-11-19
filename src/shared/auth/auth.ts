import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/env";
import { createDefaultCategories } from "@/shared/categories/default-categories";
import { db } from "@/shared/db/client";
import * as schema from "@/shared/db/auth-schema";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./password-rules";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;
const AUTH_ATTEMPTS_PER_WINDOW = 10;

// Preview deployments have no BETTER_AUTH_URL: their own Vercel hosts are the base URL and a trusted origin
const previewOrigins = [env.VERCEL_BRANCH_URL, env.VERCEL_URL]
  .filter((host) => host !== undefined)
  .map((host) => `https://${host}`);

const baseURL = env.BETTER_AUTH_URL ?? previewOrigins[0];
if (!baseURL) throw new Error("BETTER_AUTH_URL is not set");

const trustedOrigins = env.BETTER_AUTH_URL ? [] : previewOrigins;

export const auth = betterAuth({
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Without it sign-up would reveal which emails already have an account
    autoSignIn: false,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    revokeSessionsOnPasswordReset: true,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: RATE_LIMIT_WINDOW_SECONDS,
    max: RATE_LIMIT_MAX_REQUESTS,
    customRules: {
      "/sign-in/*": { window: RATE_LIMIT_WINDOW_SECONDS, max: AUTH_ATTEMPTS_PER_WINDOW },
      "/sign-up/*": { window: RATE_LIMIT_WINDOW_SECONDS, max: AUTH_ATTEMPTS_PER_WINDOW },
    },
  },
  // Vercel overwrites this header with the client's address, so it can't be spoofed
  advanced: { ipAddress: { ipAddressHeaders: ["x-real-ip"] } },
  databaseHooks: {
    user: { create: { after: (created) => createDefaultCategories(created.id) } },
  },
  plugins: [nextCookies()],
});
