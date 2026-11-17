# Tasks

Every part: one PR; all UI text in English and Ukrainian; mobile-first; `pnpm lint`, `typecheck`, `test`, `unused` and `build` pass.

## 1. App shell: language and theme

Boundaries: locale routes, header with language and theme switchers, placeholder home page, 404; no database or auth.

Board setup: link the repo to a Vercel project, so every PR gets a preview URL.

How to check:

1. Open the preview on a phone: the home page fits the screen.
2. Switch to Українська: the text and the URL (`/uk`) change.
3. Pick dark and reload: the page stays dark, with no flash.

- [x] 1.1 Add next-intl with `en` and `uk`, `[locale]` routes and the `/` redirect by browser language; verify with unit tests of locale detection
- [x] 1.2 Add the header with the language switcher and the theme toggle (system by default); verify with a component test of switching
- [x] 1.3 Add the placeholder home page, the translated 404, the skip link and per-page titles; verify `pnpm build` passes
- [x] 1.4 Set up Playwright with axe in CI against the production build; verify an E2E test of both languages and themes reports no violations

## 2. Accounts

Boundaries: database, auth, sign-up and sign-in pages, sign out in the header, private main page with a placeholder; no transactions.

Board setup: a Neon project with production and staging branches, connected to Vercel, with preview branches made from staging; `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` per environment.

How to check:

1. Sign up with a new email and password, then sign in.
2. Reload: the main page stays signed in.
3. Sign out and open the main page: the sign-in page opens.

- [ ] 2.1 Add the env module, Drizzle with a `pg` pool, migrations in the Vercel build step and `.env.example`; verify migrations run on an empty database
- [ ] 2.2 Configure Better Auth (`autoSignIn: false`, database rate limiter, `nextCookies()`) and its generated migration; verify with integration tests on Testcontainers
- [ ] 2.3 Add the sign-up and sign-in forms with field errors; verify with component tests of validation
- [ ] 2.4 Protect private pages in `proxy.ts` (optimistic) and the DAL (session); verify a test that every data action rejects a request without a session
- [ ] 2.5 Add sign out in the header with a full page load; verify an E2E test of sign up, sign in and sign out against a Postgres service in CI
- [ ] 2.6 List the stored personal data in README; verify it names email, password hash and sessions

## 3. Add and list transactions

Boundaries: default categories, the add form, the current month's list grouped by day; no edit, delete, category page or period switch.

How to check:

1. Add an expense for today and an income for another day this month.
2. Both show under their days, newest first, with minus and plus amounts.
3. Switch to Українська: dates, amounts and category names are translated.

- [ ] 3.1 Add the `categories` and `transactions` tables, defaults created on sign-up and backfilled for existing users; verify with DAL integration tests
- [ ] 3.2 Add the time zone cookie and the "today" helper; verify with unit tests across time zones
- [ ] 3.3 Add the transaction form and its Server Action; verify with tests of validation and of another user's category
- [ ] 3.4 Show the current month grouped by day with loading, empty and error states; verify with grouping unit tests and an E2E add test

## 4. Edit and delete transactions

Boundaries: editing a list item in the same form, deleting with confirmation; nothing else.

How to check:

1. Open a transaction, change its amount and date, save: it moves to the new day.
2. Delete another one, cancel, then delete and confirm: it disappears.
3. Reload: both changes stay.

- [ ] 4.1 Open a transaction in the form and save it with an update action; verify with tests that another user's ID gives a 404 or a rejection
- [ ] 4.2 Add delete with a confirmation dialog and a delete action; verify with integration tests and an E2E edit and delete test

## 5. Categories

Boundaries: a categories page with expense and income lists, create and rename; no delete, icons or colors.

How to check:

1. Open Categories and create the expense category "Coffee".
2. Rename "Food" to "Groceries".
3. Add an expense: the picker shows Coffee and Groceries; old Food items show Groceries.

- [ ] 5.1 Add the categories page and its header link; verify defaults show translated in both languages
- [ ] 5.2 Add create and rename actions with a case-insensitive unique constraint per user and type; verify with integration tests of duplicates and ownership
- [ ] 5.3 Show a duplicate as a field error; verify with an E2E create and rename test

## 6. Periods

Boundaries: the period switcher, previous, next and current controls in the URL; the list follows the period; no stats.

How to check:

1. Pick Week: only this week's transactions show.
2. Step back and forward: the label and the list change.
3. Open the URL in a new tab: the same period shows.

- [ ] 6.1 Add period parsing and range helpers (Monday weeks, invalid input → current month); verify with unit tests
- [ ] 6.2 Add the period control with nuqs and the localized label; verify with a component test of stepping
- [ ] 6.3 Filter the list by the period's range; verify with an E2E test of a week and a shared URL

## 7. Stats

Boundaries: income, expense and balance totals and the spending-by-category chart above the list; nothing else.

How to check:

1. Pick a month with expenses in two categories: totals match the list.
2. The chart shows both categories with amounts and shares.
3. Switch to dark and Українська: the chart is readable and translated.

- [ ] 7.1 Add the period totals from DB aggregates with a skeleton; verify with DAL integration tests
- [ ] 7.2 Add the lazy-loaded chart with a text legend and an empty state; verify with a component test of the legend
- [ ] 7.3 Refresh totals and chart after add, edit and delete; verify with an E2E test with axe in both themes

## Workflow follow-up

- Archive the change after part 7 merges (`openspec-archive-change`); `openspec/specs/` then holds all six capabilities.
