# Design

## Context

Auth forms call Better Auth's routes through `authClient` (decision 0003). Better Auth ships the reset flow: `/request-password-reset`, a link redirecting with `?token=` or `?error=INVALID_TOKEN`, and `/reset-password`.

## Decisions

- `advanced.backgroundTasks.handler` runs `sendResetPassword` in `after()`: its work adds no timing difference between known and unknown emails.
- `sendResetPassword` skips users without a credential account (a reset would create a password) and users with 3 outbox rows in the last hour. Otherwise it inserts an `email_outbox` row (user, kind, locale: IDs only, no link), sends the link through Resend, then marks it `sent`, or `failed` with the error name.
- The outbox holds the per-account limit and delivery state; E2E reads the token from Better Auth's `verification` table. No retries: links live an hour and Hobby's cron is daily, which deviates from rules.md (decision 0009).
- A daily cron route behind `CRON_SECRET` deletes rows older than a day.
- Locale: from the link's `callbackURL`, checked against `routing.locales`; the template uses next-intl's `createTranslator`.
- Optional `RESEND_API_KEY`: without it (CI, previews) rows stay `pending`. `EMAIL_FROM` defaults to `Spendly <onboarding@resend.dev>`.

## Risks / Trade-offs

- A failed send isn't retried → the user requests again.
- No sending domain → only the Resend account owner receives emails.
