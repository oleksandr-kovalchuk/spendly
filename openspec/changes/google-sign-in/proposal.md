# Proposal

## Why

Signing up with a password is a barrier; most people already have a Google account and expect one-click sign-in.

## What Changes

- A "Continue with Google" button on the sign-in and sign-up pages
- The first Google sign-in creates an account with the default categories
- An email with a password account can't sign in with Google: a message asks for the password
- The button shows only where Google keys are set, not on previews

Out of scope: linking Google to a password account, passwords for Google accounts, other providers, previews.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accounts`: adds sign-in with Google

## Impact

Better Auth config, env, auth client, sign-in and sign-up pages, translations; a Google OAuth client and Vercel env per environment. No migration: Better Auth's `account` table holds providers.
