# Task 2 Completion: Implement Error stack trace parser

## Summary
Created `stackTrace.ts` with `parseStack` that parses V8 `Error.stack` format into `StackFrame[]`, strips frames whose filename contains `@centry/sdk`, and returns `[]` for empty/malformed input without throwing. Covered by 7 Vitest unit tests.

## Commits
- `593d1f2` test(sdk): add failing tests for parseStack stack trace parser (FR-04)
- `1942b56` feat(sdk): implement parseStack stack trace parser (FR-04)

## Deviations
- **Rule 2: Missing Critical** — anonymous file-only frames (e.g. `at /path/file.ts:5:10`) skip `node:` internal paths to avoid noise; not in spec but matches intent of "strip SDK-internal frames"

## Difficulties
None

## Notes
Two regexes handle the two V8 stack-line shapes: `at FnName (file:line:col)` and `at file:line:col`. The `<anonymous>` sentinel is used as the `function` field when no function name is present.
