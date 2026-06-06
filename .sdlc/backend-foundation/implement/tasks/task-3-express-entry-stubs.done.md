# Task 3 Completion: Wire Express entry point and create layer stubs

## Summary
Wired `src/index.ts` to authenticate the Sequelize singleton before `app.listen()`, exiting with code 1 on DB failure. Added empty stub `index.ts` files for `routes/`, `services/`, and `repositories/`. No HTTP routes are registered.

## Commits
- `c708372` test(backend-foundation): add failing index.ts tests (FR-01, FR-02, FR-05, FR-06)
- `ad08697` feat(backend-foundation): wire Express entry point and create layer stubs (FR-01, FR-02, FR-05, FR-06)

## Deviations
- **Rule 3: Blocking** — `tsc --build` failed with TS2883 (inferred type of `app` not portable). Added explicit `app: Express` annotation in `index.ts`.

## Difficulties
- Initial test draft pulled in `supertest`; user flagged it as integration-only tooling unsuited to this unit scope. Replaced with `vi.doMock`-based unit tests — `express` and the sequelize singleton are mocked, no real HTTP server or DB.
- The "no routes" check relies on `app._router` being undefined — an Express **4** internal (lazily created on first route/middleware). Runtime is express ^4 while `@types/express` is ^5, so the field is cast and commented; if the runtime ever bumps to Express 5 this assertion would pass vacuously and should be revisited.
- `process.env.PORT` leaked across tests in an early version; fixed by snapshotting/restoring `process.env` in `beforeEach`/`afterEach`.

## Notes
- Test 3 mocks `authenticate()` with a never-resolving promise so the `.then()` chain never fires, allowing synchronous inspection of the app before `listen()` would run.
- `mockSequelize` / `mockExpress` helpers were extracted to remove repeated `doMock` boilerplate across the three tests.
