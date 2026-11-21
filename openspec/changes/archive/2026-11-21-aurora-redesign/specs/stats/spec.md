# Spec Delta

## MODIFIED Requirements

### Requirement: Period totals

The Overview screen SHALL show the shown period's balance (income minus expenses) as its largest figure, with total income and total expenses under it and the share of income spent.

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

### Requirement: Spending by category

The Overview screen SHALL chart the shown period's expenses by category as one bar split into the categories' colors, largest first, with each category's name, amount and share as text next to it.

#### Scenario: Two categories

- **GIVEN** expenses of 300 in Food and 200 in Transport in the shown period
- **WHEN** the Overview screen opens
- **THEN** the bar shows Food at 60% and Transport at 40% in their colors, with the amounts as text

#### Scenario: No expenses

- **WHEN** the shown period has no expenses
- **THEN** an empty state shows instead of the chart, with a button that opens the add form

#### Scenario: Theme and language

- **WHEN** the user switches the theme or the language
- **THEN** the chart stays readable and its labels follow the language

## ADDED Requirements

### Requirement: Latest transactions

The Overview screen SHALL show up to five of the shown period's newest transactions, with a link to all of them on the Transactions screen for the same period.

#### Scenario: Latest

- **GIVEN** seven transactions in the shown month
- **WHEN** the Overview screen opens
- **THEN** it shows the five newest with category, note and signed amount, and a link that opens Transactions for that month

#### Scenario: None

- **WHEN** the shown period has no transactions
- **THEN** the latest transactions block does not show
