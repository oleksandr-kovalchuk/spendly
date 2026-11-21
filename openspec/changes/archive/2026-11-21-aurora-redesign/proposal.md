# Proposal

## Why

The app looks plain: equal cards, one color, a period picker that takes the top of every screen, and the balance doesn't stand out. It should look premium, for daily use and the portfolio.

## What Changes

- "Aurora" style everywhere: a violet gradient for the balance card and primary actions, soft shadows, category colors and icons, in light and dark themes
- Overview leads with a large balance on the gradient card, income and expenses under it, and the share of income spent; then spending by category as one colored bar, then the latest transactions
- A compact period row (previous, period name, next); the name opens a menu with day, week, month, year and the current period
- Sign-in, sign-up and password pages get a brand panel beside the form; every page shares the same entrance animation
- The public footer shows the privacy link at the start and "© year Spendly" at the end

Out of scope: new data, editable category colors or icons, new screens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: aurora brand style, shared entrance motion, signed-out layout, public footer
- `periods`: compact period row and menu
- `stats`: balance-first totals, colored category bar, latest transactions
- `transactions`: list items show the category's icon and color; the form picks the date from a calendar and the category from icon tiles
- `categories`: each category has a color and icon used on every screen
