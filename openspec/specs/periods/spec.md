# periods Specification

## Purpose

The period the main page shows: a day, week, month or year the user picks and steps through.

## Requirements

### Requirement: Period type

The user SHALL pick a day, week, month or year period on the Overview and Transactions screens from a menu opened by the shown period's name; the current month SHALL be the default, by today in the user's time zone.

#### Scenario: Default

- **WHEN** the Overview or Transactions screen opens without a chosen period
- **THEN** it shows the current month

#### Scenario: Switch type

- **WHEN** the user opens the period menu and picks week
- **THEN** it shows the current week, Monday to Sunday, in either language, and the menu closes

#### Scenario: Compact row

- **WHEN** the Overview screen opens on a 360 px wide screen
- **THEN** the period takes one row: previous, the period's name, next

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

### Requirement: Period scope

The transaction list and stats SHALL include only transactions dated within the shown period, and its label SHALL name it in the current language.

#### Scenario: Week scope

- **GIVEN** transactions on 15 and 16 November 2026
- **WHEN** the week of 16 to 22 November 2026 is shown
- **THEN** only the 16 November transaction is listed, under a label naming that week

### Requirement: Linkable period

The shown period SHALL be kept in the URL, without the default, and SHALL stay when the user moves between the Overview and Transactions screens; an invalid period in the URL SHALL fall back to the default.

#### Scenario: Shared link

- **WHEN** the user opens the URL of a shown week in a new tab
- **THEN** the same week is shown

#### Scenario: Switch screen

- **WHEN** October 2026 is shown on Overview and the user opens Transactions from the navigation
- **THEN** Transactions shows October 2026

#### Scenario: Invalid value

- **WHEN** the URL has an unknown period type or an invalid date
- **THEN** the current month is shown
