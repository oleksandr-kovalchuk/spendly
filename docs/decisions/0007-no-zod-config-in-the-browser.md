# 0007: No Zod config in the browser

Status: accepted

## Decision

`src/instrumentation-client.ts`, which only ran `z.config({ jitless: true })`, is removed. The schemas the browser loads (the auth, category and transaction forms) use `zod/mini`. This deviates from stack.md, Forms / Validation ("`z.config({ jitless: true })` runs before any schema is created, in `src/instrumentation-client.ts`").

## Why

- The config imported Zod into every page: the full build first (~30 KB compressed), and even `config` alone from `zod/v4/core` costs ~8 KB, since Turbopack keeps most of the core module.
- The config only stops Zod's `new Function` probe, which sends a CSP report. Only the full build's objects run that probe (`$ZodObjectJIT`); `zod/mini` objects never do, so the browser has nothing to configure.
- stack.md already allows `zod/mini` where the size of client-side validation matters, and the initial JS budget (react-web.md, Performance) is that case.

## Consequences

- Code that the browser loads must not import `zod` (the full build): it would add ~15 KB to the route and bring back the CSP report. Server-only code (env, page search params, scripts) keeps the full build.
- Bring the config back in `instrumentation-client.ts` if the browser ever needs the full build, or once Sentry adds that file anyway.
