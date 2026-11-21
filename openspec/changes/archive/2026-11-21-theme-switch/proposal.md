# Proposal

## Why

Three theme buttons (light, dark, system) take room in every header, and people only ever want light or dark.

## What Changes

- One light/dark switch replaces the three theme buttons, with a sun or moon on its thumb
- Until the user flips it, the theme follows the device, as before
- The flipped choice is remembered on the device, as before

Out of scope: other header controls, new themes, syncing the theme to the account.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: the theme offers light and dark only, through a switch
