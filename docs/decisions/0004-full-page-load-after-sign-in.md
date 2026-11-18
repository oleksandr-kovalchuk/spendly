# 0004: Full page load after sign-in

Status: accepted

## Decision

After a successful sign-in the form calls `window.location.assign` to open the main page. react-web.md, Routing allows it only for logout, so this is a deviation.

## Why

- The sign-in is done in the browser (see [0003](0003-auth-forms-use-the-better-auth-client.md)), so no Server Action changes the cookies and tells Next to drop its client cache.
- Next prefetches the main page while the user is signed out and keeps the redirect to `/sign-in`. A client navigation (`router.push`) after sign-in reuses it and sends the user back to the sign-in page (found while building accounts, fixed in 41f6352).

## Consequences

- Remove it together with 0003: a Server Action that signs in and calls `redirect()` needs no full page load.
