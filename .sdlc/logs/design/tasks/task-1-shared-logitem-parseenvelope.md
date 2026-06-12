# Task 1: Update LogItem type and implement parseEnvelope in @centry/shared

## Trace
- **FR-IDs:** FR-01, FR-02
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/shared/src/index.ts` — modify
- `packages/shared/src/tests/parseEnvelope.test.ts` — create

## Design References
- design.md §Data Models (Updated `LogItem`, `SeverityLevel` enum)
- design.md §Design Decisions (LogItem type: clean breaking change)
- design.md §Design Decisions (parseEnvelope error handling: throw on header, skip on items)

## Contracts (task-specific)

### Internal Interfaces
- `parseEnvelope(raw: string) -> Envelope`
  - Pre: `raw` is a UTF-8 newline-delimited string
  - Post: returns `{ header: EnvelopeHeader, items: LogItem[] }`; throws `EnvelopeParseError` if line 1 fails JSON.parse; silently skips item pairs whose payload fails JSON.parse

## Acceptance Criteria

### FR-01: LogItem type
- GIVEN the `@centry/shared` package is imported
- WHEN a `LogItem` object is constructed with all fields
- THEN TypeScript SHALL accept `timestamp: number`, `level: string`, `severity_number: number`, `body: string`, and optional `trace_id`, `span_id`, `attributes`
- AND `SeverityLevel` SHALL include TRACE, DEBUG, INFO, WARN, ERROR, FATAL

### FR-02: parseEnvelope — happy path
- GIVEN a valid 3-line envelope string (header / item-header / payload)
- WHEN `parseEnvelope(raw)` is called
- THEN it SHALL return `{ header, items }` where `items` contains the parsed log record

### FR-02: parseEnvelope — malformed header
- GIVEN an envelope whose first line is not valid JSON
- WHEN `parseEnvelope(raw)` is called
- THEN it SHALL throw `EnvelopeParseError`

### FR-02: parseEnvelope — empty items
- GIVEN an envelope with only a header line (no items)
- WHEN `parseEnvelope(raw)` is called
- THEN it SHALL return `{ header, items: [] }`

## Done Criteria
- [ ] `LogItem` interface has fields: `timestamp: number`, `level: string`, `severity_number: number`, `body: string`, `trace_id?: string`, `span_id?: string`, `attributes?: Record<string, unknown>`
- [ ] Old fields (`severity`, `message`, `timestamp: string`) and `Attribute` type alias are removed
- [ ] `SeverityLevel` enum exports TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- [ ] `parseEnvelope` splits on `\n`, parses line 1 as envelope header, processes remaining lines in pairs
- [ ] `parseEnvelope` throws `EnvelopeParseError` when line 1 fails JSON.parse
- [ ] `parseEnvelope` silently skips a pair where the payload line fails JSON.parse
- [ ] All three acceptance-criteria scenarios pass in `parseEnvelope.test.ts`
