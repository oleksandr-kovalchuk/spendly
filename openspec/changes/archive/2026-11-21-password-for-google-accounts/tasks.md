# Tasks

## 1. Reset for Google accounts

- [x] 1.1 Drop the Google-only skip from `sendResetPasswordEmail`; verify the integration test that a Google-only account's request records a pending outbox email
- [x] 1.2 Verify an integration test that a Google-only account's reset sets a password that signs in, and Google still signs in to the same user

## Workflow follow-up

- Archive the change so the `accounts` spec takes the delta.
