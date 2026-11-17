# Common: React Projects

Rules shared by Next.js, React + Vite and React Native, on top of [typescript.md](typescript.md). A stack's `rules.md` adds to them and wins where it is more specific.

## Principles

- Split a component only when it helps reuse, composition or readability.

## Naming

- Components in PascalCase, hooks as `useX`.
- Callback props `onX`, internal handlers `handleX`.

## Structure

- Co-location: files live next to the code that uses them; code moves to `shared` only when a second feature needs it.
- A feature doesn't import from another feature; the linter checks layer boundaries (on the web only for imports through the `@` alias) and import cycles.
- Absolute imports via the `@` alias between modules (`paths` without `baseUrl`); relative imports within a feature.
- A component file exports only components, since mixing breaks Fast Refresh; utilities and constants go in separate files. Generated UI components in `shared/ui` (shadcn/ui, React Native Reusables) keep their variant exports, such as `buttonVariants`.
- Similar but not identical code is extracted on the third copy when the copies change together; two similar copies are fine.
- Generated code (API clients, database and translation types) goes in `src/shared/api/generated/` and isn't edited by hand.

## Components

- React Compiler is on; Rules of Hooks and the compiler's recommended rules are linter errors.
- Follow the Rules of React: pure components and hooks, no mutating props or state, no conditional hooks.
- Deterministic render: no `Date.now()`, `Math.random()`, `randomUUID()` or writes to external variables during render; generate IDs in event handlers.
- `"use no memo"` only for a library incompatible with the compiler, with a comment why.
- `useMemo` / `useCallback` / `memo` only when really needed; with React Compiler they're usually unnecessary.
- No components declared inside components.
- Type props directly, without `React.FC`.
- Prefer composition via `children` and Compound Components.
- Reuse logic with custom hooks and composition, not HOC / Render Props / Container-Presentational.
- No index as `key` in lists with dynamic order.
- No nested ternaries; use guard clauses / early returns.
- `&&` rendering only with a boolean condition, not a number or string.
- `ref` as a regular prop; no `forwardRef`.
- `ref.current` is read or written only in handlers and effects, never during render.
- Context is for rarely changing values (theme, locale, session), not a replacement for a store.
- Every part of a screen that loads data has loading (a skeleton matching the content size), empty and error states.

## State

- Minimal state; compute derived state, don't store it.
- Values that don't affect rendering go in `useRef`, not state.
- Mutually exclusive states: one `status`, not several booleans.
- `useEffect` only for side effects, with a complete dependency array and cleanup; state isn't synchronized through effects, and local state is reset with `key`.
- Non-reactive logic in an effect goes into `useEffectEvent`, not suppressed deps.
- Reactions to user actions go in an event handler, not `useEffect`.
- External sources (browser or device APIs, third-party stores) via `useSyncExternalStore`, not `useEffect` + `useState`.
- Shared state is lifted to the nearest common parent first; a global client store only when distant parts of the app need it.
- Stores are organized by feature and read through selectors, not one global store read whole.

## Data

- Query definitions (key, function, freshness) come from the generated API client or one factory per feature; no handwritten string keys.
- Pending state comes from the mutation, the action or `useTransition`, not a custom `isLoading`.

## Errors

- Common request errors (401, network, toasts for mutations) are handled centrally; validation errors show next to fields, without a toast.
- User-facing error text is chosen by the API's error code, not by its text.

## Forms

- A form is a separate component on a form library with a schema; the schema is the single source of truth, and the form type is inferred from it.
- Validate on blur or submit, not on every keystroke; after the first error, on field change.
- Submit is disabled while the request runs; server validation errors show next to their fields.
- With React Hook Form: `useWatch` instead of `watch`, and `useFormState` instead of `formState` from `useFormContext`, so values stay reactive under React Compiler.

## Styles

- Colors only from semantic theme tokens, spacing and typography from the theme's scale; no theme conditions in components.
- Component variants through the variant system, not conditions in class names or styles.
- Components set no outer margins; the parent spaces them via `gap`.

## Accessibility

- Target: WCAG 2.2 AA (the European Accessibility Act applies to EU consumer products).
- Text contrast meets WCAG AA; information isn't conveyed by color alone.

## i18n (multilingual projects only)

- No hardcoded UI text; translations grouped by feature.
- Pluralization with i18n tools, not `if` in code.
- No string concatenation: insert variables via interpolation.

## Testing

- Test behavior, not implementation: find elements by role, label and text, like a user; test-id only when there is no other way.
- Unit tests for utils and hooks with logic; component tests for interactive logic (forms, filters), not markup; no markup snapshot tests.
- A UI change is checked in the running app (a browser, or a simulator for mobile) before it's called done.
