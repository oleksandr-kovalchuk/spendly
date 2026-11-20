# 0006: Routes over the initial JS budget during the redesign

Status: superseded by [0008](0008-initial-js-budget-of-300-kb.md)

## Decision

The redesign parts ship with every route's initial JS over the 200 KB budget of react-web.md, Performance (and the `spendly-ui-redesign` tasks), as `main` already was before them. There is no CI budget check yet. A redesign part must not make the routes it changes meaningfully heavier than on `main`.

Measured on the production build (`pnpm build`), gzip level 9, as the sum of the `/_next/static/chunks/*.js` files a route's prerendered HTML references, without the `noModule` polyfills that modern browsers don't load:

| Route                        | `main` before part 2 | Part 2 | Part 3 |
| ---------------------------- | -------------------- | ------ | ------ |
| `/en` (Overview)             | 275 KB               | 227 KB | 230 KB |
| `/en/transactions`           | n/a (was on `/en`)   | 277 KB | 230 KB |
| `/en/categories`             | 243 KB               | 249 KB | 252 KB |
| `/en/sign-in`, `/en/sign-up` | 234 KB               | 236 KB | 238 KB |

Part 3 moves the transaction form into a sheet that loads after the first paint, so the form left the Transactions screen's initial JS; the Add button itself costs about 3 KB on each signed-in screen.

## Why

- 209 KB is shared by every route, so no route can meet the budget through page-level changes: React DOM (~71 KB), the Next runtime with the shell's own code (~70 KB), Zod's full build (~29 KB, pulled in by the Better Auth client in the sign-out button and the auth forms), Base UI (~15 KB), the Better Auth client (~12 KB) and next-intl's runtime (~12 KB).
- Getting under the budget means changing how sign-out and form validation load (for example sign-out through a Server Action, so the auth client and Zod leave the shell), which is outside the redesign's boundaries (layout and visuals, no behavior or dependency changes).

## Consequences

- Lighthouse and field data may show slower loads on mobile than the standard expects.
- Revisit in a separate task after the redesign: move the auth client and Zod out of the shared shell, measure again, and add the CI budget check the rule requires; then this record is superseded.
