# Task 2 Completion: Update Account model and implement AccountRepository

## Summary
Added `email` (NOT NULL, unique) and `password_hash` (NOT NULL) to the `Account` model, and created
`AccountRepository` (`create`, `findByEmail`, `findById`) backed by Sequelize, exported from
`repositories/index.ts`.

## Commits
- `d96f347` test(auth-onboarding): add failing tests for Account fields and AccountRepository (FR-01, FR-02, FR-06, FR-08)
- `7fa032f` feat(auth-onboarding): add email/password_hash to Account and AccountRepository (FR-01, FR-02, FR-06, FR-08)

## Deviations
None.

## Difficulties
None.

## Notes
- Repository tests mock the `Account` model's static methods (`create`/`findOne`/`findByPk`) rather
  than hitting a real DB, matching the existing no-real-DB test convention (`models/account.test.ts`,
  `index.test.ts`). Per-test `await import(...)` style kept to mirror sibling tests (confirmed with user).
- `AccountRepository` is a plain object module (not a class) exposing the three methods; lookups take
  an already-lowercased `email` (normalization is the AuthService's job in task-3).
- `password_hash` is a normal model attribute (no `defaultScope` exclusion) — per design, callers omit
  it from responses. AuthService (task-3) needs it on the instance for `bcryptjs.compare`.
- All 16 backend tests pass; `pnpm --filter @centry/backend build` and `pnpm lint` are clean.
