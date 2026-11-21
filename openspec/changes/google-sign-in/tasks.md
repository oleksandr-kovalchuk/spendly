# Tasks

## 1. Google sign-in

- [x] 1.1 Add optional `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` to `env.ts`, `.env.example` and the README; enable `socialProviders.google` only when both are set, failing on one alone; verify with a unit test of the config
- [x] 1.2 Add `signIn.social` to the auth client (returns the Google URL or an error); verify with its unit test
- [x] 1.3 Add `GoogleSignInButton` (G logo, "or" divider, pending state, rate-limit and unknown errors) to the sign-in and sign-up pages when the provider is on; English and Ukrainian text; verify with a component test
- [x] 1.4 Map the sign-in page's `error` search param (`account_not_linked`, `access_denied`, other) to messages; verify with a component test
- [x] 1.5 Give CI and Playwright fake Google keys; E2E: the button sends the browser to Google with the app's redirect URI (intercepted, not loaded), `?error=account_not_linked` shows its message, axe passes in both themes
- [x] 1.6 Check in the running app: sign up, sign in again and the password-account case with a real Google account, at 360 and 1440 px in both themes

## 2. Environments

- [x] 2.1 Add the production origin and redirect URI to the Google OAuth client; verify they're listed under Clients
- [ ] 2.2 Set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in Vercel for Production only, not Preview; verify Google sign-in in production after the deploy
- [ ] 2.3 Publish the consent screen (Audience → Publish app); verify a Google account not in the test users can sign in
