# Next.js: Stack

Minimum versions, security floors and upcoming changes are in [versions.json](versions.json): install versions that satisfy it.

## Core

- New project: `create` runs create-next-app with the flags in [setup.json](setup.json) (`--no-linter`: Oxlint is set up as in Code Quality), puts the stack's `create/` files over it (the security headers and Report-Only CSP of react-web.md live in `next.config.ts`) and, after `sync`, sets up shadcn/ui as in UI
- Node.js 26 LTS
- Next.js 16 (App Router, Turbopack) + React 19 (`reactCompiler: true` + the `babel-plugin-react-compiler` dev dependency, without which `next build` fails)
- TypeScript 7 + `typedRoutes: true` (`next build` type-checks through the `tsc` CLI)
- pnpm 12 (dependency build scripts are blocked by default; the ones the stack's packages pull in are set to `false` in `allowBuilds` of [setup.json](setup.json), which `sync` adds to `pnpm-workspace.yaml`: the packages work without them, and without these entries their install fails)
- Absolute imports via `paths` (`"@/*": ["./src/*"]`, without `baseUrl`)
- `nuqs` (URL state)
- Cache Components (`cacheComponents: true` + `"use cache"`) + `partialPrefetching: true` (requires `cacheComponents`)
- `ensureStatic` (required on static marketing and blog routes, optional elsewhere, e.g. e-commerce pages with a static shell; levels `shell` / `prefetch` / `navigation`; without `partialPrefetching`, `shell` only logs a warning; `navigation` fails the build on any request-time server work in the route, even inside `Suspense`; can be set on a layout)
- `navigation()` and `prefetch()` from `next/cache` (optional: when a route needs fine-grained control over what is excluded from prefetch and the shell)
- `proxy.ts` (instead of `middleware.ts`; runs only on the Node.js runtime)
- Metadata API, `sitemap.ts`, `robots.ts`, `next/og`

## UI

- Tailwind CSS 4 + shadcn/ui on Base UI (Radix: `init -b radix`): `create` runs `init` and `add button` as [setup.json](setup.json) says, moves the aliases in `components.json` under `@/shared/ui`, which the Oxlint and Knip exceptions cover, deletes the `src/lib/utils.ts` that `init` writes, since components import the `cn` package, and fixes `--font-sans` in `globals.css`, which `init` writes as a reference to itself, so every page falls back to a serif font
- `init` installs what components import without listing it (`@base-ui/react` or `radix-ui`, `class-variance-authority`, `lucide-react`): keep these, with the ones `pnpm unused` reports in `ignoreDependencies` in `knip.json`, or `shadcn add` writes components that don't compile; the rest (`cn` and others) comes with each component, do not install it separately
- `lucide-react`
- `@svgr/webpack` via `turbopack.rules` (optional, custom SVGs as components)
- `next/image` + `next/font`
- `next-themes`
- shadcn `toast` (Base UI's Toast; the shadcn `sonner` component with `-b radix`)
- Motion (gestures and complex animations; page transitions via React `ViewTransition`)

## Data Fetching / State

- RSC + Server Actions (the default for most CRUD)
- TanStack Query + `@tanstack/react-query-devtools` (optional: for data that lives on the client, such as polling, infinite scroll or realtime; it reads the current time, which fails the prerender outside `Suspense`, and so does `dehydrate()`, so a prerendered route builds its hydration state as in Next's TanStack Query guide, "Build a prerenderable hydration state")
- Zustand (optional: when distant parts of the app share client state)

## Error Handling

- `error.tsx` / `global-error.tsx` / `not-found.tsx`
- `catchError` from `next/error` (error boundaries with retry for part of a screen; `react-error-boundary` is not needed)

## Forms / Validation

- React Hook Form 7 + `@hookform/resolvers`
- Zod v4 (`zod/mini` only when the size of client-side validation code matters); `z.config({ jitless: true })` runs before any schema is created, in `src/instrumentation-client.ts`, since Zod's `new Function` check otherwise sends a CSP report on every page that loads a schema

## API

- `next-safe-action` v8 (+ `@next-safe-action/adapter-react-hook-form`)
- Orval + `@faker-js/faker` (optional, only for an external OpenAPI together with TanStack Query; output in `src/shared/api/generated/` with `indexFiles: false`, so it has no barrel files)

## Environment / Configuration

- `@t3-oss/env-nextjs`
- `server-only` + `client-only`, installed explicitly: Vitest and Knip don't see the copies inside `next`

## Database

- Hosting: Neon, with a database branch per preview deployment, created from the staging database (never production) and deleted with the preview; migrations run on it before the preview starts (Supabase when the project uses it as a platform: auth, storage, realtime; its hosted Postgres has no built-in `uuidv7()`, so the project records that as a deviation)
- ORM: Drizzle ORM 0.45 + `drizzle-kit` (Drizzle's docs install the 1.0 release candidate with `@rc`: install without the tag; on 0.x, ORM, Kit and Seed have different version numbers, so pin each exactly and update them together)
- `pg` (node-postgres): driver and pool, through `drizzle-orm/node-postgres`; on Vercel the pool is passed to `attachDatabasePool` from `@vercel/functions` (add it, `@vercel/oidc`, `@vercel/cli-config` and `@vercel/cli-exec` to `trustPolicyExclude` in `pnpm-workspace.yaml` before installing it: Vercel publishes them without the provenance of their earlier releases, so each release fails the install for its first 7 days); not `neon-http`, which has no interactive transactions
- `pgvector` (optional, embeddings/vector search)

## Authentication

- Better Auth 1 (`nextCookies()` from `better-auth/next-js` as the last plugin, otherwise auth calls in Server Actions don't set cookies; OAuth provider via `@better-auth/oauth-provider`, MCP via `@better-auth/mcp`)
  - With email and password: `requireEmailVerification: true` (or `autoSignIn: false`), without which sign-up reports an existing email, and `revokeSessionsOnPasswordReset: true`, which is off by default
  - The rate limiter with `storage: "database"` or `"secondary-storage"`, never the in-memory default
  - Behind a proxy, `advanced.ipAddress` with `ipAddressHeaders` (the one header the proxy sets, such as Railway's `x-real-ip` or `cf-connecting-ip`) or `trustedProxies`: it ignores the framework's `trust proxy` and, without `trustedProxies`, skips a header with several addresses, such as an `X-Forwarded-For` chain, so its rate limiter would put every client in one bucket
- or Clerk (when the client wants a managed service with prebuilt UI instead of auth in its own DB)
- or Supabase Auth (only if Supabase is used as the platform)

## Security / Rate Limiting

- Upstash Redis + Upstash Ratelimit (Arcjet when bot detection and attack protection are needed too)
- `sanitize-html` (server-side, only where user-provided HTML is rendered: it runs in Node without a DOM)
- CSP details behind react-web.md's baseline: `img-src` allows `data:` and `blob:` for inlined images and file previews; `style-src 'unsafe-inline'` because Base UI's ScrollArea and Select and `sonner` (the shadcn toast with `-b radix`) insert `<style>` elements without a nonce and Next renders inline `style` attributes; vendor-documented exceptions such as Sentry Replay's `worker-src 'self' blob:` and Stripe's `https://*.js.stripe.com`; Sentry receives the reports through `report-uri` and `report-to` with the `Reporting-Endpoints` header, as Sentry's guide shows (browsers that support `report-to` ignore `report-uri`)
- A nonce CSP (`'nonce-{random}' 'strict-dynamic'`) needs `cacheComponents` and `partialPrefetching` off, since a prerendered shell's scripts get no nonce and the page doesn't hydrate, and every page dynamic (`await connection()`), so no `ensureStatic`, ISR or CDN caching

## Background Jobs

- Vercel Cron (simple schedules)
- Vercel Workflows (the `workflow` package on top of the open-source Workflow SDK; long-running tasks and retries when deploying to Vercel; `next.config.ts` is wrapped in `withWorkflow()` from `workflow/next`, and the `proxy.ts` matcher excludes `.well-known/workflow/`)
- or Inngest when not deploying to Vercel (Trigger.dev when tasks need long-running compute outside the app)
- Vercel Workflows and Inngest can't enqueue inside a DB transaction: a job that must not be lost goes through an outbox table that a cron job reads

## Realtime

- Pusher (Ably when message history or guaranteed delivery is needed)
- or Supabase Realtime when Supabase is the project's platform (Broadcast only, if auth is not from Supabase)

## Search

- Postgres full-text search + `pg_trgm`
- or Typesense or Meilisearch when typo tolerance and facets are needed

## File Uploads / Storage

- `react-dropzone` (UI)
- Vercel Blob on Vercel, S3 presigned URLs elsewhere

## Email

- Resend + React Email (the `react-email` package; `@react-email/components` is deprecated)

## Payments

- Stripe (Paddle or Polar when a merchant of record should handle sales tax and VAT)

## AI

- `ai` (Vercel AI SDK 7, ESM-only) with AI Gateway as the default provider
- `@ai-sdk/openai` or `@ai-sdk/anthropic` or `@ai-sdk/google` (only for a direct connection without the Gateway)
- `@ai-sdk/workflow` (optional, `WorkflowAgent` for long-running agents on top of Vercel Workflows; installed together with the `workflow` package)
- Streamdown (optional, for a chat interface; `@source "../../node_modules/streamdown/dist/*.js"` in `src/app/globals.css`, and the same for each Streamdown plugin, since its docs' `../node_modules` path is for `app/` at the project root, and Tailwind otherwise leaves out its classes)

## CMS / Content

- `@next/mdx` (content in the repository)
- or Sanity (when editors need a hosted CMS outside the repository)
- or Payload CMS 3 (when the CMS is the foundation of the project, with its own DB and auth)

## Internationalization

- `next-intl` + `next/root-params` (read the locale from root params so caching keeps working; root params are unavailable in Route Handlers and Server Actions)
- `NextIntlClientProvider` wraps the providers component in the server root layout, where it inherits the locale and time zone, with `messages` limited to the namespaces client components need (`null` for none), since it otherwise passes all of them

## Dates

- `date-fns` v4 + `@date-fns/tz` (only in code rendered in the browser: `TZDate` reads the current time, which fails the prerender)

## Tables / Virtualization

- TanStack Table v9 (compatible with React Compiler, no `"use no memo"`; an own component whose only props are Table objects (`table`, `row`, `cell`, `column`, `header`) reads their state inside a `Subscribe` boundary, as TanStack's React Compiler guide says, since the compiler otherwise skips its re-render and, for example, a row's checkbox stays unchecked; `useTable` + explicit `tableFeatures`; v8 style via `@tanstack/react-table/legacy`; cells and headers render through the imported `FlexRender`, not the `table.FlexRender` of its docs, which Oxlint's `control-has-associated-label` doesn't count as a label)
- TanStack Virtual (`useVirtualizer` is on the React Compiler `incompatible-library` list: the compiler skips the component that calls it, and the call gets `// oxlint-disable-next-line react/incompatible-library -- <reason>`, since lint reports it even with `"use no memo"`)

## Charts

- Recharts

## Drag & Drop

- `@dnd-kit/react` (0.x: pin the exact version)

## Rich Text / Editor

- Tiptap (through `next/dynamic` with `ssr: false` in a client component, or inside `Suspense`: its editor calls `Math.random()` while rendering, which fails `next build` under Cache Components)

## Maps

- `@vis.gl/react-maplibre` + MapLibre GL (v6 finds no worker in a bundle, so the map stays empty unless the client component calls `setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString())`, as MapLibre's Turbopack setup says)

## PDF

- `@react-pdf/renderer`

## CSV / Excel

- Papa Parse (CSV)
- `write-excel-file` / `read-excel-file` (xlsx, also works on the server)

## Analytics

- PostHog (product analytics, feature flags, session replay)
- or Vercel Analytics / Plausible when only visit tracking is needed
- Enable session replay in only one of Sentry or PostHog

## Testing

- Vitest 5 + `jsdom` + `@testing-library/react` + `@testing-library/user-event` + `@testing-library/jest-dom` (unit, client components; `jsdom` only through `// @vitest-environment jsdom` in component tests, not in the config, since the env module refuses server variables wherever `window` exists, which breaks the Server Action and DAL tests)
- `@vitest/coverage-v8`
- Testcontainers (Postgres for Server Action and DAL tests, started in `vitest.global-setup.ts`, the test file the Oxlint config lets write `process.env`; the E2E test DB runs before `playwright test` starts, as a `services:` container in CI and through `docker compose` locally, since Playwright starts `webServer` before its `globalSetup`)
- Playwright + `@axe-core/playwright` (e2e, async Server Components; its tests live outside `src/`, since the `test` script runs Vitest only there)
- Mock Service Worker 3 (optional, only for projects with an external REST API)
- Lighthouse CI (`@lhci/cli`: the per-route initial JS budget via `resource-summary:script:size` assertions, plus lab Web Vitals, against `next start` of the production build; its `.lighthouseci/` report folder goes in `.gitignore`, or `pnpm lint` fails on it)

## Code Quality / Formatting

- Oxlint with the `react`, `nextjs`, `jsx-a11y`, `import` and `node` plugins, set up by `config/standards/nextjs/oxlint.json`, which the project's `.oxlintrc.json` extends: the React Compiler rules, `no-explicit-any`, `no-non-null-assertion`, `ban-ts-comment`, `no-deprecated`, `only-throw-error`, `switch-exhaustiveness-check`, `unicorn/no-array-sort` and `no-array-reverse` (also on a bare `items.sort();`), `import/no-cycle`, `import/no-default-export` (off in `src/app/`, `src/i18n/request.ts` and tool configs), `react/only-export-components` (off in `src/app/`, whose route files export `metadata` and segment config), `no-empty`, `no-nested-ternary`, `preserve-caught-error`, imports between layers, `no-console`, and `node/no-process-env` outside `src/env.ts`, `src/instrumentation.ts` and tool configs; the generated components in `src/shared/ui/` skip the a11y, React Compiler, `only-export-components` and template-literal rules their stock code breaks; `import/namespace` is off, since TypeScript checks the same and Oxlint resolves a package with a separate browser build to its server entry, so Sentry's `instrumentation-client.ts` fails it
- `oxlint-tsgolint`: type-aware rules on TS 7, including `no-floating-promises`
- Oxfmt (0.x: the Renovate preset pins the exact version), with its built-in Tailwind class sorting: `.oxfmtrc.json` with `"sortPackageJson": false` (by default it sorts `package.json`, which `pnpm add` then leaves failing `pnpm lint`) and `"sortTailwindcss": { "stylesheet": "./src/app/globals.css" }`; it skips what `.gitignore` and its `ignorePatterns` list
- Knip v6
- Scripts: `lint`, `format`, `typecheck` (a separate step), `test` and `unused`, as in [setup.json](setup.json), which `sync` adds to `package.json`
- `next analyze` (optional: Turbopack bundle analyzer, for finding what pushes a route over its JS budget; `@next/bundle-analyzer` only for webpack)

## Agent tooling (optional)

- Next.js DevTools MCP
- Skills from `vercel/next.js` via the skills CLI: `next-cache-components-optimizer`, `next-partial-prefetching-optimizer`, `next-bundle-optimizer`

## Git Hooks

- Lefthook, extending `config/standards/nextjs/lefthook.yml`

## CI

- GitHub Actions (the `lint`, `typecheck`, `test`, `unused` and `build` scripts, Lighthouse CI)
- `.next/cache` kept between CI runs (persistent Turbopack build cache)

## Dependency Management

- Renovate

## Monitoring / Observability

- Sentry (`@sentry/nextjs`; also receives Web Vitals from real users and CSP reports); `dataCollection` as `production.md` (Privacy) says
- `pino`: structured server logs, from a `server-only` module, with `` timestamp: () => `,"time":${Math.round(performance.timeOrigin + performance.now())}` ``, since its default `Date.now()` fails the prerender of a static route
- `pino-pretty`: logs in development, piped in the `dev` script (`next dev | pino-pretty`), which Knip sees, unlike a `transport` target

## Deployment

- Vercel
- or Docker (`output: "standalone"`) + Coolify when self-hosting (with several instances or rolling deploys: `deploymentId` per release, one `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` shared by all instances, and the previous release's `_next/static` files stay available, so open tabs can still load their chunks; Redis via `cacheHandlers` for `"use cache"` and `cacheHandler` for ISR with multiple instances); the Docker build stage copies pnpm from the `ghcr.io/pnpm/pnpm:12` image, as pnpm's Docker guide shows, since Node 26 images have no corepack
- or Cloudflare when the client's infrastructure is there (`@opennextjs/cloudflare`: check its peer range against your Next version; `proxy.ts` support is experimental and not maintained by the OpenNext team; not vinext, which Cloudflare recommends: it is still under active development and implements the Cache Components that `create` turns on only in part)
