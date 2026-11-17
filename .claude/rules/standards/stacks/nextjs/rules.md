# Next.js: Rules

Also follow [common/typescript.md](../../common/typescript.md), [common/react.md](../../common/react.md), [common/react-web.md](../../common/react-web.md) and [common/server.md](../../common/server.md); this file adds the stack's rules and wins where it is more specific.

## Principles

- Next's own modules (`next/image`, `next/font`, `next/script`, the Metadata API) before a third-party package for the same job.
- Next's bundled docs (`node_modules/next/dist/docs/`, which the `AGENTS.md` block from Next points to) are the API reference; where their examples differ from these rules (forms without the action wrapper, tests in `__tests__/`), these rules win.

## Naming

- Server Action names are verbs (`createOrder`, `updateProfile`).

## Architecture and Structure

- Layers: `app` -> `views` -> `features` -> `shared`; the page-composition layer is `views`, not `pages`, which in Next means the Pages Router.
- `app/` holds only Next file conventions and minimal composition; components and logic live in `views` and features. `proxy.ts` lives in the project root or `src`, next to `app/`.
- Next file conventions export what Next expects: the default export where required, `metadata`, `generateMetadata`, `generateStaticParams` and segment config next to the component, HTTP method handlers (`GET`, `POST`) in `route.ts`, a named `proxy` function in `proxy.ts`.

## TypeScript

- Types for routes, `params` and `searchParams` come from `next typegen`, not by hand.

## Server and Client Components

- Server components by default; `"use client"` as low as possible, on interactive leaves, not on pages and layouts.
- Pass server components into client components as `children` or props, so they stay out of the client bundle.
- A client component receives only serializable data and Server Actions; no DB models, functions or class instances.
- Modules with secrets, DB access and server SDKs import `"server-only"`, except the DB client and the Better Auth config, which scripts (seeds) and its CLI load outside Next, where `"server-only"` throws; browser-only modules import `"client-only"`.
- Providers (theme, query client) go in one client component that wraps `children` in the root layout.
- Server components have no hooks, state or browser APIs; heavy data work happens there, not on the client.
- Browser-only values (`window`, `localStorage`, `matchMedia`) and values that depend on the user's time zone, locale or the current time aren't read during the server render, nor guarded with `typeof window`: read them via `useSyncExternalStore` with a server snapshot, or render the component only in the browser with `use(browser())` (`browser` from `react-dom`) inside `Suspense`; a date in a fixed time zone may render on the server through `Intl.DateTimeFormat` with `timeZone`.
- `suppressHydrationWarning` only on `<html>`, where `next-themes` sets the theme before hydration, and on a specific element with the reason in a comment.

## Data and Caching

- Reads happen in Server Components through the server data access layer (DAL): `server-only`, authorization inside, returns DTOs with only the needed fields, not DB rows.
- Components don't access the DB or external APIs directly.
- In app code, only the env module (`@t3-oss/env-nextjs`) reads `process.env`, apart from the `NEXT_RUNTIME` check in `instrumentation.ts`; the DAL and all other code import from it.
- With Cache Components nothing is cached by default: cache explicitly with `"use cache"` plus `cacheLife` and `cacheTag`; no `dynamic = "force-dynamic"`, `revalidate` or `fetch` cache options.
- No `cookies()`, `headers()` or `searchParams` inside `"use cache"`: read them outside and pass them as arguments; `"use cache: private"` only where that isn't practical, since it isn't kept in a server cache across requests.
- Every part that reads runtime data (`cookies`, `headers`, `params`, `searchParams`) or uncached data is wrapped in `Suspense` (`loading.tsx` or local) with a skeleton; the root layout doesn't read `cookies()` or `headers()`.
- An independent request's promise can also go to a client component that reads it with `use()`; identical calls within a render are deduplicated with React `cache()`.
- Slow data doesn't block the page: each such part is a separate async Server Component in its own `Suspense`.
- Static routes (marketing, blog) set `ensureStatic = "navigation"`, the only level the build validates; a dynamic one also exports `generateStaticParams()` with at least one complete set of params, or the build fails.
- A client-side server-state library only for data that lives on the client (polling, infinite scroll, realtime, client-side filters); data from Server Components isn't fetched again but passed via hydration or `initialData` to a query inside `Suspense`, as `stack.md` describes.
- A client store is created per request in a provider, not as a module-level singleton, so it doesn't leak between users on the server.

## Server Actions and Mutations

- Mutations go through Server Actions, reads don't; Route Handlers only for webhooks, files, streams, the auth library's routes, external clients and the reads of the client-side server-state library.
- Every Server Action is a public endpoint: it validates input with a schema and checks the session and resource access inside, whatever the UI shows.
- Server Actions use one type-safe wrapper with schema validation and return a structured result (data, field errors, error code) instead of throwing to the client.
- After a mutation, the action refreshes the cache itself: `updateTag` for read-your-writes, `revalidateTag` with a profile for background invalidation; `redirect()` when the flow navigates.
- Pending state from `useActionState` or the action wrapper; optimistic updates with `useOptimistic`.
- `after()` only for best-effort post-response work (logs, analytics); a job that must not be lost, such as an email, goes into an outbox table in the data change's transaction, and a cron job picks it up.
- Server Actions, proxy and Route Handlers run on the default Node runtime; no route exports `runtime`, which Cache Components rejects even as `"nodejs"`.
- Server Actions called from another host (another domain, or a proxy that doesn't forward `x-forwarded-host`) list it in `experimental.serverActions.allowedOrigins`.

## Errors and Async

- `error.tsx`, `global-error.tsx` at the root, `catchError` from `next/error` for part of a screen; no separate Error Boundary library.
- `notFound()` and `redirect()` are called outside `try/catch`; `unstable_rethrow` only when `try/catch` is unavoidable.
- Server error details don't reach the client: the action or Route Handler returns an error code.
- Server errors reach monitoring through `onRequestError` in `instrumentation.ts`, client errors through `instrumentation-client.ts`; an error caught to return an error code (the action wrapper's `handleServerError`, a Route Handler's `catch`) is reported with `Sentry.captureException` and logged; `error.tsx` doesn't report errors with a `digest` again.
- The trace id serves as server.md's request id: reading `headers()` for one would make cached and prerendered code dynamic.

## Forms

- Submit goes to a Server Action that validates with the same schema on the server.

## Routing and `app/` Files

- Heavy client components load via `next/dynamic`; `ssr: false` only inside a client component.
- A segment gets `loading.tsx` when it reads runtime or uncached data and `error.tsx` when it can fail; `not-found.tsx` defines the 404, and an unavailable resource ends with `notFound()`.
- `params` and `searchParams` are promises: `await` them as low in the tree as possible, inside `Suspense`; invalid `params` call `notFound()`.
- Search params: on the server from the page's `searchParams` prop; on the client, `useSearchParams` and the `nuqs` hooks only inside `Suspense`.
- Route protection: `proxy.ts` does only optimistic checks (cookie presence, redirect) and the session handling its auth library requires there (Clerk's `clerkMiddleware()`, Supabase's token refresh), no DB or business logic; the real session and access checks are in the page, the DAL and Server Actions, since layouts don't re-render on navigation.
- Links use typed routes (`typedRoutes`); with next-intl, `next/link` with the locale prefix, since next-intl's `Link` accepts any string unless its `pathnames` are written by hand.
- `Link` prefetches by default; turn `prefetch` off only in long lists of links.

## SEO and Metadata

- Metadata (title, description, Open Graph) via the Metadata API (`metadata` or `generateMetadata`); no `<title>` in components, except `global-error.tsx`, which can't export metadata.
- The root layout sets `metadataBase`; every indexable page has a canonical URL (`alternates.canonical`).
- Pages in several languages list each translation in `alternates.languages`.
- `sitemap.ts` and `robots.ts` live in `app/`; the sitemap lists only canonical, indexable URLs.
- Structured data: JSON-LD in `<script type="application/ld+json">` with `<` escaped (`JSON.stringify(data).replace(/</g, "\\u003c")`), the one `dangerouslySetInnerHTML` without the sanitizer.

## Performance

- Images only via `next/image` with `width`/`height` or `fill` and `sizes`; the LCP image sets `loading="eager"` and `fetchPriority="high"` (`next/image` is lazy by default), not `preload` (`priority` is deprecated).
- `images.remotePatterns` lists each allowed host explicitly, with `protocol: "https"` and a `pathname` prefix; no wildcards in `hostname`.
- Third-party scripts via `next/script` with `strategy` `afterInteractive` or `lazyOnload`.
- Outside the client-side cases in Data and Caching, pagination and filters go through the URL and server rendering, not by loading everything onto the client.

## i18n (multilingual projects only)

- The locale comes from root params; `proxy.ts` handles the locale redirect.
- Translations for server rendering load on the server; only the namespaces client components need go to the client.

## Security and Env

- User-provided HTML is sanitized on the server with `sanitize-html`, so no sanitizer ships to the browser.
- Only the user DTO reaches the client; session tokens never reach client code, except the session cookies Clerk and Supabase Auth set, which their browser SDKs read: they stay as the SDK sets them, not `httpOnly`.
- Security headers and the CSP via `headers()` in `next.config`; static and partially prerendered routes can't get a nonce, so they use `script-src 'self' 'unsafe-inline'`.
- A nonce CSP (set in `proxy.ts`) only when compliance requirements forbid `'unsafe-inline'`, recorded as a deviation, with the trade-offs `stack.md` lists.

## Testing

- Unit tests for utils, hooks and schemas; component tests (as in react.md) only for synchronous components; async Server Components E2E; Server Actions and the DAL as functions against the test DB, with `next/headers` mocked per test for the session, since Next's request APIs throw outside a request.
- The app's own backend isn't mocked: E2E runs against a real test DB.
- Vitest tests live in `src/` next to their code, not in a root `__tests__/`: the `test` script collects only `src/`.
- CI runs the `build` script too: it catches Cache Components violations (`Suspense`, runtime data in cache).
