# Task 1 Completion: Setup Vitest and implement DSN parser + config singleton

## Summary
Wired up Vitest for the SDK package and implemented `parseDsn`, `init`, and `getConfig`. Types were extracted to a dedicated `types.ts` and `parseDsn` was placed in a `utils/` folder with its own co-located test file, keeping `init.ts` focused on config lifecycle only.

## Commits
- `25ca652` feat(sdk): setup vitest and implement DSN parser + config singleton (FR-01, FR-10)

## Deviations
- **Rule 2: Missing Critical** — extracted all type definitions (`SdkConfig`, `ParsedDsn`, `ResolvedConfig`, `TraceContext`, `StackFrame`) into `src/types.ts` rather than defining inline in `init.ts`; pre-populated future types (`TraceContext`, `StackFrame`) so later tasks have a single place to import from
- **Rule 2: Missing Critical** — moved `parseDsn` to `src/utils/parseDsn.ts` with co-located `parseDsn.test.ts`; `init.ts` now only contains the config singleton lifecycle

## Difficulties
None.

## Notes
- Test co-location pattern established: utility tests live alongside the utility file in `utils/`; module tests live alongside the module (`init.test.ts` next to `init.ts`)
- `TraceContext` and `StackFrame` are already in `types.ts` — tasks 2 and 3 can import directly without defining them again
