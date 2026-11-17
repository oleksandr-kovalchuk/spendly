# Common: TypeScript Projects

Rules for every stack. A stack's `rules.md` adds to them and wins where it is more specific.

## Principles

- KISS, YAGNI, AHA, single responsibility: of two equal solutions, the simpler one; abstractions and optimizations only for a real need.
- Before writing new code, check whether existing code (a component, hook, provider or utility) can be reused.
- Before adding a dependency, check whether the platform (`fetch`, `URL`, `Intl`, `crypto`, `structuredClone`, `AbortSignal.timeout`) or the framework already solves the task, and check the package's size, maintenance and license.
- Simplify or split complex nested logic.
- A change does only what its task needs: no drive-by refactoring or reformatting of unrelated code.
- Comments explain why, not what; no dead code or commented-out blocks in commits.

## Naming

- Files in kebab-case; framework file conventions (router files, role suffixes) keep their own form.
- Magic numbers and strings become named constants in UPPER_SNAKE_CASE; HTTP status codes and test values need no named constant.
- Booleans prefixed with `is`/`has`/`can`/`should`.

## Structure

- Group code by feature, not by file type.
- Named exports; a default export only where the framework or lazy loading requires it.
- No `index.ts` barrel files, only direct imports.

## TypeScript

- `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax` come from `config/standards/<stack>/tsconfig.json`, which the project's tsconfig extends.
- No `enum`: a union of literals or an `as const` object; `erasableSyntaxOnly` is on, except in NestJS, whose DI uses constructor parameter properties.
- No `any`, ever.
- External data (request input, API responses, `JSON.parse`, `catch`, `FormData`, storage, URL and deep link params, messages) is `unknown`, narrowed by a schema or a check; a client generated from the API contract types its responses, unless the stack's rules validate them.
- Types are inferred from their source (schema, API contract, DB schema, function return), not written by hand.
- Discriminated unions instead of a set of related optional fields.
- `satisfies` instead of `as` where possible.
- No non-null `!` or `@ts-ignore`; if unavoidable, `@ts-expect-error` with an explanation.
- A `switch` over a discriminated union is exhaustive, checked via `never` (`default: throw new Error("Unhandled status", { cause: status satisfies never })`, since `restrict-template-expressions` rejects a `never` value in a template literal).
- No deprecated APIs: use what the deprecation notice names.
- A linter rule is ignored only with an explanation why.

## Errors and Async

- Every Promise is awaited or explicitly handled.
- No empty `catch`: handle, show, log or rethrow the error.
- Throw only `Error` or its subclasses, not strings or objects.
- When wrapping or rethrowing an error, keep the original in `cause`.

## Dates and Money

- Dates with time are transmitted and stored in UTC (ISO 8601), converted to the user's time zone only for display.
- A date without time (birthday, deadline) is `YYYY-MM-DD`, without a time zone.
- Money never in floats: integer minor units (cents) or a decimal type.

## Secrets and Privacy

- Secrets never in code, the repository or client bundles; `.env.example` lists every variable without secret values and is committed, `.env` is not.
- Error monitoring, analytics and session replay get IDs, not personal data: no emails or names in events; replay masks all text, inputs and images by default and is off on screens with sensitive data.

## Testing

- Reproduce a bug with a test first, then fix it.
- Tests are independent of each other and of run order: each test creates its own data.
- Time in tests is controlled, not the current date; tests wait for state, never a fixed timeout.
- External HTTP APIs are mocked at the network level, not by mocking modules.
- With Vitest, the variables the env schema requires get test values in `test.env` of its config, since Vitest doesn't load `.env`; a value the global setup provides, such as the Testcontainers database URL, stays out of it.
- Checks aren't weakened to make a change pass: deleting or skipping a test, weakening an assertion or turning off a lint or type rule is a person's decision, explained in the Pull Request; an AI agent never does it on its own, except for an ignore the standards prescribe, with its reason.

## Quality

- `package.json` has the scripts `lint` (linter and format check), `format`, `typecheck`, `test` and `unused` (Knip), plus `build` where there is a build step; the stack's `stack.md` gives their commands.
- CI runs lint, typecheck, tests, Knip and the build only through these scripts, never with its own commands.
- Lint passes with zero warnings; no `console` in app code.
- Dependency install scripts are blocked by default: a dependency that `ERR_PNPM_IGNORED_BUILDS` names is set to `false` in `allowBuilds` (`pnpm approve-builds '!<package>'`, then `pnpm format`) when it works without its script, and to `true` only when it needs it.
