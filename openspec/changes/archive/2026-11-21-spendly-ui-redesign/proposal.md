# Proposal

## Why

The home page stacks the add form, period, totals, chart and list in one column: too much at once, hard to scan on a phone and a stretched column on desktop.

## What Changes

- Three screens: Overview (period, totals, chart), Transactions (period, list by day), Categories
- Phones: bottom navigation with a central Add button; desktop (≥1024 px): a sidebar
- Add and edit in one bottom sheet (phones) or dialog (desktop); delete moves into it
- Teal brand accent through theme tokens; type scale, cards, empty states, icons
- Motion: screen transitions, list add/remove, sheet/dialog, changing totals; off with reduced motion
- Four parts, one PR each

Wireframes: [wireframes.md](wireframes.md). Accent options, contrast and dependencies: [design.md](design.md).

Out of scope: new features (budgets, export, category icons or colors, search), new dependencies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: navigation, layout per screen size, brand color, motion
- `transactions`: add/edit in a sheet or dialog, list on its own screen
- `periods`: period shared by two screens
- `stats`: totals and chart on the overview screen

## Impact

UI only: `src/views`, `src/features`, `src/shared/ui`, `globals.css`. No data, auth or action changes.
