# Spec Delta

## MODIFIED Requirements

### Requirement: Daily list

The Transactions screen SHALL list the user's transactions grouped by day, newest day first, each group headed by its date in the current language; days below the screen SHALL rise into place as they scroll in.

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

#### Scenario: Scrolling

- **WHEN** the user scrolls a long list
- **THEN** each day rises into place as it comes into view, and its text never fades
