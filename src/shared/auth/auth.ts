import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { env } from "@/env";
import { createDefaultCategories } from "@/shared/categories/default-categories";
import { db } from "@/shared/db/client";
import * as schema from "@/shared/db/auth-schema";

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "./password-rules";
import { sendResetPasswordEmail } from "./send-reset-password";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;
const AUTH_ATTEMPTS_PER_WINDOW = 10;
const RESET_REQUESTS_PER_WINDOW = 3;
const RESET_LINK_LIFETIME_SECONDS = 60 * 60;

// Preview deployments have no BETTER_AUTH_URL: their own Vercel hosts are the base URL and a trusted origin
const previewOrigins = [env.VERCEL_BRANCH_URL, env.VERCEL_URL]
  .filter((host) => host !== undefined)
  .map((host) => `https://${host}`);

const baseURL = env.BETTER_AUTH_URL ?? previewOrigins[0];
if (!baseURL) throw new Error("BETTER_AUTH_URL is not set");

const trustedOrigins = env.BETTER_AUTH_URL ? [] : previewOrigins;

// The env schema sets both keys or neither
const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;

export const isGoogleSignInEnabled = google !== undefined;

const CREDENTIAL_PROVIDER = "credential";

function hasPasswordInBody(body: unknown) {
  if (typeof body !== "object" || body === null || !("password" in body)) return false;

  return typeof body.password === "string" && body.password !== "";
}

// Better Auth deletes without the password when the session is under a day old; an account with
// a password must give it, so a stolen session can't delete it. Google accounts keep that rule.
const requirePasswordToDelete = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/delete-user" || hasPasswordInBody(ctx.body)) return;

  const session = await getSessionFromCtx(ctx);
  if (!session) return;

  const accounts = await ctx.context.internalAdapter.findAccounts(session.user.id);
  if (accounts.some(({ providerId }) => providerId === CREDENTIAL_PROVIDER)) {
    throw APIError.from("BAD_REQUEST", {
      code: "PASSWORD_REQUIRED",
      message: "Enter your password to delete the account",
    });
  }
});

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
    resetPasswordTokenExpiresIn: RESET_LINK_LIFETIME_SECONDS,
    sendResetPassword: sendResetPasswordEmail,
  },
  // Account linking keeps its default requireLocalEmailVerified: the app doesn't verify emails,
  // so linking Google to a password account would hand it to whoever registered that email
  socialProviders: google ? { google } : {},
  // The user's rows in the app's tables go with it: their foreign keys cascade
  user: { deleteUser: { enabled: true } },
  hooks: { before: requirePasswordToDelete },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: RATE_LIMIT_WINDOW_SECONDS,
    max: RATE_LIMIT_MAX_REQUESTS,
    customRules: {
      "/sign-in/*": { window: RATE_LIMIT_WINDOW_SECONDS, max: AUTH_ATTEMPTS_PER_WINDOW },
      "/sign-up/*": { window: RATE_LIMIT_WINDOW_SECONDS, max: AUTH_ATTEMPTS_PER_WINDOW },
      "/request-password-reset": {
        window: RATE_LIMIT_WINDOW_SECONDS,
        max: RESET_REQUESTS_PER_WINDOW,
      },
      // It checks the password too
      "/delete-user": { window: RATE_LIMIT_WINDOW_SECONDS, max: AUTH_ATTEMPTS_PER_WINDOW },
    },
  },
  // Vercel overwrites this header with the client's address, so it can't be spoofed
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
    // Work such as the reset email runs after the response, so its time reveals nothing about the
    // account (see decision 0009)
    backgroundTasks: { handler: (task) => after(task) },
  },
  databaseHooks: {
    user: { create: { after: (created) => createDefaultCategories(created.id) } },
  },
  plugins: [nextCookies()],
});
