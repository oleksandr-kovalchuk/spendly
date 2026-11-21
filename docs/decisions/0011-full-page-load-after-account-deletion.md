# 0011: Full page load after deleting the account

Status: accepted

## Decision

After the account is deleted, the button calls `window.location.assign` to open the sign-in page. react-web.md, Routing allows it only for logout, so this is a deviation.

## Why

- Deleting the account ends the session the way logout does, and the rule's reason applies the same: a full page load clears the previous user's client state (the pages Next keeps in `Activity`, the router cache).
- The deletion is done in the browser through Better Auth's client (see [0003](0003-auth-forms-use-the-better-auth-client.md)), so no Server Action can `redirect()`.

## Consequences

- Remove it together with 0003, as [0004](0004-full-page-load-after-sign-in.md) says for sign-in.
