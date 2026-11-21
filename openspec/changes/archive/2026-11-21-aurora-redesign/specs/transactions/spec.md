# Spec Delta

## MODIFIED Requirements

### Requirement: Daily list

The Transactions screen SHALL list the user's transactions grouped by day, newest day first, each group headed by its date in the current language.

#### Scenario: Grouping

- **GIVEN** two transactions on 16 November and one on 17 November
- **WHEN** the list opens
- **THEN** it shows a 17 November group with one item above a 16 November group with two

#### Scenario: Item

- **WHEN** the list shows a transaction
- **THEN** it shows the category with its icon and color, the note, and the amount with a plus sign for income and a minus sign for expenses, and the whole item opens its edit form

#### Scenario: Empty

- **WHEN** there are no transactions to show
- **THEN** an empty state invites the user to add one, with a button that opens the add form

## ADDED Requirements

### Requirement: Form controls

The transaction form SHALL pick the date from a calendar opened by a button that shows the chosen day, and the category from tiles showing each category's icon and name, one tap per pick.

#### Scenario: Pick a date

- **WHEN** the user opens the date button and picks 7 March 2026
- **THEN** the calendar closes and the button shows 7 March 2026 in the current language

#### Scenario: Pick a category

- **WHEN** the user taps the Transport tile
- **THEN** Transport is chosen, its tile marked by a ring and bold text, not by color alone

#### Scenario: Keyboard

- **WHEN** a keyboard user reaches the date button and the category tiles
- **THEN** the calendar opens and its days are reachable with the arrow keys, and the tiles work as one radio group
