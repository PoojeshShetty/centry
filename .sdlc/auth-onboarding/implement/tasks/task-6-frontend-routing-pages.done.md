# Task 6 Completion: Implement frontend protected routing, HomePage greeting, and AccountPage

## Summary
Added `ProtectedRoute` (redirects unauthenticated visitors to `/login`), an `AccountPage`
(fetches `GET /api/auth/me`, shows name/email/member-since, logout control), updated `HomePage`
to greet "Hello \<name>", and wired `/login`, `/register`, protected `/` and `/account` into the
route table. Also configured the frontend to call the backend on a separate origin via
`VITE_API_URL`.

## Commits
- `548563b` test(auth-onboarding): add failing tests for ProtectedRoute, AccountPage, home greeting, routes (FR-12, FR-13, FR-14, FR-15)
- `0808e28` feat(auth-onboarding): add protected routing, home greeting, and account page (FR-12, FR-13, FR-14, FR-15)
- `f75d2e5` chore(auth-onboarding): point apiClient at backend via VITE_API_URL + dev mode (FR-09, FR-10, FR-13)

## Deviations
- **Rule 3: Blocking** — the existing `login.test.tsx` (task-5, out of scope) asserts the `Centry`
  heading as its proxy for "home rendered" after navigation. Kept the `Centry` brand `<h1>` on
  `HomePage` and added the `Hello <name>` greeting alongside it, so FR-12 is satisfied without
  editing the out-of-scope test.
- **Rule 2: Missing Critical** — `apiClient` requests were hardcoded same-origin; frontend and
  backend run on separate origins. Added a configurable `VITE_API_URL` base (per user request),
  typed via `src/vite-env.d.ts`, with a `.env.dev` file and `vite --mode dev` dev script. Falls
  back to '' under Jest so URL assertions in existing tests are unaffected.

## Difficulties
- `import.meta.env` is undefined under ts-jest (no Vite transform) — guarded with
  `import.meta.env?.VITE_API_URL ?? ''` so the base URL resolves to '' in tests and the existing
  `/api/auth/*` URL assertions stay green.
- `ProtectedRoute` uses children-based wrapping (not an `<Outlet>` layout route) so the existing
  flat `RouteConfig[]` table and `renderPage` test helper needed no structural change.

## Notes
- `.env.dev` is intentionally committed (only a `localhost:3000` URL, no secrets) so the dev
  config is shared. Verified `vite build --mode dev` inlines the URL into the bundle.
- The greeting renders via a single template literal (`` `Hello ${name}` ``) so RTL's `getByText`
  matches one text node.
