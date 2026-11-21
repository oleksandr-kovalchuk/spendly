# accounts Specification

## Purpose

Email and password accounts, so each person's money data is private to them.

## Requirements

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

Pages and actions with user data SHALL require a session; the sign-in, sign-up and forgot-password pages SHALL send a signed-in user to the main page.

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens the main page
- **THEN** the sign-in page opens

#### Scenario: Request without a session

- **WHEN** a request to any data action arrives without a valid session
- **THEN** it is rejected and nothing is read or changed

#### Scenario: Signed in

- **WHEN** a signed-in user opens the sign-in or forgot-password page
- **THEN** the main page opens

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

### Requirement: Request a password reset

A visitor SHALL request a password reset link by email from the sign-in page; the response SHALL be the same whether or not the email has a password account.

#### Scenario: Password account

- **WHEN** a visitor requests a reset for an email with a password account
- **THEN** a message says a link was sent if the account exists, and the email receives a link, valid for one hour, in the language of the page

#### Scenario: Unknown email

- **WHEN** a visitor requests a reset for an email without an account
- **THEN** they see the same message, and no email is sent

#### Scenario: Google-only account

- **WHEN** a visitor requests a reset for an email whose account has only Google sign-in
- **THEN** they see the same message, and no email is sent

#### Scenario: Invalid email

- **WHEN** the email is malformed
- **THEN** an error shows next to the field, and no email is sent

#### Scenario: Too many requests from one IP

- **WHEN** one IP makes more than 3 reset requests in a minute
- **THEN** further requests are refused with a message to try again later

#### Scenario: Too many emails to one account

- **WHEN** an account has already been sent 3 reset emails in the last hour
- **THEN** a new request shows the same message, and no email is sent

### Requirement: Reset the password

A user SHALL set a new password of 8 to 128 characters through a valid reset link; the reset SHALL end every session of the account.

#### Scenario: Valid link

- **WHEN** the user opens the link and submits a valid new password
- **THEN** the sign-in page opens with a message to sign in with the new password, the old password no longer works, and the account is signed out on every device

#### Scenario: Used or expired link

- **WHEN** the user opens a link that was already used or is more than one hour old
- **THEN** a message says the link is invalid or expired, with a link to request a new one, and the password is unchanged

#### Scenario: Invalid password

- **WHEN** the new password is shorter than 8 characters
- **THEN** an error shows next to the field, and the password is unchanged
