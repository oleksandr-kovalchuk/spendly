# 0008: Initial JS budget of 300 KB per route

Status: accepted (the board chose it on AIR-67); supersedes [0006](0006-routes-over-the-initial-js-budget.md)

## Decision

The project sets its own initial JS budget: 300 KB (307,200 bytes) compressed per route, instead of the 200 KB default of react-web.md, Performance, which allows a project budget. CI enforces it with Lighthouse CI (`pnpm lighthouse`, `lighthouserc.json`): `resource-summary:script:size` for sign-in, sign-up, Overview, Transactions and Categories against `next start` of the production build. A route over 300 KB fails the PR.

Measured by that check (all JS a page downloads while loading, compressed), after AIR-67 took the ORM, Zod's full build, Better Auth's browser client and the runtime message parser out of the browser (−32 to −51 KB per route):

| Route                                       | Size   |
| ------------------------------------------- | ------ |
| `/en/sign-in`                               | 223 KB |
| `/en/sign-up`                               | 220 KB |
| `/en`, `/en/transactions`, `/en/categories` | 283 KB |

## Why

- ~181 KB is shared by every route before any page code: React DOM (~72 KB), the Next runtime (~60 KB), Base UI, next-intl's runtime and the shell.
- A signed-in screen also loads the add-transaction sheet right after the first paint (39–78 KB) and the code of the other screens the nav prefetches (12–18 KB).
- Getting under 200 KB needs visible changes: loading the sheet, form validation and the form library only on first use, which delays the first open of each on mobile data, over several PRs, and would still leave every route borderline.

## Consequences

- Every route passes with at least 17 KB of headroom; a change that adds more fails CI and needs either a smaller bundle or a new decision.
- Lighthouse and field data may show slower loads on mobile than the 200 KB default aims for; the Core Web Vitals targets of react-web.md still apply.
- Revisit if field data shows LCP or INP over their targets: deferring the sheet's code to the first press of Add (with preloading on hover or focus) brings the signed-in screens to ~205–244 KB.
