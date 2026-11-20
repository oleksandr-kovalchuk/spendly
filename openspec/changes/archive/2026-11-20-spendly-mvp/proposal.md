# Proposal

## Why

The app is empty; the MVP lets a person track income and expenses and see where money goes.

## What Changes

- Email and password accounts
- Income and expenses: add, edit, delete; listed by day
- Default and custom categories
- Day, week, month, year periods with steps
- Period totals and a spending-by-category chart
- Light/dark theme, English/Ukrainian, mobile-first
- Seven parts, one PR each

Out of scope: password reset, email verification, profile, deleting categories, currencies besides UAH, budgets, recurring transactions, import/export, error monitoring.

## Capabilities

### New Capabilities

- `app-shell`: layout, theme, language
- `accounts`: sign up, sign in, sign out
- `transactions`: records and the daily list
- `categories`: default and custom categories
- `periods`: period selection
- `stats`: totals and the category chart

### Modified Capabilities

None.

## Impact

Neon database, auth secrets and Vercel, set up by the board.
