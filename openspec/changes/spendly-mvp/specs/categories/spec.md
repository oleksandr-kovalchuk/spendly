# Spec Delta

## Purpose

Categories group a user's income and expenses; each user starts with defaults and can add and rename their own.

## ADDED Requirements

### Requirement: Default categories

Every user SHALL have these default categories. Expense: Food, Transport, Housing, Utilities, Health, Shopping, Entertainment, Other. Income: Salary, Gifts, Other.

#### Scenario: New user

- **WHEN** a user signs up
- **THEN** they have all default categories

#### Scenario: Translated names

- **GIVEN** the user has not renamed a default category
- **WHEN** they switch the language
- **THEN** its name shows in that language

### Requirement: Create category

A user SHALL create a category with a type (expense or income) and a name of 1 to 40 characters, unique among their categories of that type regardless of case.

#### Scenario: New category

- **WHEN** the user creates the expense category "Coffee"
- **THEN** it shows in their category list and in the transaction form for expenses only

#### Scenario: Duplicate name

- **WHEN** the user creates an expense category named "coffee" while their expense category "Coffee" exists
- **THEN** an error shows next to the name field and nothing is created

### Requirement: Rename category

A user SHALL rename any of their categories, default ones included; its type SHALL NOT change.

#### Scenario: Rename

- **WHEN** the user renames "Food" to "Groceries"
- **THEN** every transaction in that category shows "Groceries"

#### Scenario: Renamed default

- **WHEN** the user renames a default category and switches the language
- **THEN** it keeps the user's name

### Requirement: Category ownership

A user SHALL see, use and change only their own categories.

#### Scenario: Another user's category

- **WHEN** a user sends another user's category ID to create a transaction or to rename it
- **THEN** the request is rejected and nothing changes
