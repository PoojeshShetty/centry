# Design: logs

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18
- **Requirements:** ../requirements.md

---

## Architecture

### Components

**`@centry/shared`**
- `LogItem` (interface) — updated shape; canonical log record type — modified
- `SeverityLevel` (enum) — adds TRACE — modified
- `EnvelopeHeader` (interface) — unchanged — existing
- `EnvelopeParseError` (class) — unchanged — existing
- `parseEnvelope` (function) — implemented (was stub) — modified

**`@centry/backend`**
- `Log` (Sequelize model) — persists log records — new
- `LogRepository` — data-access for bulk insert and filtered query — new
- `requireIngestKey` (middleware) — authenticates SDK ingest requests via `X-Sentry-Auth` — new
- `requireProjectOwner` (middleware) — verifies JWT account owns the route's `:id` project — new
- `ingestHandler` + `queryHandler` (route handlers) — added to `projectRouter` — new
- Sequelize migration — creates `logs` table with indexes — new
- `seed-logs.ts` (seeder script) — inserts 50+ dummy log records — new

**`@centry/frontend`**
- `LogsPage` (`/projects/:projectId/logs`) — top-level logs explorer page — new
- `FilterBar` — level pills, debounced search, time-range presets — new
- `LogStream` — virtualised list with infinite scroll (`@tanstack/react-virtual`) — new
- `LogRow` — single log entry with level badge and relative timestamp — new
- `LogDetailDrawer` — slide-in drawer with full log detail — new
- `useLogStore` (Zustand) — logs list, filter state, fetch/pagination actions — new
- `logApi` — API client functions for the logs endpoints — new
- `paths.projectLogs` — new path entry in routes — modified

### Data Flow

**Ingest path (FR-07/FR-08):**
```
SDK POST /api/projects/:id/envelope/
  → requireIngestKey (parse X-Sentry-Auth, look up project_keys, attach req.project)
  → express.text() parses raw body
  → parseEnvelope(raw) → { header, items }  [throws EnvelopeParseError on bad header → 400]
  → filter items where type === 'log', skip malformed payloads
  → LogRepository.bulkCreate(projectId, items)
  → 200 { id: uuid }
```

**Query path (FR-09/FR-10):**
```
Frontend GET /api/projects/:id/logs?level=&search=&start=&end=&cursor=&limit=
  → requireAuth (verify JWT, set req.accountId)
  → requireProjectOwner (fetch project, check account_id === req.accountId, attach req.project)
  → LogRepository.findWithFilters(projectId, filters)
  → 200 { logs: LogItem[], nextCursor: string|null, hasMore: boolean }
```

**Frontend render path (FR-12–FR-18):**
```
Route /projects/:projectId/logs
  → LogsPage mounts, reads projectId from URL params
  → useLogStore.fetchLogs() → logApi.query() → GET /api/projects/:id/logs (JWT from useAuthStore)
  → FilterBar state changes → URL query params updated → re-fetch
  → LogStream renders virtualised rows via @tanstack/react-virtual
  → LogRow click → LogDetailDrawer opens
```

---

## Data Models

### Log (Sequelize model — new table `logs`)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID, PK | default UUIDV4 |
| `project_id` | UUID, FK → projects | NOT NULL |
| `timestamp` | FLOAT | unix epoch secs from SDK |
| `level` | STRING | e.g. `'error'` |
| `severity_number` | INTEGER | e.g. `17` |
| `body` | TEXT | log message |
| `trace_id` | STRING | nullable |
| `span_id` | STRING | nullable |
| `attributes` | JSONB | default `{}` |
| `received_at` | DATE | server-side, default `now()` |

**Sequelize options:** `tableName: 'logs'`, `timestamps: false` (uses `received_at` explicitly).

### Migration indexes

- `(project_id, timestamp DESC)` — primary query + cursor pattern
- `(project_id, level)` — level filter
- `GIN to_tsvector('english', body)` — full-text search for `?search=`

### Updated `LogItem` (shared)

```ts
interface LogItem {
  timestamp: number;
  level: string;
  severity_number: number;
  body: string;
  trace_id?: string;
  span_id?: string;
  attributes?: Record<string, unknown>;
}

enum SeverityLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO  = 'INFO',
  WARN  = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}
```

The `Attribute` type alias and old `severity`/`message`/`timestamp: string` fields are removed (clean breaking change — no existing consumers of the old shape).

---

## Interface Contracts

### API Endpoints

**`POST /api/projects/:id/envelope/`**
- Auth: `requireIngestKey`
- Content-Type: `application/x-sentry-envelope` (raw text, NOT `express.json()`)
- Input: newline-delimited envelope string
- Output: `200 { id: string }`
- Errors: `400` malformed envelope body, `401` missing/invalid ingest key, `403` key belongs to different project

**`GET /api/projects/:id/logs`**
- Auth: `requireAuth` + `requireProjectOwner`
- Query params:
  - `level` — comma-separated list e.g. `error,fatal`
  - `search` — case-insensitive body text
  - `start` / `end` — unix epoch timestamps
  - `cursor` — opaque pagination cursor (base64-encoded JSON)
  - `limit` — integer, default `50`, max `200`
- Output: `200 { logs: LogItem[], nextCursor: string | null, hasMore: boolean }`
- Errors: `401`, `403`

### Internal Interfaces

**`LogRepository.bulkCreate(projectId: string, items: LogItem[]) -> Promise<Log[]>`**
- Pre: `projectId` exists in `projects`
- Post: all items inserted in a single `bulkCreate` call; returns inserted records

**`LogRepository.findWithFilters(projectId: string, filters: LogFilters) -> Promise<{ rows: Log[], nextCursor: string | null, hasMore: boolean }>`**
- `LogFilters`: `{ level?: string[], search?: string, start?: number, end?: number, cursor?: string, limit?: number }`
- Cursor decodes to `{ ts: number, id: string }`; query clause: `timestamp < ts OR (timestamp = ts AND id < id)`
- Results ordered `timestamp DESC, id DESC`
- `hasMore` = true when a `(limit + 1)`th row exists

**`requireIngestKey(req, res, next): void`**
- Parses `X-Sentry-Auth` header, extracts `sentry_key`
- Looks up `ProjectKey` by `public_key`, confirms `project_id` matches `req.params.id`
- Sets `req.project` on success; returns `401` / `403` otherwise

**`requireProjectOwner(req, res, next): void`**
- Fetches `Project` by `req.params.id`
- Confirms `project.account_id === req.accountId` (set by `requireAuth`)
- Sets `req.project` on success; returns `404` / `403` otherwise

**`parseEnvelope(raw: string) -> Envelope`**
- Splits on `\n`, filters empty lines
- Line 1: parses envelope header — throws `EnvelopeParseError` if JSON.parse fails
- Remaining lines in pairs (item-header + item-payload): skips any pair where payload JSON.parse fails
- Returns `{ header: EnvelopeHeader, items: LogItem[] }`

---

## Design Decisions

### Cursor pagination: base64(JSON) vs offset
- **Chosen:** `base64(JSON({ ts, id }))` opaque cursor
- **Rationale:** Logs arrive continuously; offset-based pagination drifts as new rows are inserted at the top, causing skipped or duplicated rows on page 2+. Cursor anchors to a specific row position. `id` breaks ties when two logs share the same `timestamp`.
- **Rejected:** Offset (`?page=N`) — incorrect for live data; simple but wrong

### `parseEnvelope` error handling: throw on header, skip on items
- **Chosen:** Throw `EnvelopeParseError` only for a malformed envelope header (line 1); silently skip item pairs whose payload fails JSON.parse
- **Rationale:** The header being unreadable means the entire batch structure is unknown — nothing can be salvaged. A single corrupt item in a 100-item batch should not discard the 99 valid items. Matches Sentry's own SDK behaviour and the requirements Prohibitions ("SHALL NOT throw from `parseEnvelope` on a malformed item").
- **Rejected:** Throw on any bad JSON line — would 400 an entire batch for one corrupt item

### `LogItem` type: clean breaking change
- **Chosen:** Replace old fields (`severity`, `message`, `timestamp: string`) with new shape (`level`, `body`, `timestamp: number`, `severity_number`, `trace_id`, `span_id`)
- **Rationale:** No existing consumers of the old shape (SDK is a stub, backend and frontend don't yet use `LogItem`). Keeping dead fields pollutes the canonical contract indefinitely.
- **Rejected:** Additive change keeping old fields — unnecessary type pollution with no benefit

### Backend routes: nested under `/api/projects/:id`
- **Chosen:** Add ingest and query handlers to the existing `projectRouter` (`POST /:id/envelope/`, `GET /:id/logs`)
- **Rationale:** User preference; keeps all project-scoped operations under one router
- **Rejected:** Separate `logRouter` at `/api` — would work equally but splits project-scoped routes across two routers

### Virtualisation library: `@tanstack/react-virtual`
- **Chosen:** `@tanstack/react-virtual` (`useVirtualizer` hook)
- **Rationale:** Hooks-based, handles variable-height rows natively (log bodies vary in length), no wrapper component required. Fits the existing hooks-first frontend pattern.
- **Rejected:** `react-window` — more boilerplate for variable heights; `VariableSizeList` requires pre-measuring row heights
