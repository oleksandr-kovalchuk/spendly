# Tasks

Every part: one PR; UI text in English and Ukrainian; checked in a browser at 360 and 1440 px in both themes; axe E2E passes; `pnpm lint`, `typecheck`, `test`, `unused` and `build` pass; each route's initial JS stays within 200 KB (compressed), noted in the PR. No new dependencies.

## 1. Brand accent and focus ring

Boundaries: theme tokens in `globals.css` (teal `primary`, `ring`, `chart-*`, `sidebar-*`) and a solid focus ring; no layout or component changes.

How to check:

1. Open the preview: primary buttons and chart bars are teal.
2. Switch to dark: the teal is lighter and text stays readable.
3. Press Tab through the page: every control shows a clear teal focus ring.

- [x] 1.1 Set the teal tokens for light and dark from design.md; verify the axe E2E in both themes passes
- [x] 1.2 Use the solid `ring` instead of `ring/50` in `globals.css` and `shared/ui`; verify in the browser in both themes

## 2. Screens and navigation

Boundaries: Overview (period, totals, chart) and Transactions (period, the current inline form, list) screens; top bar and bottom nav below 1024 px, sidebar from 1024 px; period kept between screens; screen transitions; no sheet yet.

How to check:

1. On a phone, use the bottom nav: Overview shows totals and chart, Transactions the list.
2. Step to October on Overview, open Transactions: it shows October.
3. On a desktop, the sidebar replaces the bottom nav and marks the current screen.

- [x] 2.1 Add the `/[locale]/transactions` route with period, form and list, leave period and stats on Overview, redirect `/?edit=` with its params; verify the existing E2E tests on the new route and an E2E redirect test
- [x] 2.2 Add the top bar, bottom nav and sidebar with lucide icons, `aria-current` and the period in the links, plus bottom padding and `scroll-padding`; verify a component test of the period links and an E2E Tab test at 360 and 1440 px
- [x] 2.3 Add the page `ViewTransition` and the reduced-motion CSS; verify in the browser and an E2E screen change with reduced motion emulated

## 3. Add and edit in a sheet

Boundaries: Add button in the bottom nav and sidebar; bottom sheet below 1024 px and dialog from 1024 px for add and edit; delete inside the edit form; list add/remove animation; the inline form and row buttons go away.

How to check:

1. On a phone, tap + on Overview and add an expense: the sheet closes and the totals change.
2. On Transactions, tap an item, change its amount and save; delete another and confirm.
3. On a desktop, Add opens a dialog; Escape closes it and focus returns to Add.

- [ ] 3.1 Add the shadcn `drawer` and `dialog` (Base UI) and a responsive transaction sheet; verify a component test of Escape and focus return
- [ ] 3.2 Open the add form from the nav Add button on every screen, keyed by `today`; verify an E2E add from Overview that updates the totals
- [ ] 3.3 Make each list item a link to `?edit=`, move edit and delete into the sheet, remove the inline form; verify E2E edit and delete, closing keeps the period, and axe with the sheet open after its animation ends
- [ ] 3.4 Animate list items in and out with `ViewTransition`; verify in the browser, and none with reduced motion

## 4. Cards, type and empty states

Boundaries: cards, type scale and spacing on all screens and auth pages; desktop columns (three totals, two category lists); icons in list items; empty states with an Add button; animated totals; no behavior changes beyond the specs.

How to check:

1. On a desktop, Overview shows three totals cards in a row and Categories two columns.
2. Pick an empty month: the list and the chart show empty states with an Add button.
3. Add an expense from Overview: the totals change with a short animation.

- [ ] 4.1 Add the shadcn `card` and apply the type scale, spacing and cards to every screen and the auth pages; verify axe at 360 and 1440 px in both themes and languages
- [ ] 4.2 Add income/expense icons to list items (signs stay) and empty states whose button opens the add form; verify a component test of the empty-state button
- [ ] 4.3 Animate each total with a `ViewTransition` keyed by its value, without a live region; verify an E2E totals update with and without reduced motion

## Workflow follow-up

- Archive the change after part 4 merges (`openspec-archive-change`); `openspec/specs/` then holds the updated `app-shell`, `transactions`, `periods` and `stats`.
