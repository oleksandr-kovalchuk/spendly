# Spec Delta

## Purpose

Tells people what personal data Spendly stores, why, for how long, who processes it and how to get it deleted.

## ADDED Requirements

### Requirement: Privacy policy page

The app SHALL show a privacy policy at `/{locale}/privacy` in the current language to anyone, signed in or not.

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens `/en/privacy`
- **THEN** the privacy policy opens, not the sign-in page

#### Scenario: Content

- **WHEN** the privacy policy opens
- **THEN** it lists the stored data, why and how long each is kept, the services that process it, and an email to ask about the data or have the account deleted

#### Scenario: Language

- **WHEN** a visitor opens `/uk/privacy`
- **THEN** the policy is in Ukrainian

### Requirement: Privacy link

Signed-out pages SHALL link to the privacy policy from their footer.

#### Scenario: From sign-in

- **WHEN** a visitor follows the footer's privacy link on the sign-in page
- **THEN** the privacy policy opens in the same language
