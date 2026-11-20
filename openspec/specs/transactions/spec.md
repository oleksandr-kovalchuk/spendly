# transactions Specification

## Purpose

Income and expense records a user adds, edits and deletes, shown as a list grouped by day.

## Requirements

### Requirement: Add transaction

A user SHALL add an income or expense with an amount, a category of the same type, a date and an optional note of up to 200 characters.

#### Scenario: Add expense

- **WHEN** the user adds an expense of 125.50 in Food for today
- **THEN** it shows in the list under today as a minus amount in Food

#### Scenario: Form defaults

- **WHEN** the add form opens
- **THEN** the type is expense, the date is today in the user's time zone, and the category list shows only expense categories

#### Scenario: Invalid amount

- **WHEN** the amount is empty, zero, negative, above 999,999,999.99 or has more than 2 decimals
- **THEN** an error shows next to the amount field and nothing is saved

### Requirement: Edit transaction

A user SHALL change any field of their transaction.

#### Scenario: Edit amount and date

- **WHEN** the user opens a transaction, changes its amount and date, and saves
- **THEN** the list shows the new amount under the new day

### Requirement: Delete transaction

A user SHALL delete their transaction after confirming.

#### Scenario: Confirmed

- **WHEN** the user deletes a transaction and confirms
- **THEN** it disappears from the list and stays gone after a reload

#### Scenario: Cancelled

- **WHEN** the user cancels the confirmation
- **THEN** the transaction stays

### Requirement: Daily list

The main page SHALL list the user's transactions grouped by day, newest day first, each group headed by its date in the current language.

#### Scenario: Grouping

- **GIVEN** two transactions on 16 November and one on 17 November
- **WHEN** the list opens
- **THEN** it shows a 17 November group with one item above a 16 November group with two

#### Scenario: Item

- **WHEN** the list shows a transaction
- **THEN** it shows the category, the note, and the amount with a plus sign for income and a minus sign for expenses

#### Scenario: Empty

- **WHEN** there are no transactions to show
- **THEN** an empty state invites the user to add one

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
