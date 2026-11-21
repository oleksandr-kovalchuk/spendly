# Spec Delta

## ADDED Requirements

### Requirement: Category look

Each category SHALL have a color and an icon, the same on every screen and in both themes; default categories SHALL have their own icons, and a user's own categories a shared tag icon with a color that stays the same for that category.

#### Scenario: Same everywhere

- **WHEN** Food shows on Overview, Transactions and Categories
- **THEN** it has the same color and icon on all three

#### Scenario: Own category

- **WHEN** the user creates the category "Coffee"
- **THEN** it shows a tag icon and a color that stays the same after a reload

#### Scenario: Not by color alone

- **WHEN** a category shows with its color
- **THEN** its name shows next to it as text
