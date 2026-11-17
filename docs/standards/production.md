# Common: Production Readiness

A checklist for every client project, whatever the stack, for the people who set it up. Projects keep it in `docs/standards/` as reference, so it doesn't load into agent sessions; the rules for code are in the stack and common rules files.

## Environments

- Each project has separate local, staging and production environments, each with its own database and secrets.
- Web apps get a preview per Pull Request; it uses the staging backend, or its own database branch where the stack creates one (Neon in Next.js).
- Staging mirrors the production configuration; production personal data never reaches other environments, and seed data is synthetic.
- Non-production web environments are protected (deployment protection or auth) and send `X-Robots-Tag: noindex`.

## Secrets

- Secrets live only in the platform's secret store, per environment: never in code, the repository or client bundles.
- CI scans the new commits of each Pull Request for live secrets with TruffleHog, as the stack's CI template does (GitHub secret scanning is paid on private repositories); a found secret is revoked, since deleting it leaves it in the history.

## Privacy

- The project README lists the personal data the app stores: where, why and for how long.
- Personal data past its retention period is deleted or anonymized by a scheduled job, including soft-deleted rows.
- A user's data can be exported and erased on request, including copies in file storage, email and monitoring tools; audit rows stay until their retention ends, since they record who did what, the erasure included.
- Non-essential cookies and scripts (session replay, chat widgets, embeds) load only after opt-in through a consent tool; analytics run without cookies until consent.
- Sentry's personal data collection is off: `Sentry.init` sets `dataCollection` with `userInfo`, `cookies`, `urlQueryParams` (it filters only auth- and token-like keys, so `?email=` would be sent), `databaseQueryData`, `queues` and the `genAI` inputs and outputs off, `httpBodies: []`, and `httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] }` for the IP headers (unset, Sentry 11 collects personal data); `@sentry/react-native`, on Sentry 10's core, keeps `sendDefaultPii: false`.
- For EU clients, vendors that process personal data use EU regions and have a signed DPA.

## Observability

- Every deploy, and in mobile apps every build and OTA update, sets the release and environment in error monitoring; source maps are uploaded to it and not served publicly.
- Each production project has an uptime check and alerts with a named owner.
- Server metrics and alerts cover request rate, errors and latency per route, queue depth and failed jobs, and DB pool saturation; on a self-hosted server, the uptime check hits the readiness endpoint.

## Backups and Recovery

- The database is managed with point-in-time recovery; RPO and RTO are agreed with the client and written in the project README.
- A restore into a separate environment is rehearsed at least once a quarter.
- Object storage has versioning; volumes on self-hosted platforms have scheduled backups stored off the host.

## Dependencies

- `pnpm-workspace.yaml` sets `trustPolicy: no-downgrade`, so an install fails when a package version has weaker publish trust evidence than its earlier releases, with `trustPolicyIgnoreAfter: 10080`, so the check covers only versions younger than 7 days (older ones, such as `semver@6.3.1` under `@babel/core`, predate provenance); an entry in `trustPolicyExclude` that the stack doesn't name is recorded as a deviation.
- The lockfile is committed; Node (LTS only) is pinned in `.nvmrc` and pnpm in `packageManager`.
- Dependencies are updated by a bot with a cooldown of at least 1 day (Renovate's `minimumReleaseAge`), so it doesn't propose versions younger than pnpm's own `minimumReleaseAge`, which fail the install when that is set explicitly; security updates go first.
- When `pnpm audit` fails: `pnpm audit --fix --audit-level=high`, which adds overrides to `pnpm-workspace.yaml` and a patch released inside the cooldown to `minimumReleaseAgeExclude`; an override that moves a package to another major is narrowed to that package (`"@node-minify/core>glob": "^10.5.0"`, not `glob@>=10.2.0 <10.5.0: ^12.0.0`). Without a fix in that major, or for code the app never runs (a CLI, Firestore's Node.js transport in React Native), the advisory goes in `audit.ignore` in `pnpm-workspace.yaml` with the reason in a comment. Both are removed once the package updates.

## CI and Releases

- `main` is protected: required CI checks and at least one approving review; no direct pushes.
- CI on every Pull Request: lint, typecheck, tests and build, plus the secret scan, `pnpm audit --prod --audit-level=high` and the standards check (the `peppernode/dev-standards` action, pinned to a commit).
- The GitHub dependency graph and Dependabot alerts are on: Renovate opens security update PRs only from those alerts. Dependabot security updates stay off while Renovate runs, or each fix comes twice; without the Renovate app they are on, since nothing else opens those PRs. A pnpm 12 repository whose Dependabot alerts list no dependencies refreshes them once (Security → Dependabot alerts → ⋯ → Refresh Dependabot alerts): GitHub's dependency graph read pnpm 12 lockfiles as empty before a fix.
- Renovate extends the stack's preset from the standards repository (`local>peppernode/dev-standards//stacks/<stack>/renovate`).
- Workflows set `permissions` to the minimum they need, per workflow or job (`contents: read` by default).
- Actions are pinned to a full commit SHA with the version in a comment; the Renovate preset pins and updates them.
- `pull_request_target` and `workflow_run` workflows never check out or run code from the Pull Request.
- Deploys and cloud access use OIDC where the platform supports it, not long-lived keys in secrets.
- The project README lists its critical user flows; each has an E2E test, run in CI.
- Before a release, the critical flows get a manual pass with a screen reader and keyboard or switch control; on mobile, with VoiceOver and TalkBack and an enlarged system font.
- Web projects have performance budgets from their stack rules, checked in CI or monitoring; mobile apps, the budgets in Mobile Releases.

## Mobile Releases (React Native)

- Cold-start time to interactive has a budget in the project README, measured with a release build on a named low-end Android reference device and tracked in Sentry's app start data.
- The per-platform JS bundle size has a budget, checked before each release: from `npx expo export` with Expo Atlas showing what grew, or `npx react-native bundle` in React Native (bare).
- JS-only changes may ship as OTA updates where the app has them (always with Expo, by choice with EAS Update in React Native (bare)); any native change, and every change of a bare app without OTA, requires a new store build.
- OTA updates carry only fixes and minor changes consistent with the reviewed binary (App Store Review Guideline 2.5.2); new features go through store review.
- An OTA update is published from CI to a preview channel first and tested there on a build identical to the store one.
- A production update rolls out by percentage (`eas update --rollout-percentage`) and is promoted to 100% only after its crash-free check in Sentry passes; a bad update is reverted with `eas update:revert-update-rollout` while its rollout is in progress, and rolled back with `eas update:rollback` after it reaches 100%.
- A store build goes to TestFlight and the Play internal testing track first and is verified as a release build on real iOS and Android devices, not only in a simulator.
- Store releases use App Store phased release and a Google Play staged rollout, halted on a regression.
- Crash-free users and the ANR rate have thresholds, at least as strict as Google Play's Android vitals bad behavior thresholds, and gate promoting an update or widening a store rollout; slow and frozen frames are reviewed before a rollout is widened.
- The privacy manifests (`ios.privacyManifests` or the bare app's `PrivacyInfo.xcprivacy`, and those of the SDKs) and the store data declarations are reviewed each release against what the app and its SDKs actually collect.
- The Expo SDK and build image, or React Native and the build machines' Xcode in a bare app, are upgraded before Apple's yearly minimum Xcode / SDK requirement for uploads and Google Play's yearly target API level deadline.
