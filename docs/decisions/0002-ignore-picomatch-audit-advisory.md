# 0002: Ignore the picomatch audit advisory

Status: accepted

## Decision

`pnpm audit` ignores GHSA-fc5q-39xc-vjpf (picomatch <=4.0.7) through `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`.

## Why

The advisory is high severity and has no patched version, so CI's `pnpm audit --prod --audit-level=high` fails on main. picomatch comes in through `shadcn` (a build-time CLI; the app only imports `shadcn/tailwind.css`) and `next-intl > @parcel/watcher`. Moving `shadcn` to `devDependencies` doesn't clear it, because the `next-intl` path stays. Neither path runs picomatch on untrusted input at runtime.

## Consequences

- The advisory stays hidden from CI until the ignore is removed.
- Remove the ignore once picomatch ships a patched version.
