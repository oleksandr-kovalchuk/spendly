# Spec Delta

## MODIFIED Requirements

### Requirement: Theme

The app SHALL offer light and dark themes through one switch, follow the device theme until the user flips it, and remember the choice on the device.

#### Scenario: System by default

- **GIVEN** the user has not picked a theme
- **WHEN** the device uses a dark theme
- **THEN** the app is dark and the switch is on

#### Scenario: Choice remembered

- **WHEN** the user turns the switch on and reloads the page
- **THEN** the page is dark from the first paint, without a flash of light colors

#### Scenario: Switch

- **WHEN** a screen reader user reaches the theme control
- **THEN** it is announced as a switch named "Dark theme", on or off
