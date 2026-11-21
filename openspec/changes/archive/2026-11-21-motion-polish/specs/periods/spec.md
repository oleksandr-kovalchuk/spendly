# Spec Delta

## MODIFIED Requirements

### Requirement: Step between periods

The user SHALL step to the previous or next period of the same type, also by swiping sideways on a touch screen, and return to the current one from the period menu; the shown period's content SHALL slide toward the side of the period it moves to.

#### Scenario: Previous month

- **WHEN** November 2026 is shown and the user steps back
- **THEN** October 2026 is shown

#### Scenario: Back to current

- **WHEN** a past period is shown and the user picks the current-period item in the period menu
- **THEN** the period containing today is shown

#### Scenario: Direction

- **WHEN** the user steps to the next period
- **THEN** the content slides out to the left and the next period's comes in from the right, and the other way round for the previous period

#### Scenario: Swipe

- **GIVEN** a touch screen
- **WHEN** the user swipes the content left
- **THEN** the next period shows, and a swipe right shows the previous one
