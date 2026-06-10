# Task 5 Completion: Implement frontend auth state, API client, and auth pages

## Summary
Added the frontend auth layer: `useAuthStore` (zustand, localStorage-persisted), an `apiClient`
fetch wrapper with bearer-auth and typed errors, and antd `RegisterPage` / `LoginPage` that
authenticate and navigate home, rendering inline backend errors. Routing was centralised into
`src/routes/routes.tsx` (`paths` + `appRoutes`) so the app router and the shared test render helper
draw from one source of truth.

## Commits
- `27accc7` feat(auth-onboarding): add frontend auth state, api client, auth pages + central routes (FR-09, FR-10, FR-11, FR-14)
- `017b07e` test(auth-onboarding): add auth store, api client, and page tests (FR-09, FR-10, FR-11, FR-14)
- `3236e51` fix(auth-onboarding): hoist HomePage styled.div to module scope; exclude tests from prod build

## Deviations
- **Rule 3: Blocking** — `tsc -b` compiled the `src/**/__tests__` test files (which use `global` /
  `@jest/globals`), breaking `pnpm build`. Excluded test files from `tsconfig.json` and re-included
  them in `tsconfig.jest.json` (`exclude: []`) so ts-jest still typechecks them.
- **Rule 1: Bug** — `HomePage` defined its `styled.div` inside the component body, recreating the
  styled component on every render. Hoisted to module scope and corrected the stale comment.
- **Scope (beyond task-5 file list)** — central `routes/routes.tsx` + `routes/index.tsx` rewire and
  the `home/index.tsx` fix touch task-6 (routing) territory. Done now at the user's request to avoid
  hardcoding routes in both the app and tests; `ProtectedRoute` / `/account` remain for task-6.

## Difficulties
- antd v6 `<Form>` needs `MessageChannel` / `matchMedia` / `ResizeObserver`, absent in jsdom. Added
  polyfills in `jest.setup.ts` (the `MessageChannel` port is `unref`'d so it doesn't block Jest exit).
- Using real `appRoutes` in the page tests means navigation lands on the real `HomePage`, so the
  post-login/register assertion checks `'Centry'` (real home text) instead of a stub.

## Notes
- antd v6 `Alert` uses `title` (not the deprecated `message`) — relevant for the inline error display.
- Shared test helper `renderPage(initialEntries, routes = appRoutes)` lives at `src/utils/testUtils.tsx`,
  deliberately outside any `__tests__/` dir so Jest's default `testMatch` doesn't try to run it.
- These gotchas were also recorded in `Style.md` (left untracked for the user to commit with CLAUDE.md).
