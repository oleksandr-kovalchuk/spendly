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

- `notFound()` in a dynamic route streams the 404 page with status 200: E2E checks its content and `noindex`; only `[locale]/[...rest]` returns a real 404 (decision 0005)
- `meta[name="robots"]` is in the DOM twice (head and streamed body): select `head meta[name="robots"]`
- AA contrast fails for `text-muted-foreground` on `bg-muted` and for `bg-destructive/10 text-destructive`: use solid tokens (a ring, `bg-destructive`), check both themes
- A button that turns `disabled` when pressed drops focus to `<body>`: give it `focusableWhenDisabled` (renders `aria-disabled`) and assert `aria-disabled` in tests
- "Today" is UTC until `TimeZoneSync` sets its cookie and refreshes: anything defaulting to today needs `today` in its `key`
- `shadcn add` writes faint focus rings (`ring-ring/50`, `ring-destructive/20`): use the solid `ring`, add `aria-invalid:focus-visible:ring-ring` (and `dark:`), Tab to it in both themes
- Next keeps a visited screen mounted but hidden (`Activity`): use role locators or `.filter({ visible: true })`, not CSS ones; nav items are `listitem`s too, so wait for a specific one
- nuqs shows a `shallow: false` update at once, Next's `useSearchParams` only after its server render (~1 s): code copying URL state nuqs writes reads it with a nuqs hook
- A `ViewTransition` animates `enter`/`exit` only with no DOM node between it and the changed subtree: wrap every level that can appear, keep a list's container mounted when empty
- A dialog closed apart from its Server Action's refresh can make React skip the refresh's view transition (Base UI flushes the close): close it in the action's transition
- `getLocale()` from `next-intl/server` throws inside a Server Action: pass the locale in the action's input, validated against `routing.locales`
- Browser code importing `@/shared/db/app-schema` ships the ORM (~30 KB): put constants the browser needs in `@/shared/db/app-constants`
- Browser code uses `zod/mini`, not `zod`: the full build adds ~15 KB and its JIT probe sends a CSP report (decision 0007)
- A Server Action deleting what the URL names (`?edit=`) must not `refresh()` (that renders `notFound()`): `redirect(url, RedirectType.replace)` to the list; a plain one pushes
