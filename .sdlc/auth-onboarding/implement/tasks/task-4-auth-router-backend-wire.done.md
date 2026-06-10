# Task 4 Completion: Implement auth router and wire into backend entry point

## Summary
Added the auth router (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`) as
named handler functions plus a wired `authRouter`, mapping `DuplicateEmailError`→409,
`InvalidCredentialsError`→401, and `ZodError`→400. Exported it from `routes/index.ts` and mounted it
under `/api/auth` in `src/index.ts` behind `express.json()`. No response body includes
`password_hash` (FR-08).

## Commits
- `9b5ccce` test(auth-onboarding): add failing tests for auth router handlers (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08)
- `065d6b3` feat(auth-onboarding): add auth router and wire into backend entry (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08)

## Deviations
- **Rule 3: Blocking** — mounting the router pulled the Sequelize model chain into `src/index.ts`,
  breaking `index.test.ts`'s `'no routes registered'` assertion and its express/sequelize mocks.
  Updated that test to assert the router IS mounted (`_router` defined + a layer matching `/api/auth`),
  added `use` to the stub apps and a `json` stub to the express mock, and stubbed `routes/index.js`
  with a real `express.Router()` so the wiring tests do not load the model (which needs a real DB).
- Skipped supertest / HTTP-level integration tests (task said "supertest or similar") per the user's
  decision to defer integration tests. Handlers are exported and unit-tested directly with mocked
  `req`/`res`, mirroring the existing `requireAuth.test.ts` pattern. `requireAuth` itself is already
  covered by its own unit tests, so `/me`'s auth path is exercised there.

## Difficulties
- The express default-export mock in `index.test.ts` lacked the static `.json` method once
  `express.json()` was added to `index.ts` — added a `json` stub to the mock factory.
- `typeof import('express')` has no typed `.default`, so `vi.importActual<...>('express').default`
  failed `tsc`; used the top-level `express` import directly inside the `vi.doMock` factory instead.

## Notes
- Handlers are exported individually (`registerHandler`, `loginHandler`, `meHandler`) specifically to
  enable unit testing without an HTTP server. `authRouter` wires them with `requireAuth` on `/me`.
- Unmapped service errors are re-thrown from the register/login handlers (reach Express's default
  error handler → 500) rather than being swallowed as 400/401.
- Backend now has 38 tests passing; `build` and `lint` clean.
