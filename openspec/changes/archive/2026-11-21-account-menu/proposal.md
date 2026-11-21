# Proposal

## Why

The sidebar ends in three loose rows (language and theme, sign out, delete account), with the rare, destructive delete as a plain button under sign out, and phones lay the same controls out differently.

## What Changes

- One account button (avatar and email) ends the sidebar and sits in the phone top bar instead of the language and theme controls
- It opens an account panel: email, Settings, theme, language, sign out; a bottom sheet on phones
- A new Settings screen at `/{locale}/settings`: theme, language, account with sign out, and a danger zone with delete account
- The theme becomes three options: Light, Dark, System (default)
- Delete account leaves the sidebar and the phone menu; only the Settings screen offers it

Out of scope: profile photos and names, other settings, changing the email or password, Settings in the main navigation.

## Capabilities

### New Capabilities

- `settings`: the Settings screen and account deletion from it

### Modified Capabilities

- `app-shell`: theme options, where language and theme are switched, the sidebar's contents, the account panel

## Impact

App shell, theme toggle, a new view and route, translations, unit and E2E tests.
