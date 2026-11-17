# Common: React Web Apps

Rules shared by Next.js and React + Vite, on top of [react.md](react.md) and [typescript.md](typescript.md). A stack's `rules.md` adds to them and wins where it is more specific.

## Structure

- Layers depend in one direction: `app` (routing, providers) -> page composition -> `features` -> `shared`; features are composed at the page level, and the linter enforces the direction.
- Basic UI components (shadcn/ui) live in `shared/ui`, customized there through the variant system, without wrappers in features.
- `@base-ui/react` (or `radix-ui`), `class-variance-authority` and `lucide-react` stay even when `pnpm unused` reports them (in `ignoreDependencies` of `knip.json`): components that `shadcn add` writes later import them.

## Components

- Arrays aren't mutated: `toSorted`, `toReversed`, `toSpliced` and `with` instead of `sort`, `reverse` and `splice` (linted, except `splice`).
- UI that keeps its state while hidden (tabs, wizard steps) is hidden with `Activity`, not by unmounting or `display: none`.

## State

- The URL is the source of truth for search, filters, sorting, pagination, tabs and modals that should be linkable; search params are typed and validated by a schema, not copied into a store or `useState`.
- Default values aren't written to the URL.

## Data

- Client requests pass the query's `signal` to `fetch`, so they're cancelled when the result is no longer needed.
- Independent requests run in parallel, without waterfalls; a route's data starts loading together with its code.
- Optimistic updates only where latency hurts the UX, always with a rollback on error.

## Errors

- An unexpected error is reported to monitoring once, from one place; the user sees a message without technical details and a way to retry or go back.

## Forms

- Field values live in the form library, not `useState`; a standalone input without submit (a toggle, or a search that isn't linkable) uses `useState`.
- A field error is linked to its input for screen readers (`aria-invalid`, `aria-describedby`).
- Inputs have the correct `type`, `autocomplete` and `inputmode`.

## Routing

- Heavy components the first render doesn't need (editor, map, charts) are lazy-loaded.
- Route and search params are validated before use: an invalid param leads to the 404 page, an invalid search param falls back to the default.
- Routes are protected before render (route loader, proxy or server), not by a redirect from a component's `useEffect`.
- Navigation goes through `Link` and the router API, not `window.location`, except logout: it ends with a full page load (`window.location.assign`), which clears the previous user's client state (query cache, stores, and the pages Next keeps in `Activity`).
- There is a 404 page, and an unavailable resource renders it.

## Styles

- Tailwind arbitrary values only for one-off layout values (`calc`, `grid-template`), never for colors, spacing or typography.
- CSS logical properties (`ms-*`, `pe-*`, `inset-s-*`) instead of left and right.
- Mobile-first: base styles for small screens, breakpoints extend them.
- A component that depends on its container's width, not the screen's, uses container queries.
- The theme is applied to `<html>` before the first paint, without a flash of the wrong theme.
- Feature code has no `dark:` variants or theme conditions; the generated shadcn components in `shared/ui` keep their own classes, `dark:` variants and arbitrary values included.
- Classes are composed with the `cn()` utility with conflict resolution, not concatenated by hand.
- No `!important`; inline `style` only for dynamic values.
- Simple animations in CSS; transitions between states and pages via React `ViewTransition`; JS animations only for gestures and complex sequences.

## Performance

- Core Web Vitals at the 75th percentile of real users, per route, on mobile and desktop: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; field data is reported to monitoring or analytics.
- Each route's initial JS (compressed) stays within a budget, 200 KB unless the project sets its own; CI checks it on the production build and fails the Pull Request when a route exceeds it.
- Images have explicit dimensions, a modern format (AVIF or WebP) and a size matching their container; images below the fold are lazy-loaded; the LCP image isn't lazy and has `fetchPriority="high"`.
- Fonts are self-hosted and subset, with `font-display`; no third-party font CDNs.
- Third-party scripts load deferred and never block rendering.
- Long lists are paginated or virtualized.
- Input that triggers a request is debounced; input that triggers a heavy render goes through `useDeferredValue`.

## Accessibility

- Semantic HTML: `button` for actions, `a` for navigation, no `div` with `onClick`.
- Pages use landmarks (`header`, `nav`, `main`, `footer`), and a skip link leads to `main`.
- Headings follow the hierarchy; one `h1` per page.
- `<html lang>` matches the page's language.
- Every page has a unique, descriptive title.
- Every interactive element is keyboard-reachable, with a visible focus indicator and an accessible name.
- After a client-side navigation to another page, focus moves to its main content or `h1`.
- E2E tests run automated accessibility checks.
- Sticky headers and footers don't cover the focused element (`scroll-padding`).
- Interactive targets are at least 24x24 px.
- Every `input` has a `label`; images have `alt`, empty for decorative ones.
- Dialogs, menus, popovers and comboboxes are built on accessible primitives (shadcn/ui), not by hand.
- IDs for ARIA relationships come from `useId`.
- Animations respect `prefers-reduced-motion`.

## Dates and Numbers

- Dates and numbers are formatted with the current locale via `Intl` or the date library, not by hand.

## Security

- Variables with the public prefix (`NEXT_PUBLIC_`, `VITE_`) are compiled into the client bundle: no secrets in them.
- `dangerouslySetInnerHTML` only with HTML cleaned by the stack's sanitizer.
- User-supplied URLs in `href` and `src` are checked for `http` or `https`.
- Permission checks in the UI are only for UX; the server authorizes every request.
- Tokens never reach `localStorage`, `sessionStorage` or JS-readable cookies; browser storage holds only non-critical data (theme, UI settings).
- HTML responses carry the security headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) and a CSP, on static hosting too.
- CSP baseline: `default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'` (or the hosts allowed to embed the app), `form-action 'self'` plus the hosts forms post or redirect to, `img-src 'self' data: blob:`, `style-src 'self' 'unsafe-inline'`; `script-src` per the stack rules, never with `'unsafe-eval'` in production.
- Third-party hosts are listed per directive and only for what the app loads; no bare `*` or scheme-only sources (`https:`, `wss:`); other `data:` and `blob:` sources and subdomain wildcards only where the vendor documents them.
- A new or changed CSP ships as `Content-Security-Policy-Report-Only` first, reporting to Sentry, and is enforced once production traffic shows no unexpected violations; `frame-ancestors` is enforced from the start, in its own `Content-Security-Policy` header, since a Report-Only policy blocks no framing.

## Privacy

- Scripts and embeds that need consent aren't in the initial HTML: the consent tool injects them after opt-in for their category, and an embed (video, map) shows a click-to-load placeholder until then.
- The consent banner is keyboard accessible, doesn't shift the layout, and offers "Reject all" on its first layer as prominently as "Accept all"; a footer link reopens it.
