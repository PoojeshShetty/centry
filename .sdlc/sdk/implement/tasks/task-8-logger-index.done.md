# Task 8 Completion: Implement logger methods and wire public API in index.ts

## Summary
Created `logger.ts` with six log-level methods (`trace/debug/info/warn/error/fatal`) as thin wrappers over `captureLog`, each mapped to the correct severity number. Replaced the stub `index.ts` with the full public API re-exports.

## Commits
- `f0b98bb` feat(sdk): implement logger methods and wire public API in index.ts (FR-02, FR-09)

## Deviations
None

## Difficulties
- `pnpm build` for the SDK fails with `Cannot find module 'express'` — pre-existing issue unrelated to this task (confirmed via git stash check). All tests pass.
