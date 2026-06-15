# Task 4 Completion: Implement envelope serialiser

## Summary
Created `envelope.ts` exporting `build(logs: LogItem[]) -> string` that produces a 1+2N line newline-separated envelope string compatible with `@centry/shared`'s `parseEnvelope`. Added 7 Vitest tests covering line counts, no trailing newline, header shape, item-header shape, payload equality, and round-trip compatibility.

## Commits
- `ce0cf49` feat(sdk): implement envelope serialiser (FR-06)

## Deviations
None

## Difficulties
None
