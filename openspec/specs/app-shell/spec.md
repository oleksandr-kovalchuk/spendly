# app-shell Specification

## Purpose

The frame every page shares: layout, navigation, theme and language, usable on phones first.

## Requirements

### Requirement: Language

The app SHALL be available in English and Ukrainian, with the language as the first URL path segment.

#### Scenario: First visit

- **WHEN** a visitor opens `/` and the browser prefers Ukrainian
- **THEN** they land on `/uk`

#### Scenario: Other browser language

- **WHEN** a visitor opens `/` and the browser prefers neither English nor Ukrainian
- **THEN** they land on `/en`

#### Scenario: Switch language

- **WHEN** the user picks the other language in the account panel, on the Settings screen or on a signed-out page
- **THEN** the same page opens in that language, and all UI text, dates, numbers and `<html lang>` follow it

### Requirement: Theme

The app SHALL offer Light, Dark and System themes as one choice, follow the device theme while System is picked (the default), and remember the choice on the device.

#### Scenario: System by default

- **GIVEN** the user has not picked a theme
- **WHEN** the device uses a dark theme
- **THEN** the app is dark and System is the picked option

#### Scenario: Choice remembered

- **WHEN** the user picks Dark and reloads the page
- **THEN** the page is dark from the first paint, without a flash of light colors

#### Scenario: Switch

- **WHEN** a screen reader user reaches the theme control
- **THEN** it is announced as a group named "Theme" with three options, Light, Dark and System, and the picked one checked

### Requirement: Mobile-first layout

Every page SHALL fit a 360 px wide screen without horizontal scrolling and SHALL use wider screens without stretching content edge to edge.

#### Scenario: Phone

- **WHEN** any page opens on a 360 px wide screen
- **THEN** all content and controls fit the width, tap targets are at least 24x24 px, and the bottom navigation covers no content or focused control

#### Scenario: Desktop

- **WHEN** a signed-in screen opens on a 1440 px wide screen
- **THEN** the sidebar sits at the start edge and the content uses the rest of the width in cards and columns of readable width

#### Scenario: Signed-out desktop

- **WHEN** the sign-in, sign-up or a password page opens on a 1440 px wide screen
- **THEN** a brand panel sits at the start and the form stays in a column of readable width beside it

#### Scenario: Signed-out phone

- **WHEN** the sign-in page opens on a 360 px wide screen
- **THEN** a short brand banner shows above the form and the form fits the width

### Requirement: Accessible pages

Every page SHALL be keyboard operable, have one `h1` and a unique title, and pass automated accessibility checks.

#### Scenario: Keyboard

- **WHEN** the user presses Tab on a fresh page
- **THEN** the first focus is a skip link to the main content, and every control is reachable with a visible focus ring

#### Scenario: Automated check

- **WHEN** an automated accessibility check runs on any page in either theme
- **THEN** it reports no violations

### Requirement: Not found page

An unknown URL or an unavailable resource SHALL show a 404 page in the current language with a link to the home page.

#### Scenario: Unknown URL

- **WHEN** the user opens `/en/no-such-page`
- **THEN** a 404 page in English opens with a link home

### Requirement: App navigation

A signed-in user SHALL move between the Overview, Transactions and Categories screens from a navigation that marks the current screen; signed-out pages SHALL show no app navigation.

#### Scenario: Phone

- **WHEN** a signed-in user opens any screen on a 360 px wide screen
- **THEN** a bottom navigation shows Overview, Transactions, Categories and an Add button, and stays in view while the page scrolls

#### Scenario: Desktop

- **WHEN** a signed-in user opens any screen on a 1024 px or wider screen
- **THEN** a sidebar shows the same items, the Add button and the account button, and no bottom navigation shows

#### Scenario: Current screen

- **WHEN** the user is on the Transactions screen
- **THEN** its navigation item is marked as the current page for screen readers and visually, not by color alone

#### Scenario: Signed out

- **WHEN** a visitor opens the sign-in page
- **THEN** no app navigation shows

### Requirement: Brand color

The app SHALL use one brand accent color, in light and dark variants, for primary actions, focus rings, the current navigation item and charts, with WCAG AA contrast in both themes. Primary actions and the balance card SHALL use the brand gradient, with text on it at least 4.5:1 against every part of the gradient behind it.

#### Scenario: Primary button

- **WHEN** a primary button shows in either theme
- **THEN** its text has at least 4.5:1 contrast with its background

#### Scenario: Focus ring

- **WHEN** a control has keyboard focus in either theme
- **THEN** its focus ring has at least 3:1 contrast with the surface around it

#### Scenario: Balance card

- **WHEN** the balance card shows in either theme
- **THEN** its text has at least 4.5:1 contrast with the gradient behind it

### Requirement: Motion

Screen changes, list additions and removals, sheets and dialogs, and changing totals SHALL animate briefly, a new theme SHALL spread over the page in a circle from the option that picked it, every page's content SHALL enter with the same short staggered rise, decorative motion SHALL end within 5 seconds, and nothing SHALL animate when the device asks for reduced motion.

#### Scenario: Screen change

- **WHEN** the user moves from Overview to Transactions
- **THEN** the content changes with a short transition and the navigation does not move

#### Scenario: Theme change

- **WHEN** the user picks another theme
- **THEN** the new theme spreads over the whole page, navigation included, in a circle growing from the picked option

#### Scenario: Page entrance

- **WHEN** any page opens, signed in or out
- **THEN** its main blocks rise in one after another with the same timing on every page

#### Scenario: Decorative motion ends

- **WHEN** the balance card or the brand panel shows a shine or drift
- **THEN** it stops within 5 seconds of the page opening

#### Scenario: Reduced motion

- **GIVEN** the device asks for reduced motion
- **WHEN** the user changes screens or the theme, adds a transaction or opens a dialog
- **THEN** the change happens without movement

### Requirement: Public footer

Signed-out pages SHALL end with a footer that shows the privacy policy link at the start and the copyright with the current year at the end.

#### Scenario: Footer

- **WHEN** a visitor opens the sign-in page in 2026
- **THEN** the footer shows the privacy policy link at the start and "© 2026 Spendly" at the end, in the current language

### Requirement: Account panel

A signed-in user SHALL open an account panel from one account button, at the end of the sidebar on wide screens and in the top bar on phones; it SHALL show the account's email, a link to Settings, the theme and language controls, and sign out.

#### Scenario: Desktop

- **WHEN** a signed-in user presses the account button in the sidebar on a 1440 px wide screen
- **THEN** a panel opens next to it with the email, Settings, theme, language and sign out

#### Scenario: Phone

- **WHEN** a signed-in user presses the account button in the top bar on a 360 px wide screen
- **THEN** a sheet slides up from the bottom with the same contents

#### Scenario: Keyboard

- **WHEN** the panel is open and the user presses Escape
- **THEN** it closes and focus returns to the account button
