# Design

## Context

Auth forms call Better Auth's HTTP routes with `fetch` (decisions 0003, 0004). The app doesn't verify emails.

## Decisions

- Provider: Better Auth's built-in `socialProviders.google`, on only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional in `env.ts`) are both set; one set alone fails startup. Previews leave both unset (`oAuthProxy` was rejected as extra setup).
- Linking: Better Auth's default `requireLocalEmailVerified` stays on, so an unverified password account isn't linked (that would let someone pre-register a victim's email). The callback returns `account_not_linked`.
- Client: `authClient.signIn.social` posts to `/sign-in/social` (rate-limited by `/sign-in/*`), then `window.location.assign` opens Google: the router can't leave the origin, the same deviation as 0004. `callbackURL` `/{locale}`, `errorCallbackURL` `/{locale}/sign-in`.
- UI: a client `GoogleSignInButton` (inline SVG G logo) in `features/auth`, after the form and an "or" divider, only when `isGoogleSignInEnabled`. The link to the other auth page moves from the forms to the card's end, after a plain divider.
- Errors: the sign-in page reads `error` from its search params: `account_not_linked` maps to its message, `access_denied` shows none, anything else maps to `unknown`.

## Risks / Trade-offs

- `account_not_linked` shows that an email has a password account → only to the owner of that verified Google email.
