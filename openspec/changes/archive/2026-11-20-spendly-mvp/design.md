# Design

## Context

Next.js 16 with Cache Components; libraries follow `docs/standards/nextjs/stack.md`.

## Decisions

- Stack: Better Auth, Drizzle + `pg` on Neon, next-intl with a `[locale]` root param, next-themes, nuqs, React Hook Form + Zod + next-safe-action, Recharts via `next/dynamic`.
- Sign-up uses `autoSignIn: false`, so it reveals no existing email without email verification.
- A transaction stores its category, not a type: the type comes from the category, so they can't disagree.
- Default categories are per-user rows with a `default_key` and no name, shown translated until renamed. Global shared rows were rejected: renaming needs copy-on-write.
- Money is integer kopecks, one currency (UAH).
- "Today" uses the browser's time zone, sent in a cookie, falling back to UTC.
- Weeks start on Monday in both languages.
- Stats sit on the main page above the list and share its period.

## Risks / Trade-offs

- No error monitoring → Vercel logs only; Sentry is a later change.
- A custom name can match an unrenamed default's translated name → accepted; uniqueness checks stored names only.

## Migration Plan

Migrations run in the Vercel build step before `next build`; previews use their own Neon branch.
