# Design: sdk

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10
- **Requirements:** ../requirements.md

## Architecture

### Components
- `init.ts`: DSN parser + config singleton (`parseDsn`, `init`, `getConfig`) — new
- `logger.ts`: six log-level methods, thin wrappers over `captureLog` — new
- `captureLog.ts`: core pipeline (gate → interpolate → stack → context → build attrs → hook → buffer) — new
- `stackTrace.ts`: `Error().stack` parser → `StackFrame[]`, strips SDK-internal frames — new
- `context.ts`: `AsyncLocalStorage<TraceContext>` singleton + `traceMiddleware` — new
- `buffer.ts`: push / flush / hard-cap / SIGTERM+SIGINT signal handlers — new
- `envelope.ts`: `build(logs)` serialiser producing 1+2N line envelope — new
- `transport.ts`: HTTP POST to backend, never throws — new
- `index.ts`: public API re-exports only — modified (currently stub)

### Data Flow
```
logger.{trace|debug|info|warn|error|fatal}(template, params?, attrs?)
  → captureLog(level, severityNumber, template, params?, attrs?)
      reads: traceStore (AsyncLocalStorage) via context.ts
      reads: getConfig() via init.ts
      calls: parseStack() via stackTrace.ts (error/fatal only)
  → buffer.push(logItem)
      [at 100 items OR every 5s] → buffer.flush()
  → envelope.build(batch: LogItem[]) → string (1+2N lines)
  → transport.send(envelopeStr)
  → POST https://<host>/api/<projectId>/envelope/

traceMiddleware(req, res, next)
  → parse sentry-trace header (or generate fresh traceId + spanId)
  → traceStore.run({ traceId, spanId }, next)
  → set sentry-trace response header
```

## Data Models

### ParsedDsn (internal, init.ts)
- `publicKey (string)`: extracted from DSN username segment
- `host (string)`: extracted from DSN host+port
- `projectId (string)`: extracted from DSN path

### SdkConfig (public, exported from index.ts)
- `dsn (string)`: full DSN `https://<publicKey>@<host>/<projectId>`
- `enableLogs? (boolean)`: default `true`; `false` suppresses all log capture
- `environment? (string)`: attached as `sentry.environment` attribute
- `release? (string)`: attached as `sentry.release` attribute
- `beforeSendLog? ((log: LogItem) => LogItem | null)`: hook called before buffer push; `null` return drops silently

### ResolvedConfig (internal)
`ParsedDsn & SdkConfig` — the singleton stored after `init()` parses the DSN.

### TraceContext (internal, context.ts)
- `traceId (string)`: 32-character hex
- `spanId (string)`: 16-character hex

### StackFrame (internal, stackTrace.ts)
- `filename (string)`
- `function (string)`
- `lineno? (number)`
- `colno? (number)`

### LogItem — re-exported from `@centry/shared` (not redefined)
- `timestamp (number)`: Unix ms
- `level (string)`: `"trace" | "debug" | "info" | "warn" | "error" | "fatal"`
- `severity_number (number)`: `1 | 5 | 9 | 13 | 17 | 21`
- `body (string)`: interpolated message
- `trace_id? (string)`: from AsyncLocalStorage context
- `span_id? (string)`: from AsyncLocalStorage context
- `attributes? (Record<string, unknown>)`: merged SDK + user attributes

## Interface Contracts

### Internal Interfaces

- `parseDsn(dsn: string) -> ParsedDsn`
  - Pre: DSN is a valid URL with a non-empty username (publicKey)
  - Post: returns `{ publicKey, host, projectId }`; throws with descriptive message on invalid DSN

- `init(options: SdkConfig) -> void`
  - Pre: none
  - Post: if already initialised, emits `console.warn` and returns (no-op); otherwise parses DSN, stores `ResolvedConfig` singleton

- `getConfig() -> ResolvedConfig`
  - Pre: `init()` has been called
  - Post: returns the singleton; throws `"call init() before using logger"` if not initialised

- `logger.{trace|debug|info|warn|error|fatal}(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void`
  - Severity numbers: trace=1, debug=5, info=9, warn=13, error=17, fatal=21
  - Post: calls `captureLog` with corresponding level string and severity number

- `captureLog(level: string, severityNumber: number, template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void`
  - Pipeline (in order):
    1. `enableLogs` gate — return early if `false`
    2. Interpolate `template + params` into `body` (replace `%s` placeholders sequentially)
    3. Capture `parseStack(new Error().stack)` for `severityNumber >= 17` (error/fatal), attach as `attributes["error.stack_frames"]` (JSON-stringified)
    4. Read `traceId` / `spanId` from `traceStore.getStore()` (undefined-safe)
    5. Build SDK default attributes: `sentry.sdk.name`, `sentry.sdk.version`, `server.address` (via `os.hostname()`), `sentry.environment`, `sentry.release`, `sentry.message.template`, `sentry.message.parameter.N` for each param
    6. Merge: `{ ...sdkAttrs, ...userAttrs }` (user wins on key clash)
    7. Assemble `LogItem`
    8. Pass through `beforeSendLog` hook; `null` return → drop silently
    9. `buffer.push(logItem)`

- `parseStack(stack: string) -> StackFrame[]`
  - Post: parses `Error().stack` format, strips frames where `filename` contains `@centry/sdk`; returns remaining frames

- `traceStore: AsyncLocalStorage<TraceContext>` (singleton, exported from context.ts)

- `traceMiddleware(req: Request, res: Response, next: NextFunction) -> void`
  - Reads incoming `sentry-trace` header (`<traceId>-<spanId>-<sampled>`)
  - If present: reuse `traceId`, generate fresh `spanId`
  - If absent: generate fresh 32-hex `traceId` and 16-hex `spanId`
  - Runs `next()` inside `traceStore.run({ traceId, spanId }, next)`
  - Sets outgoing `sentry-trace: <traceId>-<spanId>-1` response header

- `buffer.push(item: LogItem) -> void`
  - If `buffer.length >= 1000`: drop item, increment `dropped` counter, return
  - Otherwise: push to buffer; if `buffer.length >= 100` trigger `flush()` immediately

- `buffer.flush() -> Promise<void>`
  - Drains current buffer (swap with empty array), builds envelope, calls `transport.send()`
  - Timer: `setInterval(flush, 5000)` with `.unref()` so it never keeps the process alive
  - SIGTERM/SIGINT: registered once via `process.once`; awaits `flush()` then calls `process.exit(0)`

- `envelope.build(logs: LogItem[]) -> string`
  - Produces 1+2N newline-separated JSON lines (no trailing newline)
  - Line 1: `EnvelopeHeader` — `{ sdk_version, sent_at, source }` (matches `@centry/shared` `EnvelopeHeader` type)
  - Lines 2k, 2k+1 (for each item): `{ type: "log", length: 1 }` + serialised `LogItem`

- `transport.send(envelopeStr: string) -> Promise<void>`
  - Pre: none (safe to call before `init()` — wraps `getConfig()` in try/catch)
  - POSTs to `https://<host>/api/<projectId>/envelope/`
  - Headers: `Content-Type: application/x-sentry-envelope`, `X-Sentry-Auth: Sentry sentry_version=7, sentry_client=<name>/<version>, sentry_key=<publicKey>`
  - Non-2xx: logs status to `console.error`, does not throw
  - Network error: swallows, logs to `console.error`, does not throw
  - Post: never throws under any circumstances

### Public API (index.ts exports)
- `init` (function)
- `logger` (object with six methods)
- `traceMiddleware` (Express middleware function)
- `SdkConfig` (TypeScript type)
- `LogItem` (TypeScript type, re-exported from `@centry/shared`)

## Design Decisions

### Envelope format: 1+2N lines vs FR-06's 3-line batch
- **Chosen:** 1+2N lines — one `(item-header, LogItem)` pair per log item; envelope header uses `EnvelopeHeader` shape from `@centry/shared` (`sdk_version`, `sent_at`, `source`)
- **Rationale:** `parseEnvelope` in `@centry/shared` iterates item-payload lines as individual `LogItem` objects. FR-06's `{ items: [...] }` payload would be parsed as a single malformed `LogItem` with no `timestamp`/`level`/`body` — all log data silently lost in `LogRepository.bulkCreate`. `@centry/shared` cannot be modified (constraint).
- **Rejected:** FR-06's 3-line batch format with `{ items: [...] }` as line 3 — incompatible with the fixed `parseEnvelope` implementation

### Config singleton: module-level variable + getConfig()
- **Chosen:** `let config: ResolvedConfig | null = null` in `init.ts`, shared across modules via `getConfig()` import
- **Rationale:** Node's module cache guarantees one instance per process. Simple, zero-overhead, no indirection.
- **Rejected:** Dependency injection (passing config as parameter) — would require threading config through every module and every logger call site

### Signal handling: process.once + async flush + process.exit(0)
- **Chosen:** `process.once('SIGTERM', ...)` and `process.once('SIGINT', ...)` registered once in `buffer.ts`; awaits `flush()` then calls `process.exit(0)`
- **Rationale:** Ensures buffered logs are shipped before process dies under Docker/Kubernetes termination (SIGTERM) and Ctrl+C (SIGINT). `process.once` prevents double-flush if the signal fires multiple times.
- **Rejected:** `process.on('beforeExit')` — only fires when the event loop empties naturally; does not fire on SIGTERM/SIGINT from orchestrators

### AsyncLocalStorage: single exported singleton
- **Chosen:** One `AsyncLocalStorage<TraceContext>` instance exported from `context.ts` as `traceStore`
- **Rationale:** Both `traceMiddleware` (writer) and `captureLog` (reader) need the same reference. A single named export is the simplest shared reference.
- **Rejected:** Re-creating the store per request or passing context as parameters — breaks the zero-parameter-passing contract of `logger.info()`
