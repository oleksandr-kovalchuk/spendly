# App

- `pnpm dev`: the dev server
- `pnpm test`: unit and component tests
- `pnpm e2e`: Playwright tests with axe against the production build (run `pnpm build` first, and `pnpm exec playwright install chromium` once)
- `pnpm build`, then `pnpm start`

## Setup

- Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- Optional: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` turn on Google sign-in; the Google OAuth client lists each origin and its `/api/auth/callback/google` redirect URI
- Optional: `RESEND_API_KEY` sends emails (password reset), from `EMAIL_FROM`; without a domain verified in Resend, only the Resend account's own address receives them. `CRON_SECRET` lets Vercel Cron clean up the email outbox daily
- `pnpm db:migrate`: applies the migrations; the Vercel build runs it before `pnpm build`
- `pnpm db:generate`: creates a migration after a schema change

## Stored personal data

Users read this list on the privacy page (`/{locale}/privacy`, [privacy-page.tsx](src/views/privacy/privacy-page.tsx)); change both together.

- Email address (the account also has a name field that Spendly does not show: empty, or the Google profile name)
- With Google sign-in: the Google account ID, profile picture URL, and the access and ID tokens Google returns
- Password hash (scrypt, by Better Auth); the password itself is never stored or logged
- Sessions: a token, expiry, IP address and user agent per signed-in device; deleted on sign out
- Password reset: a one-time token per request (Better Auth's `verification` table, valid for one hour) and an `email_outbox` row per reset email (user, language, delivery status; deleted after a day by the cron route); Resend receives the email address
- Rate limit counters per IP address and path, kept in the database
- Transactions: amount, date, category and an optional note per transaction, and the user's categories
- A `time-zone` cookie with the browser's time zone name, to know the user's current day
