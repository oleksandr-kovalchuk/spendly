# 0009: Password reset emails are sent from `after()`

Status: accepted

## Decision

A password reset email gets an `email_outbox` row and is sent right away, in the same `after()` task that Better Auth's `backgroundTasks` handler runs. No cron job sends or retries outbox emails; a daily one only deletes rows older than a day. This deviates from rules.md, Server Actions and Mutations ("a job that must not be lost, such as an email, goes into an outbox table in the data change's transaction, and a cron job picks it up") and server.md, Background Jobs (retry with backoff).

## Why

- A reset link is valid for one hour, and the user waits for it on the page. On Vercel Hobby a cron job runs at most daily, so a retry would deliver an expired link.
- A lost email costs one more press of the button, and the page says to check the inbox or try again.
- The outbox row still limits emails per account (3 an hour) and keeps the delivery status.

## Consequences

- A failed send stays `failed` in the outbox and nobody is alerted: the app has no error monitoring yet.
- Revisit for emails that must not be lost (receipts, notifications), or on a plan whose cron runs every minute.
