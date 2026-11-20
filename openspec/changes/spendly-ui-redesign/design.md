# Design

## Context

One home page (`src/views/home/home-page.tsx`) holds everything; the theme is shadcn's neutral one. Wireframes: [wireframes.md](wireframes.md).

## Decisions

- Routes: `/{locale}` Overview (`period`, `date`), `/{locale}/transactions` (`period`, `date`, `edit`), `/{locale}/categories`. `/{locale}?edit=` redirects to Transactions with its params.
- One breakpoint, `lg` (1024 px): below it a top bar (name, language, theme, sign out) and a fixed bottom nav, with bottom padding and `scroll-padding` so it covers nothing; from it a sidebar.
- Nav is a client leaf in `Suspense` that copies `period` and `date` into the Overview and Transactions links; `aria-current="page"` plus a bold label and an indicator bar.
- Sheet: Base UI `Drawer` below `lg` (swipe to close is built in), `Dialog` from `lg`, both as shadcn components in `shared/ui`. The Add button holds open state; `edit` lives in the URL. The add form's `key` includes `today` (pitfall).
- Motion, CSS first: `ViewTransition` around the page content (crossfade + 8 px slide), around list items (`enter`/`exit`) and around each total keyed by its value; sheet/dialog via the components' CSS. One `prefers-reduced-motion` block turns off `::view-transition-*` and animation durations. Motion (the library) isn't needed: no custom gestures.
- Type scale: page `h1` `text-2xl`/`lg:text-3xl`, section `text-lg`, body `text-base`, meta `text-sm`; amounts `tabular-nums`. Spacing: `gap-4`/`gap-6`; sections in `Card`. Icons: lucide, decorative ones `aria-hidden`.
- Focus ring: solid `ring` (not `ring/50`) in `globals.css` and `shared/ui`, so it reaches 3:1. The same solid `ring` on the destructive button (not `ring-destructive/20`) and on a focused invalid field (whose `ring-destructive/20` would otherwise hide focus); the primary button adds a 2 px `ring-offset-background`, since a teal ring on a teal button only looks like a bigger button. Primary hover uses a `primary-hover` token (15% `foreground` mixed into `primary`) instead of `primary/80`, which drops white text to 3.6:1.
- Dependencies: none new. Added shadcn components: `card`, `drawer`, `dialog`.

## Brand accent

`ring` = `primary`; text on primary is `oklch(0.985 0 0)` in light, `oklch(0.145 0 0)` in dark. Ratios are WCAG 2 against background (light `#fff`, dark `oklch(0.145 0 0)`) and dark card (`oklch(0.205 0 0)`).

| Option                 | Light `primary`        | Text on it | On background | Dark `primary`         | Text on it | On background / card |
| ---------------------- | ---------------------- | ---------- | ------------- | ---------------------- | ---------- | -------------------- |
| **Teal (recommended)** | `oklch(0.51 0.09 182)` | 5.25       | 5.48          | `oklch(0.78 0.12 182)` | 10.41      | 10.41 / 9.43         |
| Indigo                 | `oklch(0.51 0.22 277)` | 5.99       | 6.26          | `oklch(0.76 0.11 277)` | 9.05       | 9.05 / 8.19          |
| Tangerine              | `oklch(0.55 0.17 40)`  | 5.02       | 5.24          | `oklch(0.78 0.14 55)`  | 9.52       | 9.52 / 8.62          |

- Teal: calm "money" hue, far from the red of `destructive`, not the default indigo look. Indigo is the safe generic; tangerine is the warmest but sits next to `destructive`.
- Charts (teal): `chart-1..5` light `0.85/0.07`, `0.60/0.10`, `0.51/0.09`, `0.43/0.075`, `0.35/0.06`; dark `0.88/0.07`, `0.72/0.115`, `0.62/0.10`, `0.52/0.09`, `0.42/0.075` (L/C, hue 182). The bars' `chart-2`: 3.75:1 on white, 7.61:1 on dark card.
- `sidebar-primary`/`sidebar-ring` follow `primary`; neutrals stay, so the `muted` pitfall is unchanged.

## Risks / Trade-offs

- Sheet + dialog + nav add client JS → measure each route with `next build` output; keep the chart lazy.
- Fixed bottom nav over focused fields → `scroll-padding-bottom`, E2E Tab check on a phone viewport.
- View transitions in Chromium-only test runs → E2E checks results, not animations; reduced motion is emulated in one test.
