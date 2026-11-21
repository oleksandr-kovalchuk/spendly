# Tasks

## 1. Style foundation

- [x] 1.1 Add aurora, income, expense, category palette and shadow tokens for both themes, plus `bg-aurora`, `shadow-soft`, entrance and shine utilities with reduced-motion fallbacks; check AA contrast of every text color on its surface
- [x] 1.2 Restyle `shared/ui` button (gradient primary), card (soft shadow, larger radius) and input; add the shadcn popover with solid focus rings
- [x] 1.3 Add the category look (icon and color per default key, hashed color for own categories) with unit tests

## 2. Shell

- [x] 2.1 Restyle the sidebar, phone top bar and a floating glass bottom navigation with the gradient Add button
- [x] 2.2 Restyle the public shell and add the footer with the privacy link and "© year Spendly" in both languages

## 3. Overview and period

- [x] 3.1 Replace the period buttons with the compact row and period menu; update unit tests
- [x] 3.2 Balance-first totals on the gradient card with income, expenses and share of income spent; update unit tests
- [x] 3.3 Replace the Recharts chart with the colored stacked bar and legend; remove `recharts`
- [x] 3.4 Add the latest transactions block with a link to Transactions for the same period

## 4. Lists and signed-out pages

- [x] 4.1 Show category icon and color in the transaction list and on Categories; color income amounts
- [x] 4.2 Brand panel layout for sign-in, sign-up, forgot and reset password; restyle privacy, 404 and error pages
- [x] 4.3 Same staggered entrance on every page

## 5. Checks

- [x] 5.1 Update E2E tests for the period menu, totals and footer; run typecheck, lint, unit tests, unused and build
- [x] 5.2 Check every page at 360 and 1440 px in both themes, keyboard only, and with reduced motion

## 6. Form controls

- [x] 6.1 Replace the native date input with a lazily loaded calendar in a popover (shadcn `calendar`, react-day-picker)
- [x] 6.2 Replace the native category select with icon tiles (a radio group); remove the unused `native-select`
- [x] 6.3 Update unit and E2E tests; run typecheck, lint, unit tests, unused, build and E2E
