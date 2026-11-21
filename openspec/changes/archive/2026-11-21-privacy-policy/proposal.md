# Proposal

## Why

Google publishes a sign-in app only with a privacy policy URL, and people should know what Spendly stores about them.

## What Changes

- A privacy policy page at `/{locale}/privacy`, in English and Ukrainian, open signed in or out
- It lists the stored data, why and how long it's kept, the services that process it (Vercel, Neon, Google) and a contact email for questions and account deletion
- A footer on signed-out pages links to it

Out of scope: account deletion in the app, cookie consent (no tracking cookies), a link from signed-in screens, legal review.

## Capabilities

### New Capabilities

- `privacy`: the privacy policy page and the link to it

### Modified Capabilities

None.

## Impact

Public shell, a new view and route, translations, E2E; the Google OAuth client's Branding links.
