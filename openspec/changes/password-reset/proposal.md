# Proposal

## Why

A user who forgets their password loses their account and data.

## What Changes

- A "Forgot password?" link on the sign-in page
- A forgot-password page that shows the same message whether or not the account exists
- A reset email through Resend, in the page's language, with a link valid for one hour
- A reset-password page: the new password ends every session
- No email for Google-only accounts

Out of scope: a sending domain (until then Resend delivers only to its account owner), retrying failed emails, passwords for Google-only accounts, changing the password while signed in.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accounts`: adds password reset by email

## Impact

Better Auth config, env, an outbox table and migration, Resend, React Email, a cron route, auth client, two pages, translations.
