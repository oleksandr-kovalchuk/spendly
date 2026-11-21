# Spec Delta

## MODIFIED Requirements

### Requirement: Period totals

The Overview screen SHALL show the shown period's total income, total expenses and balance (income minus expenses).

#### Scenario: Totals

- **GIVEN** income of 1000 and expenses of 300 and 200 in the shown month
- **WHEN** the Overview screen opens
- **THEN** it shows income 1000, expenses 500 and balance 500

#### Scenario: Negative balance

- **WHEN** expenses exceed income in the shown period
- **THEN** the balance shows with a minus sign

#### Scenario: After a change

- **WHEN** the user adds, edits or deletes a transaction
- **THEN** the totals update without a page reload, and a screen reader is not interrupted by the change

### Requirement: Spending by category

The Overview screen SHALL chart the shown period's expenses by category, largest first, with each category's name, amount and share as text next to the chart.

#### Scenario: Two categories

- **GIVEN** expenses of 300 in Food and 200 in Transport in the shown period
- **WHEN** the Overview screen opens
- **THEN** the chart shows Food at 60% and Transport at 40%, with the amounts as text

#### Scenario: No expenses

- **WHEN** the shown period has no expenses
- **THEN** an empty state shows instead of the chart, with a button that opens the add form

#### Scenario: Theme and language

- **WHEN** the user switches the theme or the language
- **THEN** the chart stays readable and its labels follow the language
