# Task 3: Implement AuthService and requireAuth middleware

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-07, FR-08
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/backend/src/services/auth.ts` — create
- `packages/backend/src/middleware/requireAuth.ts` — create
- `packages/backend/src/services/index.ts` — modify (export AuthService)
- `packages/backend/src/tests/services/auth.test.ts` — create
- `packages/backend/src/tests/middleware/requireAuth.test.ts` — create

## Design References
- design.md §Architecture (AuthService — bcryptjs, zod validation, register/login; requireAuth middleware)
- design.md §Interface Contracts (Internal Interfaces — AuthService.register, AuthService.login, requireAuth)
- design.md §Design Decisions (Password hashing: bcryptjs; Session token: jsonwebtoken HS256 1h; Input validation: zod; Email case-insensitivity: normalize in application)

## Contracts (task-specific)

### Internal Interfaces
- `AuthService.register({ name, email, password }) -> Promise<{ token: string, user: { id, name, email, created_at } }>`
  - Pre: input passes zod register schema (name non-empty, email well-formed, password ≥ 8 chars)
  - Post: email lowercased before persist; password stored only as bcryptjs hash; JWT signed with `JWT_SECRET`, 1h expiry, payload `{ sub: accountId }`; returned `user` never includes `password_hash`
  - Throws: duplicate-email error (mapped to 409) if email already exists; zod validation error (mapped to 400) on invalid input
- `AuthService.login({ email, password }) -> Promise<{ token: string, user: { id, name, email, created_at } }>`
  - Pre: input passes zod login schema (email + password present)
  - Post: email lowercased before lookup; bcryptjs.compare used for verification; JWT signed on match; returned `user` never includes `password_hash`
  - Throws: single generic invalid-credentials error (mapped to 401) for unknown email OR wrong password — same message, no field disclosure
- `requireAuth(req, res, next)`: Express middleware
  - Post: on valid JWT sets `req.accountId = payload.sub`, calls `next()`
  - On missing/malformed/expired token: responds `401 { error: "unauthorized" }` and does NOT call `next()`

### TypeScript augmentation
- Extend Express `Request` to declare `accountId?: string` (via `declare global` or a `.d.ts` file)

## Acceptance Criteria

### FR-01: Register — happy path
- GIVEN valid `{ name: "Alice", email: "alice@example.com", password: "hunter2!" }`
- WHEN `AuthService.register(...)` is called
- THEN it SHALL return `{ token, user }` where `user` contains `id`, `name`, `email`, `created_at` and no `password_hash`
- AND the stored Account's `password_hash` SHALL not equal the plaintext password

### FR-02: Register — duplicate email
- GIVEN an account exists for `alice@example.com`
- WHEN `AuthService.register({ ..., email: "alice@example.com", ... })` is called
- THEN it SHALL throw a duplicate-email error without creating a second account

### FR-03: Register — input validation
- GIVEN `{ name: "", email: "alice@example.com", password: "hunter2!" }` (empty name)
- WHEN `AuthService.register(...)` is called
- THEN it SHALL throw a validation error and not persist anything
- GIVEN password `"short"` (7 chars)
- THEN it SHALL throw a validation error; password `"exactly8"` (8 chars) SHALL be accepted

### FR-04: Login — valid credentials + case-insensitive email
- GIVEN a registered account for `alice@example.com`
- WHEN `AuthService.login({ email: "Alice@Example.com", password: "hunter2!" })` is called
- THEN it SHALL return `{ token, user }` with a valid signed JWT

### FR-05: Login — invalid credentials
- GIVEN a login attempt with wrong password OR unknown email
- WHEN `AuthService.login(...)` is called
- THEN it SHALL throw a single error with message `"invalid email or password"` — identical for both cases

### FR-07: requireAuth — token validation
- GIVEN a request with no `Authorization` header
- WHEN `requireAuth` runs
- THEN it SHALL respond 401 and not call `next()`
- GIVEN a request with a valid JWT
- WHEN `requireAuth` runs
- THEN it SHALL set `req.accountId` and call `next()`
- GIVEN an expired or tampered JWT
- WHEN `requireAuth` runs
- THEN it SHALL respond 401

### FR-08: Credential safety
- GIVEN any path through `AuthService.register` or `AuthService.login`
- THEN no password, password_hash, or JWT SHALL appear in `console.log` / `console.error` output

## Done Criteria
- [ ] `packages/backend/src/services/auth.ts` exports `AuthService` with `register` and `login`
- [ ] `packages/backend/src/middleware/requireAuth.ts` exports `requireAuth` Express middleware
- [ ] `bcryptjs` and `jsonwebtoken` and `zod` are installed in `@centry/backend` (`pnpm --filter @centry/backend add ...`)
- [ ] `@types/bcryptjs` and `@types/jsonwebtoken` installed as devDependencies
- [ ] Vitest tests cover all acceptance criteria above (happy paths + failure paths)
- [ ] `pnpm --filter @centry/backend test` passes
