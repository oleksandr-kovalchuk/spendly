# Spec Delta

## MODIFIED Requirements

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

Screen changes, list additions and removals, sheets and dialogs, and changing totals SHALL animate briefly, every page's content SHALL enter with the same short staggered rise, decorative motion SHALL end within 5 seconds, and nothing SHALL animate when the device asks for reduced motion.

#### Scenario: Screen change

- **WHEN** the user moves from Overview to Transactions
- **THEN** the content changes with a short transition and the navigation does not move

#### Scenario: Page entrance

- **WHEN** any page opens, signed in or out
- **THEN** its main blocks rise in one after another with the same timing on every page

#### Scenario: Decorative motion ends

- **WHEN** the balance card or the brand panel shows a shine or drift
- **THEN** it stops within 5 seconds of the page opening

#### Scenario: Reduced motion

- **GIVEN** the device asks for reduced motion
- **WHEN** the user changes screens, adds a transaction or opens a dialog
- **THEN** the change happens without movement

## ADDED Requirements

### Requirement: Public footer

Signed-out pages SHALL end with a footer that shows the privacy policy link at the start and the copyright with the current year at the end.

#### Scenario: Footer

- **WHEN** a visitor opens the sign-in page in 2026
- **THEN** the footer shows the privacy policy link at the start and "© 2026 Spendly" at the end, in the current language
