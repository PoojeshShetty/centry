# Task 5 Completion: Create useProjectStore and frontend API client methods

## Summary
Created `useProjectStore` (Zustand) with all project state actions and exported `Project`/`ProjectWithDsn` types. Added `projectApi` namespace to `apiClient.ts` covering all five project endpoints.

## Commits
- `9648bfe` feat(project-management): implement useProjectStore and projectApi methods (FR-08, FR-09, FR-10)

## Deviations
None

## Difficulties
- `jest.mock` with a factory does not correctly intercept transitive ESM imports in native ESM Jest — `jest.fn()` objects in the factory were not behaving as mocks. Resolved by switching to `jest.unstable_mockModule` with the mock object defined outside the factory, then using dynamic `await import(...)` for the module under test.
