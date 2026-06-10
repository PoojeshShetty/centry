# Task 4: Implement auth router and wire into backend entry point

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08
- **Depends on:** task-3
- **Design:** ../design.md

## Files
- `packages/backend/src/routes/auth.ts` — create
- `packages/backend/src/routes/index.ts` — modify (export auth router)
- `packages/backend/src/index.ts` — modify (add `express.json()` middleware, mount auth router at `/api/auth`)
- `packages/backend/src/tests/routes/auth.test.ts` — create

## Design References
- design.md §Architecture (Auth router — POST /api/auth/register, POST /api/auth/login, GET /api/auth/me)
- design.md §Interface Contracts (API Endpoints)
- design.md §Design Decisions (Register status codes: 201 + 409)

## Contracts (task-specific)

### API Endpoints
- `POST /api/auth/register`: create account and return session
  - Input: `{ "name": string, "email": string, "password": string }`
  - Output: `201 { "token": string, "user": { "id", "name", "email", "created_at" } }`
  - Errors: `400 { "error": "<zod message>" }` (validation); `409 { "error": "email already registered" }` (duplicate)
- `POST /api/auth/login`: authenticate and return session
  - Input: `{ "email": string, "password": string }`
  - Output: `200 { "token": string, "user": { "id", "name", "email", "created_at" } }`
  - Errors: `400 { "error": "..." }` (missing fields); `401 { "error": "invalid email or password" }`
- `GET /api/auth/me`: return signed-in account
  - Headers: `Authorization: Bearer <jwt>`
  - Output: `200 { "id", "name", "email", "created_at" }`
  - Errors: `401 { "error": "unauthorized" }` (missing/invalid/expired token)

No response body in any route includes `password_hash` (FR-08).

## Acceptance Criteria

### FR-01 / FR-02 / FR-03: Register endpoint
- GIVEN a POST to `/api/auth/register` with valid body
- WHEN the handler runs
- THEN it SHALL respond `201` with `{ token, user }` (no `password_hash` in user)

- GIVEN a POST with duplicate email
- THEN it SHALL respond `409 { "error": "email already registered" }`

- GIVEN a POST with invalid body (empty name / bad email / short password)
- THEN it SHALL respond `400`

### FR-04 / FR-05: Login endpoint
- GIVEN a POST to `/api/auth/login` with valid credentials
- THEN it SHALL respond `200 { token, user }`

- GIVEN wrong password or unknown email
- THEN it SHALL respond `401 { "error": "invalid email or password" }` — same message for both

### FR-06 / FR-07: Me endpoint
- GIVEN a GET to `/api/auth/me` with a valid JWT
- THEN it SHALL respond `200 { id, name, email, created_at }` (no password_hash)

- GIVEN no token or an invalid/expired token
- THEN it SHALL respond `401`

## Done Criteria
- [ ] `packages/backend/src/routes/auth.ts` implements all three routes using `AuthService` and `requireAuth`
- [ ] `packages/backend/src/index.ts` applies `express.json()` before route mounting and mounts the auth router at `/api/auth`
- [ ] Vitest integration tests cover all three endpoints (happy + failure paths) using supertest or similar
- [ ] `pnpm --filter @centry/backend test` passes
- [ ] Existing ingest/admin routes (if any) are not regressed
