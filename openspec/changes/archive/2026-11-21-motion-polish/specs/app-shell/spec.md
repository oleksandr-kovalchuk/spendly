# Spec Delta

## MODIFIED Requirements

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
