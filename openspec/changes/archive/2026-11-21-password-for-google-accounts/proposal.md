# Proposal

## Why

A user who signed up with Google can't add a password: the reset request sends them nothing. The emailed link proves they own the email, so it can safely set a first password on the same account.

## What Changes

- A reset request for a Google-only account sends the link like for a password account
- Setting a password through it adds password sign-in to the same account; Google sign-in keeps working

Out of scope: a "Connect Google" button for password accounts, setting a password while signed in, email verification at sign-up.

## Capabilities

### New Capabilities

### Modified Capabilities

- `accounts`: "Request a password reset" sends the link to Google-only accounts; "Reset the password" covers setting a first password on a Google account

## Impact

- `src/shared/auth/send-reset-password.ts`: drop the Google-only skip
- `src/shared/auth/auth.test.ts`: the Google-only request and reset tests
