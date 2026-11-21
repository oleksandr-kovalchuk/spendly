# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
