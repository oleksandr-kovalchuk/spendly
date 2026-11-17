# Spec Delta

## Purpose

Email and password accounts, so each person's money data is private to them.

## ADDED Requirements

### Requirement: Sign up

A visitor SHALL create an account with an email and a password of 8 to 128 characters.

#### Scenario: New email

- **WHEN** a visitor submits a new email and a valid password
- **THEN** the account is created and the sign-in page opens with the email filled in and a message to sign in

#### Scenario: Email already registered

- **WHEN** a visitor signs up with an email that already has an account
- **THEN** they see the same result as for a new email, and no second account is created

#### Scenario: Invalid input

- **WHEN** the email is malformed or the password is shorter than 8 characters
- **THEN** an error shows next to that field and no account is created

### Requirement: Sign in

A user SHALL sign in with their email and password and stay signed in across reloads and browser restarts.

#### Scenario: Valid credentials

- **WHEN** the user signs in with a correct email and password
- **THEN** the main page opens, and it still opens signed in after a reload

#### Scenario: Wrong credentials

- **WHEN** the email is unknown or the password is wrong
- **THEN** one message says the email or password is incorrect, the same in both cases

#### Scenario: Too many attempts

- **WHEN** one IP makes more than 10 sign-in or sign-up attempts in a minute
- **THEN** further attempts are refused with a message to try again later

### Requirement: Sign out

A signed-in user SHALL sign out from any page, which ends the session on that device.

#### Scenario: Sign out

- **WHEN** the user signs out
- **THEN** the sign-in page opens, and opening the main page again leads to sign-in

### Requirement: Private pages

Pages and actions with user data SHALL require a session; the sign-in and sign-up pages SHALL send a signed-in user to the main page.

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens the main page
- **THEN** the sign-in page opens

#### Scenario: Request without a session

- **WHEN** a request to any data action arrives without a valid session
- **THEN** it is rejected and nothing is read or changed

#### Scenario: Signed in

- **WHEN** a signed-in user opens the sign-in page
- **THEN** the main page opens
