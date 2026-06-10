# Task 2: Update Account model and implement AccountRepository

## Trace
- **FR-IDs:** FR-01, FR-02, FR-06, FR-08
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/backend/src/models/account.ts` — modify (add `email`, `password_hash` fields)
- `packages/backend/src/repositories/account.ts` — create
- `packages/backend/src/repositories/index.ts` — modify (export AccountRepository)
- `packages/backend/src/tests/models/account.test.ts` — update (interface change)
- `packages/backend/src/tests/repositories/account.test.ts` — create

## Design References
- design.md §Data Models (Account entity — all fields, uniqueness, no password_hash in responses)
- design.md §Architecture (AccountRepository component — create, findByEmail, findById)
- design.md §Interface Contracts (Internal Interfaces — AccountRepository method signatures)

## Contracts (task-specific)

### Internal Interfaces
- `AccountRepository.create({ name, email, password_hash }) -> Promise<Account>`
  - Pre: `email` is already lowercased; not already present in DB
  - Post: one row with UUID `id` and `created_at`; returns full Account instance
- `AccountRepository.findByEmail(email: string) -> Promise<Account | null>`
  - Pre: `email` is lowercased by caller
- `AccountRepository.findById(id: string) -> Promise<Account | null>`

## Acceptance Criteria

### FR-01: Account creation
- GIVEN valid inputs `{ name: "Alice", email: "alice@example.com", password_hash: "<hash>" }`
- WHEN `AccountRepository.create(...)` is called
- THEN one Account row is persisted with a UUID `id` and a `created_at` timestamp

### FR-02: Duplicate email detection
- GIVEN an account exists for `alice@example.com`
- WHEN `AccountRepository.findByEmail("alice@example.com")` is called
- THEN it SHALL return the existing Account (not null)

### FR-06 / FR-08: Safe field selection
- GIVEN `AccountRepository.findById(id)` returns an Account
- THEN the returned object SHALL expose `id`, `name`, `email`, `created_at`
- AND `password_hash` SHALL be present on the model instance (needed by AuthService) but SHALL NOT be selected away — callers must omit it from responses

## Done Criteria
- [ ] `Account` model declares `email: string` and `password_hash: string` with `allowNull: false`; `email` has `unique: true`
- [ ] `AccountRepository` class (or module) exports `create`, `findByEmail`, `findById`
- [ ] `packages/backend/src/repositories/index.ts` exports `AccountRepository`
- [ ] Vitest tests for `AccountRepository` cover: create returns an Account, findByEmail returns null for unknown email, findByEmail returns Account for known email, findById returns null for unknown id
- [ ] Existing `account.test.ts` updated to assert `email` and `password_hash` attributes exist on the model
- [ ] `pnpm --filter @centry/backend test` passes
