# Proposal

## Why

The app works, but changes on screen happen all at once and the spending chart is a flat bar. Small, purposeful motion makes changes easier to follow.

## What Changes

- A new theme spreads over the page in a circle from the picked option
- The balance's digits roll to a new value
- Spending by category becomes a ring with the total in its middle; pointing at a category shows it there
- Stepping between periods slides the content toward the new period; on touch screens a sideways swipe steps too
- Days in the transaction list rise into place as they scroll in

Out of scope: new data or screens, other charts, motion that ignores reduced motion.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: a theme change animates
- `stats`: rolling balance digits; the spending chart is a ring
- `periods`: directional slide and swipe between periods
- `transactions`: days rise in as the list scrolls
