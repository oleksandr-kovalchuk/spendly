# 0003: Sign-in and sign-up forms call the Better Auth client

Status: accepted

## Decision

The sign-in and sign-up forms validate with the shared schema in the browser and submit through `authClient` (Better Auth's browser client), not through a Server Action that validates the schema again on the server. This deviates from nextjs/rules.md, Forms ("Submit goes to a Server Action that validates with the same schema on the server").

## Why

- server.md requires rate limits per IP on auth endpoints. Better Auth's limiter counts only HTTP requests to its own route handler; `auth.api.*` calls from a Server Action skip it, so a Server Action would leave sign-in open to password guessing until we build a separate limiter.
- The server still validates: Better Auth checks the email and the password length itself, and the forms map its error codes to field errors.

## Consequences

- Revisit when the app gets its own shared rate limiter (then these forms can move to Server Actions on the shared schema).
- Every other mutation goes through Server Actions as the rules say.
