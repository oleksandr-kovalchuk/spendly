# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
