# periods Specification

## Purpose

The period the main page shows: a day, week, month or year the user picks and steps through.

## Requirements

### Requirement: Period type

The user SHALL pick a day, week, month or year period on the Overview and Transactions screens; the current month SHALL be the default, by today in the user's time zone.

#### Scenario: Default

- **WHEN** the Overview or Transactions screen opens without a chosen period
- **THEN** it shows the current month

#### Scenario: Switch type

- **WHEN** the user picks week
- **THEN** it shows the current week, Monday to Sunday, in either language

### Requirement: Step between periods

The user SHALL step to the previous or next period of the same type and return to the current one.

#### Scenario: Previous month

- **WHEN** November 2026 is shown and the user steps back
- **THEN** October 2026 is shown

#### Scenario: Back to current

- **WHEN** a past period is shown and the user picks the current-period control
- **THEN** the period containing today is shown

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
