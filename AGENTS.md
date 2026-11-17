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
