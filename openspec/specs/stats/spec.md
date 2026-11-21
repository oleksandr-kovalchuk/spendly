# stats Specification

## Purpose

A summary of the shown period on the main page: totals and where the money went.

## Requirements

### Requirement: Period totals

The Overview screen SHALL show the shown period's balance (income minus expenses) as its largest figure, with total income and total expenses under it and the share of income spent; the balance's digits SHALL roll to a new value.

#### Scenario: Totals

- **GIVEN** income of 1000 and expenses of 300 and 200 in the shown month
- **WHEN** the Overview screen opens
- **THEN** it shows balance 500 first and largest, income 1000 and expenses 500 under it, and 50% of income spent

#### Scenario: Negative balance

- **WHEN** expenses exceed income in the shown period
- **THEN** the balance shows with a minus sign and the share spent is over 100%

#### Scenario: No income

- **WHEN** the shown period has no income
- **THEN** no share of income spent shows

#### Scenario: After a change

- **WHEN** the user adds, edits or deletes a transaction
- **THEN** the totals update without a page reload, and a screen reader is not interrupted by the change

#### Scenario: Rolling balance

- **WHEN** the Overview screen opens or the balance changes
- **THEN** each digit of the balance rolls to its value, and a screen reader reads the balance as one number

### Requirement: Spending by category

The Overview screen SHALL chart the shown period's expenses by category as a ring split into the categories' colors, largest first, with the total spent in its middle and each category's name, amount and share as text next to it; pointing at a category in the ring or the text SHALL show its name and amount in the middle and dim the others.

#### Scenario: Two categories

- **GIVEN** expenses of 300 in Food and 200 in Transport in the shown period
- **WHEN** the Overview screen opens
- **THEN** the ring shows Food at 60% and Transport at 40% in their colors, its middle shows expenses of 500, and the amounts show as text

#### Scenario: Tiny share

- **GIVEN** a category with under 1% of the shown period's expenses
- **WHEN** the ring shows
- **THEN** the category still shows as a dot in its color, apart from its neighbours

#### Scenario: Pointing at a category

- **WHEN** the user points at Transport in the ring or in the text
- **THEN** the middle shows Transport and its amount and the other categories dim, until the pointer leaves

#### Scenario: Drawing

- **WHEN** the ring shows or its data changes
- **THEN** it draws from empty, clockwise from twelve o'clock

#### Scenario: No expenses

- **WHEN** the shown period has no expenses
- **THEN** an empty state shows instead of the chart, with a button that opens the add form

#### Scenario: Theme and language

- **WHEN** the user switches the theme or the language
- **THEN** the chart stays readable and its labels follow the language

### Requirement: Latest transactions

The Overview screen SHALL show up to five of the shown period's newest transactions, with a link to all of them on the Transactions screen for the same period.

#### Scenario: Latest

- **GIVEN** seven transactions in the shown month
- **WHEN** the Overview screen opens
- **THEN** it shows the five newest with category, note and signed amount, and a link that opens Transactions for that month

#### Scenario: None

- **WHEN** the shown period has no transactions
- **THEN** the latest transactions block does not show
