# Logs — Requirements

- **Path:** `.`
- **Branch:** `feature/logging-flow` (from `dev`)

---

## Purpose

Enable any application to ship structured log records to centry and query them by level, time, and
text — giving developers a searchable, filterable view of what their application logged.

---

## User Stories

- As a developer, I want to POST log records to centry so my application's events are stored and queryable.
- As a developer, I want to filter logs by level, time range, and text search so I can find relevant events quickly.
- As a developer, I want to click a log row and see all its attributes so I can understand the full context of an event.
- As a developer, I want seeded dummy logs so I can validate the UI and backend without running a real SDK.

---

## Functional Requirements

### Shared package

- **FR-01:** `@centry/shared` SHALL export an updated `LogItem` type with fields:
  `timestamp` (number — unix epoch secs), `level` (string), `severity_number` (number),
  `body` (string), `trace_id` (string, optional), `span_id` (string, optional),
  `attributes` (Record<string, unknown>, optional).
- **FR-02:** `parseEnvelope` in `@centry/shared` SHALL be implemented: accept a raw UTF-8
  newline-delimited string, parse the envelope header line and each item (header + payload),
  and return `{ header: EnvelopeHeader, items: LogItem[] }`. A line that fails JSON.parse
  SHALL throw `EnvelopeParseError`.

### Backend — data layer

- **FR-03:** The backend SHALL have a `Log` Sequelize model with fields: `id` (UUID, pk),
  `project_id` (UUID, fk → projects), `timestamp` (FLOAT — unix epoch secs), `level` (STRING),
  `severity_number` (INTEGER), `body` (TEXT), `trace_id` (STRING, nullable),
  `span_id` (STRING, nullable), `attributes` (JSONB), `received_at` (DATE, default now).
- **FR-04:** A migration SHALL create the `logs` table and add indexes on
  `(project_id, timestamp DESC)`, `(project_id, level)`, and a GIN index on `body` for
  full-text search.

### Backend — auth middleware

- **FR-05:** A `requireIngestKey` middleware SHALL parse the `X-Sentry-Auth` header, extract
  `sentry_key`, look up `project_keys` by `public_key`, and confirm the key's `project_id`
  matches the `:projectId` route param. Return 401 if the key is missing/invalid, 403 if
  the project ID does not match.
- **FR-06:** ~~`requireReadToken` (removed)~~ The query endpoint SHALL be protected by the
  existing `requireAuth` JWT middleware. The authenticated `accountId` SHALL be verified to
  own the `:projectId` (project's `account_id` matches). Return 401 if no/invalid JWT, 403 if
  the account does not own the project. No `read_token` column is required on `projects`.

### Backend — ingest endpoint

- **FR-07:** `POST /api/:projectId/envelope/` SHALL be protected by `requireIngestKey`, accept
  `Content-Type: application/x-sentry-envelope` as raw text (NOT `express.json()`), call
  `parseEnvelope`, filter items where `type === "log"`, and bulk-insert all valid log records
  in a single query. A valid envelope SHALL always return `200 { id }`.
- **FR-08:** A malformed individual item within an otherwise valid envelope SHALL be skipped
  and counted (not cause a 500). A malformed envelope body SHALL return `400`. Auth runs
  before any body parsing.

### Backend — query endpoint

- **FR-09:** `GET /api/:projectId/logs` SHALL be protected by `requireAuth` + project ownership check, and support
  query filters: `level` (comma-separated list), `search` (body text, case-insensitive),
  `start` and `end` (unix epoch timestamps), `cursor` (opaque pagination cursor),
  `limit` (integer, default 50, max 200). Results SHALL be ordered newest-first.
- **FR-10:** The query endpoint SHALL return `{ logs: LogItem[], nextCursor: string | null, hasMore: boolean }`.
  Cursor-based pagination SHALL use the `timestamp` + `id` of the last returned row.

### Backend — seeder

- **FR-11:** A seeder script SHALL insert at least 50 dummy log records spread across all
  severity levels (trace, debug, info, warn, error, fatal), varied timestamps (last 7 days),
  varied bodies and attribute payloads, associated with the first project found in the
  database. Running the seeder a second time SHALL NOT create duplicates (idempotent or
  guarded by a check).

### Frontend — logs explorer

- **FR-12:** A `/projects/:projectId/logs` route and page SHALL be added to the frontend,
  reachable from the existing ProjectDetailPanel. The page SHALL fetch logs from
  `GET /api/:projectId/logs` using the account's JWT token (no `read_token` needed).
- **FR-13:** A `FilterBar` component SHALL provide: level multi-select pills (ALL / TRACE /
  DEBUG / INFO / WARN / ERROR / FATAL, default ALL), a debounced text search input (300ms),
  and time-range preset buttons (1 h / 6 h / 24 h / 7 d).
- **FR-14:** A `LogStream` component SHALL render logs in a virtualised list (newest-first)
  with infinite scroll: loading the next page when the user scrolls near the bottom (cursor
  pagination).
- **FR-15:** Each `LogRow` SHALL display: a relative timestamp (ISO on hover), a colour-coded
  level badge, and the log body. Level colours SHALL be: trace=gray, debug=purple, info=blue,
  warn=amber, error=red, fatal=dark-red.
- **FR-16:** Clicking a `LogRow` SHALL open a `LogDetailDrawer` (right slide-in) showing: full
  body, an attributes key/value table, `trace_id` and `span_id` with copy-to-clipboard, and a
  raw-JSON toggle. The drawer SHALL close on Esc or outside-click.
- **FR-17:** All filter state (level, search, start, end) SHALL be synced to URL query params
  so the view is bookmarkable and shareable.
- **FR-18:** The logs page SHALL show an empty state ("No logs found") when the query returns
  zero results, and an error state ("Failed to load — retry") with a retry action when the
  fetch fails.

---

## Acceptance Criteria

### FR-01: LogItem type

- GIVEN the `@centry/shared` package is imported
- WHEN a `LogItem` object is constructed with all fields
- THEN TypeScript SHALL accept `timestamp: number`, `level: string`, `severity_number: number`,
  `body: string`, and optional `trace_id`, `span_id`, `attributes`
- AND the existing `SeverityLevel` enum SHALL remain exported

### FR-02: parseEnvelope

**Happy path:**
- GIVEN a valid 3-line envelope string (header / item-header / payload)
- WHEN `parseEnvelope(raw)` is called
- THEN it SHALL return `{ header, items }` where `items` contains the parsed log record

**Failure path:**
- GIVEN an envelope with a malformed JSON line
- WHEN `parseEnvelope(raw)` is called
- THEN it SHALL throw `EnvelopeParseError`

**Edge case:**
- GIVEN an envelope with zero items (header only)
- WHEN `parseEnvelope(raw)` is called
- THEN it SHALL return `{ header, items: [] }`

### FR-03 / FR-04: Log model and migration

- GIVEN the migration runs against a fresh database
- WHEN `db.Log.create({ project_id, timestamp, level, severity_number, body })` is called
- THEN the record is persisted and retrievable
- AND querying by `project_id` with an `ORDER BY timestamp DESC` uses the index

### FR-05: requireIngestKey middleware

**Happy path:**
- GIVEN a valid `X-Sentry-Auth` header with a known `sentry_key` matching `:projectId`
- WHEN the middleware runs
- THEN it SHALL call `next()` and attach the project to `req`

**401 path:**
- GIVEN an `X-Sentry-Auth` header with an unknown `sentry_key`
- WHEN the middleware runs
- THEN it SHALL return `401`

**403 path:**
- GIVEN a valid key that belongs to a different project
- WHEN the middleware runs
- THEN it SHALL return `403`

### FR-06: Query auth — JWT + project ownership

**Happy path:**
- GIVEN a valid JWT whose `accountId` owns `:projectId`
- WHEN the middleware runs
- THEN it SHALL call `next()`

**401 path:**
- GIVEN a missing or invalid JWT
- WHEN the middleware runs
- THEN it SHALL return `401`

**403 path:**
- GIVEN a valid JWT whose `accountId` does NOT own `:projectId`
- WHEN the middleware runs
- THEN it SHALL return `403`

### FR-07: Ingest endpoint — happy path

- GIVEN a valid envelope POST with a known ingest key
- WHEN `POST /api/:projectId/envelope/` is called
- THEN it SHALL return `200 { id }` and the log records SHALL appear in the `logs` table

### FR-08: Ingest endpoint — resilience

**Malformed item:**
- GIVEN an envelope where one item payload is not valid JSON
- WHEN the endpoint handles the request
- THEN it SHALL return `200` and insert only the valid items (skipping the malformed one)

**Malformed body:**
- GIVEN a POST body that is not a valid envelope (e.g. plain JSON)
- WHEN the endpoint handles the request
- THEN it SHALL return `400`

### FR-09 / FR-10: Query endpoint

**Happy path:**
- GIVEN logs exist for a project
- WHEN `GET /api/:projectId/logs` is called with a valid JWT belonging to the project owner
- THEN it SHALL return `{ logs, nextCursor, hasMore }` ordered newest-first

**Level filter:**
- GIVEN logs of mixed levels exist
- WHEN `?level=error,fatal` is passed
- THEN only error and fatal logs SHALL be returned

**Cursor pagination:**
- GIVEN more logs exist than the limit
- WHEN the client sends the `nextCursor` from the first response
- THEN the next page SHALL start after the last row of the previous page with no duplicates

**Search filter:**
- GIVEN logs with bodies containing "timeout"
- WHEN `?search=timeout` is passed
- THEN only matching logs SHALL be returned (case-insensitive)

### FR-11: Seeder

- GIVEN a project exists in the database
- WHEN the seeder is run
- THEN at least 50 log records SHALL exist spanning all 6 severity levels
- AND running the seeder again SHALL NOT increase the count

### FR-12: Logs page route

- GIVEN the user is on the ProjectDetailPanel
- WHEN they navigate to `/projects/:projectId/logs`
- THEN the logs page SHALL render and begin fetching logs

### FR-13: FilterBar

- GIVEN the logs page is open
- WHEN the user selects the "error" level pill
- THEN only error-level logs SHALL be displayed
- AND the URL SHALL update with `?level=error`

### FR-14: LogStream virtualisation

- GIVEN 200 log records are returned
- WHEN the page renders
- THEN only the visible rows SHALL be in the DOM (virtualised)
- AND scrolling to the bottom SHALL trigger loading the next page

### FR-15: LogRow level colours

- GIVEN a log with `level = "error"`
- WHEN it is rendered as a LogRow
- THEN the level badge SHALL be red

### FR-16: LogDetailDrawer

- GIVEN a LogRow is clicked
- WHEN the drawer opens
- THEN it SHALL display the body, attributes table, and trace_id/span_id
- AND pressing Esc SHALL close the drawer

### FR-17: URL state sync

- GIVEN the user sets filters (level + search)
- WHEN the page URL is copied and opened in a new tab
- THEN the same filter state SHALL be restored

### FR-18: Empty and error states

- GIVEN no logs match the current filters
- THEN the page SHALL show "No logs found"

- GIVEN the API call fails
- THEN the page SHALL show "Failed to load — retry" with a retry button

---

## Constraints

### In Scope

- `@centry/shared`: Updated `LogItem` type + implemented `parseEnvelope`
- Backend `logs` Sequelize model, migration (with indexes), repository
- `requireIngestKey` middleware + JWT ownership check on query endpoint
- `POST /api/:projectId/envelope/` ingest endpoint
- `GET /api/:projectId/logs` query endpoint (level / search / time-range / cursor filters)
- Dummy logs seeder (50+ records, all levels, last 7 days)
- Frontend `/projects/:projectId/logs` page with FilterBar, LogStream, LogRow, LogDetailDrawer
- URL query-param state sync for all filters

### Out of Scope

- SDK (`@centry/sdk`) — deferred; logs will be seeded directly for MVP validation
- Redis rate limiting — deferred to M4 polish
- Live tail / SSE / WebSocket — deferred; polling is the upgrade path
- Volume sparkline (`GET /logs/volume`) — deferred to M4 polish
- `ADMIN_TOKEN` management endpoints (create account/project/key) — already built via project-management feature
- Log retention cron — deferred to M4 polish

### Prohibitions

- SHALL NOT use `express.json()` on the ingest route — the envelope is newline-delimited text, not a JSON object
- SHALL NOT throw from `parseEnvelope` on a malformed item — skip and count
- SHALL NOT load all logs into the DOM — virtualise the list
- SHALL NOT store ingest keys in frontend localStorage or logs
- SHALL NOT add UI features beyond what is listed (no project switcher, no auth flows, no settings)

### Testing Approach

- **TDD** — write failing tests first for all units, then implement to pass:
  - `parseEnvelope` (shared): unit tests covering happy path, malformed line, empty items
  - Auth middleware (backend): unit tests for 200/401/403 cases
  - Ingest endpoint (backend): integration tests for valid envelope → DB rows; malformed item → 200 skip; bad body → 400
  - Query endpoint (backend): integration tests for filters, cursor pagination, `hasMore`
  - Frontend components: component tests for FilterBar interactions, LogRow rendering, LogDetailDrawer open/close, URL sync
