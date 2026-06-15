# Task 2: Implement Error stack trace parser

## Trace
- **FR-IDs:** FR-04
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/sdk/src/stackTrace.ts` — create
- `packages/sdk/src/stackTrace.test.ts` — create

## Design References
- design.md §Architecture (stackTrace.ts component)
- design.md §Data Models (StackFrame)
- design.md §Interface Contracts (parseStack)

## Contracts (task-specific)

### Internal Interfaces
- `parseStack(stack: string) -> StackFrame[]`
  - Pre: `stack` is the string from `new Error().stack` (may be empty or undefined-safe)
  - Post: parses V8 stack format; strips frames where `filename` contains `@centry/sdk`; returns remaining `StackFrame[]`

## Acceptance Criteria

### FR-04: Stack trace capture

**Parsing:**
- GIVEN a V8-format stack string with multiple frames
- WHEN `parseStack(stack)` is called
- THEN it SHALL return an array of `StackFrame` objects with `filename`, `function`, `lineno`, `colno` populated where available

**SDK-internal frame stripping:**
- GIVEN a stack that includes frames with filenames containing `@centry/sdk`
- WHEN `parseStack(stack)` is called
- THEN those frames SHALL NOT appear in the returned array

**Empty/malformed stack:**
- GIVEN an empty string or unparseable stack
- WHEN `parseStack` is called
- THEN it SHALL return `[]` without throwing

## Done Criteria
- [ ] `parseStack` correctly parses standard V8 `Error.stack` format
- [ ] Frames with `@centry/sdk` in filename are stripped from output
- [ ] `lineno` and `colno` are numbers when present, omitted when not
- [ ] Returns `[]` for empty input without throwing
- [ ] All `stackTrace.test.ts` cases pass
