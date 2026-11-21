# 0010: E2E runs fix "today" on the server

Status: accepted

## Decision

When `E2E_TODAY` (`YYYY-MM-DD`) is set, the screens treat that day as today: the default period, the new transaction's date and the period buttons follow it. Playwright's web server sets it from `e2e/today.ts`, and the E2E tests compute their dates from the same constant. The env schema refuses it on Vercel (`VERCEL_ENV` set).

## Why

- typescript.md, Testing: "Time in tests is controlled, not the current date". The server decides today, and Playwright's clock controls only the browser, so the tests read the machine's date and could fail when a run crossed midnight UTC.
- One env check in `getToday()` is the only change to the app; nothing else reads it.

## Consequences

- A server started by hand and reused by `pnpm e2e` (`reuseExistingServer` locally) needs `E2E_TODAY` too, or the date tests fail.
- The footer's copyright year stays the real year: it is cached at build time, so the E2E test checks the line's format, not the year.
- Auth, sessions and rate limits keep the real time.
