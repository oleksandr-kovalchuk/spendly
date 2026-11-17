# 0001: No dev-standards check in CI

Status: accepted

## Decision

CI does not run the `peppernode/dev-standards` action. The board runs `pnpm standards check` locally instead.

## Why

The action is private and only repositories in the `peppernode` org can use it. This repository is personal, so the job failed at setup.

## Consequences

- A deviation from the standards is not caught by CI; it is caught only when `pnpm standards check` is run locally.
- Run `pnpm standards check` before merging.
