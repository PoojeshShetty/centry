# Task 1 Completion: Update LogItem type and implement parseEnvelope in @centry/shared

## Summary
Updated `LogItem` interface to the new shape (`timestamp: number`, `level`, `severity_number`, `body`, optional `trace_id`/`span_id`/`attributes`), added `TRACE` to `SeverityLevel`, removed the `Attribute` type alias, and implemented `parseEnvelope` with correct error-handling semantics (throw on bad header, skip on bad item payload). Added vitest to `@centry/shared` as it had no test runner.

## Commits
- `dfc61df` test(logs): add failing tests for parseEnvelope (FR-01, FR-02)
- `bcd2729` feat(logs): update LogItem type and implement parseEnvelope in shared (FR-01, FR-02)

## Deviations
- **Rule 3: Blocking** — `@centry/shared` had no test runner configured. Added vitest devDependency and `test` script to `package.json` to unblock the TDD RED phase.

## Difficulties
None.
