# Spec Delta

## ADDED Requirements

### Requirement: Sign in with Google

A visitor SHALL sign up or sign in with a Google account from the sign-in and sign-up pages; the first Google sign-in creates the account.

#### Scenario: First Google sign-in

- **WHEN** a visitor whose Google email has no account continues with Google and allows access
- **THEN** an account with the default categories is created and the main page opens signed in

#### Scenario: Returning Google user

- **WHEN** a user who signed up with Google continues with Google again
- **THEN** the main page opens signed in to the same account

#### Scenario: Email has a password account

- **WHEN** a visitor continues with Google using an email that already has a password account
- **THEN** the sign-in page opens with a message to sign in with the password, and the visitor stays signed out

#### Scenario: Cancelled at Google

- **WHEN** the visitor cancels on Google's page
- **THEN** the sign-in page opens, signed out, without an error message

#### Scenario: Google not configured

- **GIVEN** the environment has no Google keys
- **WHEN** a visitor opens the sign-in or sign-up page
- **THEN** no Google button shows

#### Scenario: Too many attempts

- **WHEN** one IP makes more than 10 sign-in or sign-up attempts in a minute, Google ones included
- **THEN** further attempts are refused with a message to try again later
