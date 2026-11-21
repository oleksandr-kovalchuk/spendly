# Design

## Style tokens

The gradient, income and expense colors, category palette and soft shadows are theme tokens in `globals.css`, with light and dark values; utilities (`bg-aurora`, `shadow-soft`, `animate-rise`, `stagger`) keep feature code free of `dark:` and arbitrary colors. The gradient's stops are dark enough that white text passes 4.5:1 on each of them.

## Category look

No new columns: default categories map their key to a fixed icon and color; a user's own category gets the tag icon and a palette color picked by a hash of its id, so it is stable without storage.

## Spending bar

One stacked bar of plain elements with inline widths replaces the Recharts chart: a single bar needs no chart library, and dropping it removes the lazy chart bundle. The legend table stays the accessible source of the data.

## Period menu

A Base UI popover (shadcn `popover`) opened by the period name holds the four type buttons (`aria-pressed`, as today) and the current-period button; the previous and next buttons stay in the row.

## Footer year

A `"use cache"` component with `cacheLife("days")` returns the year, so signed-out pages stay prerendered.

## Motion

Entrance and shine are CSS, inside `prefers-reduced-motion: no-preference`; the shine runs twice and the brand panel's drift once, both under 5 seconds (WCAG 2.2.2).
