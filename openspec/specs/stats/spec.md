# stats Specification

## Purpose

A summary of the shown period on the main page: totals and where the money went.

## Requirements

### Requirement: Period totals

The main page SHALL show the shown period's total income, total expenses and balance (income minus expenses).

#### Scenario: Totals

- **GIVEN** income of 1000 and expenses of 300 and 200 in the shown month
- **WHEN** the main page opens
- **THEN** it shows income 1000, expenses 500 and balance 500

#### Scenario: Negative balance

- **WHEN** expenses exceed income in the shown period
- **THEN** the balance shows with a minus sign

#### Scenario: After a change

- **WHEN** the user adds, edits or deletes a transaction
- **THEN** the totals update without a page reload

### Requirement: Spending by category

The main page SHALL chart the shown period's expenses by category, largest first, with each category's name, amount and share as text next to the chart.

#### Scenario: Two categories

- **GIVEN** expenses of 300 in Food and 200 in Transport in the shown period
- **WHEN** the main page opens
- **THEN** the chart shows Food at 60% and Transport at 40%, with the amounts as text

#### Scenario: No expenses

- **WHEN** the shown period has no expenses
- **THEN** an empty state shows instead of the chart

#### Scenario: Theme and language

- **WHEN** the user switches the theme or the language
- **THEN** the chart stays readable and its labels follow the language
