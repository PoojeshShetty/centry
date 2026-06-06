# Task 2 Completion: Define typed Account Sequelize model

## Summary
Created `src/models/account.ts` with a fully typed Sequelize `Account` class (UUID PK, non-null name, auto-managed `created_at`, no `updated_at`). Added `src/models/index.ts` barrel re-export. TDD tests mock the sequelize singleton and assert attribute types and constraints.

## Commits
- `2c7d1f7` test(backend-foundation): add failing Account model tests (FR-04, FR-07)
- `5169144` feat(backend-foundation): define typed Account Sequelize model (FR-04, FR-07)

## Deviations
- **Rule 1: Bug** — test assertion `toBe(DataTypes.UUIDV4)` was wrong; Sequelize instantiates the class before storing as `defaultValue`. Fixed to `toBeInstanceOf(DataTypes.UUIDV4)`.
- **Rule 1: Bug** — test assertion `attrs.updatedAt ?? attrs.updated_at` caused `tsc` errors (fields not on typed attrs object). Fixed to `Object.keys(attrs)` contains check.

## Difficulties
None beyond the test assertion corrections above.

## Notes
`DataTypes.UUIDV4` is the constructor class; Sequelize stores an instance of it in `defaultValue` — use `toBeInstanceOf` not `toBe` when asserting defaults in vitest.
