# Tasks

## 1. Theme choice

- [x] 1.1 Replace the theme switch with a Light/Dark/System radio group named "Theme" wherever the switch shows; verify unit tests (picking, System by default) and the E2E theme test with the radio group, axe in both themes

## 2. Settings screen

- [x] 2.1 Add the `[locale]/(app)/settings` route and view with its title, theme, language and account (email, sign out) sections, translated; verify with E2E in both languages and the signed-out redirect
- [x] 2.2 Add the danger zone with the delete account control at the end of Settings; verify the E2E delete account tests (password, wrong password) run from Settings

## 3. Account panel

- [x] 3.1 Add the account button (avatar, email) and panel (email, Settings, theme, language, sign out): a popover in the sidebar, a bottom sheet in the phone top bar; verify E2E at 360 and 1440 px, Escape returns focus to the button
- [x] 3.2 Remove language, theme, sign out and delete account from the sidebar and the phone top bar, and the old account menu; verify the E2E helpers and navigation tests use the panel, axe in both themes at 360 and 1440 px
