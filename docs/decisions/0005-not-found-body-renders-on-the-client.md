# 0005: The 404 page body renders on the client

Status: accepted

## Decision

Unknown URLs under a locale are caught by `src/app/[locale]/[...rest]/page.tsx`, which calls `notFound()` while prerendering, so the response has the 404 status. In this Next version the initial HTML of that response is the client-rendered error shell (`<html id="__next_error__">`): it has no `<html lang>`, `<title>` or `<h1>`; the 404 page (with its title from `generateMetadata`) renders in the browser after hydration. This deviates from react-web.md, Accessibility (`<html lang>`, unique title) and nextjs/rules.md, SEO and Metadata for the 404 response only.

## Why

- nextjs/rules.md, Routing requires `notFound()` and a real 404 status for an unavailable resource; with Cache Components the not-found UI cannot be streamed into the initial HTML of a prerendered route.
- Returning 200 with a server-rendered body (the previous behavior) is worse: crawlers index unknown URLs.
- A 404 page is not indexed, so the missing metadata costs no SEO; users with JS get the full page with title and `lang`.

## Consequences

- Without JS the 404 shows no content, only the status.
- Revisit when Next renders `not-found` into the initial HTML for prerendered routes; then the E2E check can assert the title and `lang` too.
