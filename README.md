# App

- `pnpm dev`: the dev server
- `pnpm test`: unit and component tests
- `pnpm e2e`: Playwright tests with axe against the production build (run `pnpm build` first, and `pnpm exec playwright install chromium` once)
- `pnpm build`, then `pnpm start`

## Setup

- Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- `pnpm db:migrate`: applies the migrations; the Vercel build runs it before `pnpm build`
- `pnpm db:generate`: creates a migration after a schema change

## Stored personal data

- Email address (the account also has an empty name field that Spendly does not use)
- Password hash (scrypt, by Better Auth); the password itself is never stored or logged
- Sessions: a token, expiry, IP address and user agent per signed-in device; deleted on sign out
- Rate limit counters per IP address and path, kept in the database
