# Tasks

## 1. Email outbox

- [x] 1.1 Add `resend`; add optional `RESEND_API_KEY`, `EMAIL_FROM` (default `Spendly <onboarding@resend.dev>`) and `CRON_SECRET` to `env.ts`, `.env.example` and the README; verify `pnpm typecheck` and `pnpm unused`
- [x] 1.2 Add the `email_outbox` table (user FK with cascade, kind, locale, `pending`/`sent`/`failed` status, index on user and `created_at`) and generate its migration; verify `migrate.test.ts` passes
- [x] 1.3 Add a server-only Resend client (with timeout) and an outbox send that marks the row `sent`, or `failed` with the error name, and leaves it `pending` without a key; verify integration tests against the test DB, with Resend mocked at the network level
- [x] 1.4 Add the daily Vercel Cron route that deletes rows older than a day and answers 401 without `CRON_SECRET` (compared with `timingSafeEqual`), plus its `vercel.json` entry; verify the route test
- [x] 1.5 Record decision 0009 in `docs/decisions/`: reset emails go out from `after()` and aren't retried by cron; verify the file follows the existing decisions' format

## 2. Reset request

- [x] 2.1 Add `react-email` and the React Email reset template (link, one-hour note) in English and Ukrainian via `createTranslator`; verify a unit test renders the link in both languages
- [x] 2.2 Set `sendResetPassword` (skip Google-only accounts and accounts with 3 emails in the last hour, locale from `callbackURL`), `backgroundTasks` through `after()`, and a 3-per-minute limit on `/request-password-reset`; verify integration tests for each request scenario in the spec
- [x] 2.3 Add `requestPasswordReset` to `authClient`; verify its unit test
- [x] 2.4 Add the forgot-password page (same message for any email, field error, rate-limit message, signed-in users sent to the main page) and a "Forgot password?" link on the sign-in page, in both languages; verify component tests
- [x] 2.5 E2E: a request shows the message and creates a pending outbox row, an unknown email shows the same message, axe passes in both themes

## 3. Reset

- [x] 3.1 Add `resetPassword` to `authClient`; verify its unit test
- [x] 3.2 Add the reset-password page (new password with `PasswordField`, invalid or expired link message with a link to request a new one) and a "sign in with your new password" message on the sign-in page, in both languages; verify component tests
- [x] 3.3 E2E: a link built from the token in the `verification` table resets the password, the old password fails and the new one works, another session is signed out, a used link shows the invalid message, axe passes in both themes
- [x] 3.4 Check in the running app with a real email to the Resend account's address, at 360 and 1440 px in both themes

## 4. Environments

- [x] 4.1 Create a production Resend key and set `RESEND_API_KEY` and `CRON_SECRET` in Vercel for production; verify a reset email arrives and the cron run succeeds in the Vercel logs

## Workflow follow-up

- Verify a sending domain in Resend and set `EMAIL_FROM`, so every user receives reset emails (a separate change).
