<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Standards: nextjs

- Stack: [stack.md](docs/standards/nextjs/stack.md); before adding or setting up a library, read its section there and check [versions.json](docs/standards/nextjs/versions.json).
- Rules: [.claude/rules/standards/](.claude/rules/standards/); Claude Code loads them, other agents read them there.

## Project

### Commands

- `pnpm dev`: the dev server; `pnpm build`, then `pnpm start`
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm unused`: what CI runs; `pnpm format` fixes formatting
- `pnpm standards check`: compares the project with the dev standards
- `pnpm spec`: OpenSpec CLI; specs live in `openspec/`: propose (`/openspec-propose`), apply (`/openspec-apply-change`), archive (`/openspec-archive-change`); `pnpm spec validate --all` runs in CI

### Structure

- `src/app/`: Next file conventions only; pages are composed in `src/views/`, features live in `src/features/`, shared code in `src/shared/` (shadcn/ui components in `src/shared/ui/`)
- Vitest tests sit next to their code in `src/`

### Constraints

- Node from `.nvmrc`, pnpm from `packageManager`; no npm or yarn
- Never edit the copied standards: `.claude/rules/standards/`, `docs/standards/`, `config/standards/`, `.claude/hooks/standards/`

### Known pitfalls

- `notFound()` in a dynamic route (Cache Components) runs after the 200 shell streams: the 404 page renders but the status stays 200; E2E checks the 404 content and `noindex`, not the status. Only the prerendered `[locale]/[...rest]` route returns a real 404 (decision 0005)
- `meta[name="robots"]` is in the DOM twice (head and streamed body): select `head meta[name="robots"]`
- axe in an open dialog reads mid-animation colors: await `document.getAnimations()` finishing first; don't exclude the dialog
- AA contrast fails for `text-muted-foreground` on `bg-muted` (4.34:1) and tinted `bg-destructive/10 text-destructive` (3.82:1): use solid tokens (a ring instead of `bg-muted`, `bg-destructive text-destructive-foreground`), check light and dark
- A button that becomes `disabled` when pressed (a "current period" button, an arrow at a bound) drops keyboard focus to `<body>`: give it `focusableWhenDisabled` (renders `aria-disabled`), assert `aria-disabled` in tests
- "Today" uses UTC until `TimeZoneSync` sets the time zone cookie after the first load and refreshes: anything defaulting to today needs `today` in its `key` to reset
- `shadcn add` writes faint focus rings (`ring-ring/50`, `focus-visible:ring-destructive/20`, and `aria-invalid:ring-destructive/20`, which hides focus on an invalid field): use the solid `ring`, add `aria-invalid:focus-visible:ring-ring` (and its `dark:` twin), and Tab to the new component in both themes
- Chromium tabs into Recharts' SVG layers even with `accessibilityLayer={false}`, and axe can't see it: a decorative chart whose data is shown as text goes in an `inert` wrapper; check the Tab order through the chart
- With a fully static shell, browsers get the 404 page without its title (Next drops the not-found metadata): the signed-out top bar keeps a runtime part (`SessionSignOut`); check the title with the E2E test, since a bare Playwright script (headless user agent) never sees it, even when it works
- Next keeps a visited screen mounted but hidden (`Activity`), so a CSS locator (`[aria-live]`, `h2 time`) can match the hidden screen too: use role locators, which skip hidden elements, or `.filter({ visible: true })`; nav `li`s count as `listitem`s, so wait for a specific item
- Next's `useSearchParams` changes only when the server render a nuqs `shallow: false` update starts has finished (about 1 s), while nuqs shows the new value at once: code that copies URL state nuqs writes (the nav's period links) reads it with a nuqs hook, or a quick tap uses the old value
- `global-error.tsx` ships on every route: importing `shared/ui/button` there adds a second Base UI copy (~15 KB gzip) once the root layout has no Button; it uses a native `button`
- React animates a `ViewTransition`'s `enter`/`exit` only with no DOM node between it and the inserted or removed subtree: wrap every level that can appear or disappear (a day group, not only its items) and keep the container mounted when a list empties; check that `document.startViewTransition` runs for the first and the last item
- `getLocale()` from `next-intl/server` throws inside a Server Action (it reads root params): pass the locale in the action's input, validated against `routing.locales`
- A Server Action that deletes what the current URL names (`?edit=`) must not `refresh()`: the refresh renders that URL, which calls `notFound()`; `redirect()` to the list instead
