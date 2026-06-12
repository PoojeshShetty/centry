# Task 4: Backend — LogRepository, ingest endpoint, and query endpoint

## Trace
- **FR-IDs:** FR-07, FR-08, FR-09, FR-10
- **Depends on:** task-2, task-3
- **Design:** ../design.md

## Files
- `packages/backend/src/repositories/log.ts` — create
- `packages/backend/src/repositories/index.ts` — modify
- `packages/backend/src/routes/project.ts` — modify
- `packages/backend/src/index.ts` — modify
- `packages/backend/src/tests/repositories/log.test.ts` — create
- `packages/backend/src/tests/routes/ingest.test.ts` — create
- `packages/backend/src/tests/routes/logs.test.ts` — create
- `packages/backend/src/tests/routes/project.test.ts` — update (interface change)

## Design References
- design.md §Architecture (LogRepository, ingestHandler, queryHandler)
- design.md §Interface Contracts (API endpoints, LogRepository internal interfaces)
- design.md §Data Flow (Ingest path, Query path)
- design.md §Design Decisions (Cursor pagination: base64(JSON) vs offset)

## Contracts (task-specific)

### API Endpoints
- `POST /api/projects/:id/envelope/`
  - Auth: `requireIngestKey`
  - Content-Type: `application/x-sentry-envelope` (raw text via `express.text()`)
  - Input: newline-delimited envelope string
  - Output: `200 { id: string }`
  - Errors: `400` malformed envelope body, `401` missing/invalid ingest key, `403` key belongs to different project

- `GET /api/projects/:id/logs`
  - Auth: `requireAuth` + `requireProjectOwner`
  - Query params: `level` (comma-separated), `search`, `start`, `end`, `cursor`, `limit` (default 50, max 200)
  - Output: `200 { logs: LogItem[], nextCursor: string | null, hasMore: boolean }`
  - Errors: `401`, `403`

### Internal Interfaces
- `LogRepository.bulkCreate(projectId: string, items: LogItem[]) -> Promise<Log[]>`
  - Pre: `projectId` exists in `projects`
  - Post: all items inserted in a single `bulkCreate` call

- `LogRepository.findWithFilters(projectId: string, filters: LogFilters) -> Promise<{ rows: Log[], nextCursor: string | null, hasMore: boolean }>`
  - Cursor decodes to `{ ts: number, id: string }`; clause: `timestamp < ts OR (timestamp = ts AND id < id)`
  - Results ordered `timestamp DESC, id DESC`
  - `hasMore` = true when a `(limit + 1)`th row exists

## Acceptance Criteria

### FR-07: Ingest endpoint — happy path
- GIVEN a valid envelope POST with a known ingest key
- WHEN `POST /api/projects/:id/envelope/` is called
- THEN it SHALL return `200 { id }` and the log records SHALL appear in the `logs` table

### FR-08: Ingest endpoint — malformed item
- GIVEN an envelope where one item payload is not valid JSON
- WHEN the endpoint handles the request
- THEN it SHALL return `200` and insert only the valid items (skipping the malformed one)

### FR-08: Ingest endpoint — malformed body
- GIVEN a POST body that is not a valid envelope
- WHEN the endpoint handles the request
- THEN it SHALL return `400`

### FR-09 / FR-10: Query endpoint — happy path
- GIVEN logs exist for a project
- WHEN `GET /api/projects/:id/logs` is called with a valid JWT belonging to the project owner
- THEN it SHALL return `{ logs, nextCursor, hasMore }` ordered newest-first

### FR-09 / FR-10: Query endpoint — level filter
- GIVEN logs of mixed levels exist
- WHEN `?level=error,fatal` is passed
- THEN only error and fatal logs SHALL be returned

### FR-09 / FR-10: Query endpoint — cursor pagination
- GIVEN more logs exist than the limit
- WHEN the client sends the `nextCursor` from the first response
- THEN the next page SHALL start after the last row with no duplicates

### FR-09 / FR-10: Query endpoint — search filter
- GIVEN logs with bodies containing "timeout"
- WHEN `?search=timeout` is passed
- THEN only matching logs SHALL be returned (case-insensitive)

## Done Criteria
- [ ] `express.text({ type: 'application/x-sentry-envelope' })` applied only to the ingest route (NOT `express.json()`)
- [ ] `ingestHandler` calls `parseEnvelope`, filters `type === 'log'`, calls `LogRepository.bulkCreate`, returns `200 { id }`
- [ ] Malformed envelope body caught and returns `400`; malformed items skipped (not 500)
- [ ] `queryHandler` parses all filter query params, calls `LogRepository.findWithFilters`, returns `{ logs, nextCursor, hasMore }`
- [ ] `LogRepository.bulkCreate` performs a single Sequelize `bulkCreate` call
- [ ] `LogRepository.findWithFilters` applies `level` IN filter, `iLike` search on body, `start`/`end` timestamp range, cursor clause, and `limit + 1` probe for `hasMore`
- [ ] Cursor is base64-encoded JSON `{ ts, id }` and decoded on next request
- [ ] All ingest and query test scenarios pass
