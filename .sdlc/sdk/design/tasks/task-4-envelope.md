# Task 4: Implement envelope serialiser

## Trace
- **FR-IDs:** FR-06
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/sdk/src/envelope.ts` — create
- `packages/sdk/src/envelope.test.ts` — create

## Design References
- design.md §Architecture (envelope.ts component)
- design.md §Interface Contracts (envelope.build)
- design.md §Design Decisions (Envelope format: 1+2N lines vs FR-06's 3-line batch)

## Contracts (task-specific)

### Internal Interfaces
- `build(logs: LogItem[]) -> string`
  - Pre: `logs` is a non-empty array of `LogItem`
  - Post: returns a string of `1 + 2N` newline-separated JSON lines with NO trailing newline
    - Line 1: envelope header `{ sdk_version, sent_at, source }` (matches `@centry/shared` `EnvelopeHeader`)
    - For each log item (lines 2k, 2k+1): `{ type: "log", length: 1 }` + serialised `LogItem`

## Acceptance Criteria

### FR-06: Envelope format

**Happy path:**
- GIVEN `build([log1, log2])` is called
- WHEN serialised
- THEN the output SHALL have exactly `1 + 2*2 = 5` lines split by `\n`
- AND line 1 SHALL be valid JSON with `sent_at` and `sdk_version`
- AND line 2 SHALL be valid JSON with `type: "log"` and `length: 1`
- AND line 3 SHALL be valid JSON matching `log1`
- AND there SHALL be NO trailing newline

**Single item:**
- GIVEN `build([log1])` is called
- THEN the output SHALL have exactly 3 lines

**Compatibility with parseEnvelope:**
- GIVEN the envelope string is passed to `@centry/shared` `parseEnvelope`
- THEN each `LogItem` SHALL be reconstructed with correct `timestamp`, `level`, `body`

## Done Criteria
- [ ] `build([log1, log2])` produces exactly 5 `\n`-separated lines
- [ ] No trailing newline in output
- [ ] Line 1 is valid JSON with `sent_at` (ISO string) and `sdk_version`
- [ ] Each item-header line has `{ type: "log", length: 1 }`
- [ ] Each item-payload line is valid JSON matching the original `LogItem`
- [ ] Output is compatible with `@centry/shared` `parseEnvelope` (items round-trip correctly)
- [ ] All `envelope.test.ts` cases pass
