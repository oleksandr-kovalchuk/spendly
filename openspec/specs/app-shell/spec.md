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

- **WHEN** the user picks the other language in the header
- **THEN** the same page opens in that language, and all UI text, dates, numbers and `<html lang>` follow it

### Requirement: Theme

The app SHALL offer light, dark and system themes and remember the choice on the device.

#### Scenario: System by default

- **GIVEN** the user has not picked a theme
- **WHEN** the device uses a dark theme
- **THEN** the app is dark

#### Scenario: Choice remembered

- **WHEN** the user picks dark and reloads the page
- **THEN** the page is dark from the first paint, without a flash of light colors

### Requirement: Mobile-first layout

Every page SHALL fit a 360 px wide screen without horizontal scrolling and SHALL use wider screens without stretching content edge to edge.

#### Scenario: Phone

- **WHEN** any page opens on a 360 px wide screen
- **THEN** all content and controls fit the width, and tap targets are at least 24x24 px

#### Scenario: Desktop

- **WHEN** a page opens on a 1440 px wide screen
- **THEN** content stays in a centered column of readable width

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
