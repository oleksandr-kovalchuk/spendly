# settings Specification

## Purpose

The Settings screen: where a signed-in user sees their account and changes the theme and language, and the only place to delete the account.

## Requirements

### Requirement: Settings screen

A signed-in user SHALL reach a Settings screen at `/{locale}/settings` from the account panel; it SHALL show the theme and language controls and the account's email with sign out.

#### Scenario: Open settings

- **WHEN** the user picks Settings in the account panel
- **THEN** the Settings screen opens with the theme and language controls, the account's email and a sign out button

#### Scenario: Signed out

- **WHEN** a visitor opens `/en/settings` without a session
- **THEN** the sign-in page opens

### Requirement: Delete account

The Settings screen SHALL offer deleting the account in a danger zone at its end, after a confirmation that asks for the password, or for nothing more when the account has no password (Google); no other screen or panel SHALL offer it.

#### Scenario: Delete with password

- **WHEN** the user confirms the deletion with the right password
- **THEN** the account and all its data are deleted and the sign-in page opens with a message that the account was deleted

#### Scenario: Wrong password

- **WHEN** the user confirms with a wrong password
- **THEN** the error shows next to the password field and the account stays

#### Scenario: Not in the shell

- **WHEN** the user opens the account panel or looks at the sidebar
- **THEN** no delete account control shows
