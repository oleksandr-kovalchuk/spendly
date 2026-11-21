# transactions Specification

## Purpose

Income and expense records a user adds, edits and deletes, shown as a list grouped by day.

## Requirements

### Requirement: Add transaction

A user SHALL add an income or expense with an amount, a category of the same type, a date and an optional note of up to 200 characters.

#### Scenario: Add expense

- **WHEN** the user presses Add and saves an expense of 125.50 in Food for today
- **THEN** the form closes and the expense shows on the Transactions screen under today as a minus amount in Food

#### Scenario: Form defaults

- **WHEN** the add form opens
- **THEN** the type is expense, the date is today in the user's time zone, and the category list shows only expense categories

#### Scenario: Invalid amount

- **WHEN** the amount is empty, zero, negative, above 999,999,999.99 or has more than 2 decimals
- **THEN** an error shows next to the amount field, the form stays open and nothing is saved

### Requirement: Edit transaction

A user SHALL change any field of their transaction.

#### Scenario: Edit amount and date

- **WHEN** the user opens a transaction from the list, changes its amount and date, and saves
- **THEN** the form closes and the list shows the new amount under the new day

### Requirement: Delete transaction

A user SHALL delete their transaction from its edit form after confirming.

#### Scenario: Confirmed

- **WHEN** the user opens a transaction, presses Delete and confirms
- **THEN** the form closes, the transaction disappears from the list, and it stays gone after a reload

#### Scenario: Cancelled

- **WHEN** the user cancels the confirmation
- **THEN** the transaction stays and its form stays open

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

### Requirement: Money amounts

Amounts SHALL be stored exactly, in kopecks, and shown in hryvnias (UAH) with the current language's number format.

#### Scenario: Format

- **WHEN** the user adds 1234.5
- **THEN** it shows as 1,234.50 in English and 1 234,50 in Ukrainian, with the hryvnia sign or code

### Requirement: Transaction ownership

A user SHALL see, edit and delete only their own transactions.

#### Scenario: Another user's transaction

- **WHEN** a user opens, edits or deletes another user's transaction by its ID
- **THEN** the 404 page shows or the request is rejected, and nothing changes

### Requirement: Transaction sheet

Adding and editing SHALL happen in one form that opens over the current screen: a bottom sheet below 1024 px, a dialog from 1024 px. It SHALL trap focus, close with Escape or its close button, and return focus to the control that opened it.

#### Scenario: Open from any screen

- **WHEN** the user presses Add on the Overview, Transactions or Categories screen
- **THEN** the add form opens over that screen, and the screen stays as it was after saving or closing

#### Scenario: Close

- **WHEN** the user presses Escape in the open form
- **THEN** it closes without saving and focus returns to the Add button

#### Scenario: Linkable edit

- **WHEN** the user opens a URL of the Transactions screen with a transaction to edit
- **THEN** the screen opens with that transaction's form open, and closing it removes the transaction from the URL and keeps the period

#### Scenario: Old edit link

- **WHEN** the user opens the home page URL with a transaction to edit
- **THEN** the Transactions screen opens with that transaction's form open and the same period

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
