# Design

## Context

Today's phone account menu is a Base UI Popover; the add sheet is a Base UI Drawer. The theme is a light/dark switch over `next-themes`, which already runs with `enableSystem`.

## Decisions

- **Popover, not a dropdown menu.** The panel holds a radio group and language links, which an ARIA menu can't contain; a popover allows them and needs no new dependency. A dropdown with a theme submenu was rejected: a new component and the theme two levels deep.
- **One panel content, two containers.** The same content component renders in a Popover from the sidebar and in a bottom Drawer from the phone top bar.
- **Avatar.** The email's first letter on the brand gradient; no photos.
- **Theme control.** Native radios in a fieldset with the legend "Theme", styled as segments: icons with accessible names in the panel and the signed-out top bar, icons and labels on Settings. Like today's switch, it shows a skeleton until hydration.
- **Settings.** Route `[locale]/(app)/settings`, view `views/settings`; the existing delete account control moves there unchanged, inside its own `Suspense`.
- **Email in the shell.** Read through the cached current user inside `Suspense`, with a skeleton the size of the account button.

## Risks / Trade-offs

- [E2E finds sign out and delete account in the sidebar] → the shared helper opens the account panel on every width; delete account tests go through Settings.
