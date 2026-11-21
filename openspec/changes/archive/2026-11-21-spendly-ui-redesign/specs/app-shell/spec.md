# Spec Delta

## ADDED Requirements

### Requirement: App navigation

A signed-in user SHALL move between the Overview, Transactions and Categories screens from a navigation that marks the current screen; signed-out pages SHALL show no app navigation.

#### Scenario: Phone

- **WHEN** a signed-in user opens any screen on a 360 px wide screen
- **THEN** a bottom navigation shows Overview, Transactions, Categories and an Add button, and stays in view while the page scrolls

#### Scenario: Desktop

- **WHEN** a signed-in user opens any screen on a 1024 px or wider screen
- **THEN** a sidebar shows the same items, the Add button, the language and theme switchers and sign out, and no bottom navigation shows

#### Scenario: Current screen

- **WHEN** the user is on the Transactions screen
- **THEN** its navigation item is marked as the current page for screen readers and visually, not by color alone

#### Scenario: Signed out

- **WHEN** a visitor opens the sign-in page
- **THEN** no app navigation shows

### Requirement: Brand color

The app SHALL use one brand accent color, in light and dark variants, for primary actions, focus rings, the current navigation item and charts, with WCAG AA contrast in both themes.

#### Scenario: Primary button

- **WHEN** a primary button shows in either theme
- **THEN** its text has at least 4.5:1 contrast with its background

#### Scenario: Focus ring

- **WHEN** a control has keyboard focus in either theme
- **THEN** its focus ring has at least 3:1 contrast with the surface around it

### Requirement: Motion

Screen changes, list additions and removals, sheets and dialogs, and changing totals SHALL animate briefly, and SHALL NOT animate when the device asks for reduced motion.

#### Scenario: Screen change

- **WHEN** the user moves from Overview to Transactions
- **THEN** the content changes with a short transition and the navigation does not move

#### Scenario: Reduced motion

- **GIVEN** the device asks for reduced motion
- **WHEN** the user changes screens, adds a transaction or opens a dialog
- **THEN** the change happens without movement

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

- **WHEN** the user picks the other language in the top bar or the sidebar
- **THEN** the same page opens in that language, and all UI text, dates, numbers and `<html lang>` follow it

### Requirement: Mobile-first layout

Every page SHALL fit a 360 px wide screen without horizontal scrolling and SHALL use wider screens without stretching content edge to edge.

#### Scenario: Phone

- **WHEN** any page opens on a 360 px wide screen
- **THEN** all content and controls fit the width, tap targets are at least 24x24 px, and the bottom navigation covers no content or focused control

#### Scenario: Desktop

- **WHEN** a signed-in screen opens on a 1440 px wide screen
- **THEN** the sidebar sits at the start edge and the content uses the rest of the width in cards and columns of readable width

#### Scenario: Signed-out desktop

- **WHEN** the sign-in page opens on a 1440 px wide screen
- **THEN** the form stays in a centered column of readable width
