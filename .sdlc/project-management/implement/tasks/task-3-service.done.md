# Task 3 Completion: Create ProjectService with business logic

## Summary
Implemented `ProjectService` with five methods (list, create, update, archive, rotateKey), `ProjectNotFoundError` and `ProjectForbiddenError` error classes, Zod validation schemas, and DSN construction. Exported all public symbols from `services/index.ts`. 14 unit tests written TDD-style with mocked repositories.

## Commits
- `1b1dcbd` feat(project-management): implement ProjectService with business logic (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07)

## Deviations
- **Rule 1: Bug** — initial `list` and `update` implementations used dynamic `import()` inside service methods, which bypassed Vitest's `vi.mock` hoisting. Fixed by using the top-level static import of `ProjectKeyRepository`. Test mock was also updated to include `findActiveByProjectId`.

## Difficulties
- None beyond the mock bypass issue noted above.
