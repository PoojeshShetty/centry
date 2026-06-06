# Task 3: Wire Express entry point and create layer stubs

## Trace
- **FR-IDs:** FR-01, FR-02, FR-05, FR-06
- **Depends on:** task-1, task-2
- **Design:** ../design.md

## Files
- `packages/backend/src/index.ts` — modify
- `packages/backend/src/routes/index.ts` — create
- `packages/backend/src/services/index.ts` — create
- `packages/backend/src/repositories/index.ts` — create
- `packages/backend/src/tests/index.test.ts` — create

## Design References
- design.md §Architecture (src/index.ts component)
- design.md §Architecture (Data Flow — process.env → authenticate → listen)
- design.md §Design Decisions (DB connectivity: authenticate-then-listen vs optimistic start)

## Contracts (task-specific)

### Internal Interfaces
- `app` (Express Application in `src/index.ts`):
  - Pre: `sequelize.authenticate()` resolves successfully
  - Post: server listens on `process.env.PORT` (default fallback acceptable); no HTTP routes registered
  - On DB failure: logs error and calls `process.exit(1)`

## Acceptance Criteria

### FR-01: Express entry point
- GIVEN `PORT=3001`
- WHEN the server starts
- THEN it SHALL listen on `:3001`

### FR-03 + FR-05: Sequelize connectivity — happy path
- GIVEN valid `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- WHEN the app starts
- THEN Sequelize SHALL authenticate successfully and log a confirmation

### FR-03 + FR-05: Sequelize connectivity — failure path
- GIVEN an invalid `DB_HOST`
- WHEN the app starts
- THEN the process SHALL exit with a non-zero exit code

### FR-06: No routes exposed
- GIVEN the server is running
- WHEN any HTTP route is requested
- THEN the server SHALL return 404

### FR-02: Layer directories present
- GIVEN the source tree
- THEN `src/routes/`, `src/services/`, `src/repositories/` SHALL each contain at least a stub `index.ts`

## Done Criteria
- [ ] `src/index.ts` calls `sequelize.authenticate()` before `app.listen()`
- [ ] On authenticate failure, `process.exit(1)` is called
- [ ] Server listens on `process.env.PORT` (parsed to number)
- [ ] No HTTP routes registered (any request returns 404)
- [ ] `src/routes/index.ts`, `src/services/index.ts`, `src/repositories/index.ts` exist (stubs)
- [ ] `tsc --build` passes with zero errors
- [ ] Tests cover: listen on correct port, exit on DB failure, 404 for unknown routes
