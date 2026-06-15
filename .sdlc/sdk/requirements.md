# SDK — Requirements

- **Path:** `.`
- **Branch:** `feature/sdk` (from `dev`)

---

## Purpose

Enable any Node.js application to ship structured logs to centry by installing `@centry/sdk`,
calling `init()` with a DSN, and using the `logger` object — so developers get real-time,
searchable log visibility from their backends without writing HTTP or envelope logic themselves.

---

## User Stories

- As a backend developer, I want to call `init()` once with a DSN so my app is wired to centry without any HTTP setup.
- As a backend developer, I want to call `logger.info/warn/error(...)` so my app events are captured and shipped automatically.
- As a backend developer, I want `logger.error` to auto-attach a stack trace so I can debug failures without extra instrumentation.
- As a backend developer, I want to install `traceMiddleware` in Express so all logs within a request carry the same `trace_id` automatically.
- As a backend developer, I want the SDK to never crash my app so logging failures are silent and self-contained.

---

## Functional Requirements

- **FR-01:** `init(options: SdkConfig)` SHALL parse the DSN `https://<publicKey>@<host>/<projectId>` into a `ParsedDsn` and store it as a config singleton available to all SDK modules via `getConfig()`.
- **FR-02:** `logger` SHALL expose six methods — `trace`, `debug`, `info`, `warn`, `error`, `fatal` — each with the signature `(template: string, params?: unknown[], attributes?: Record<string, unknown>) => void`, mapping to severity numbers `1 / 5 / 9 / 13 / 17 / 21`.
- **FR-03:** `captureLog()` SHALL run the following pipeline in order: (1) `enableLogs` gate — return early if `false`; (2) interpolate `template + params` into a human-readable `body`; (3) capture stack frames for `error`/`fatal` only; (4) read `traceId`/`spanId` from `AsyncLocalStorage`; (5) build default SDK attributes (`sentry.sdk.name`, `sentry.sdk.version`, `server.address`, `sentry.environment`, `sentry.release`, `sentry.message.template`, `sentry.message.parameter.N`); (6) merge user-provided attributes (user wins on key clash); (7) assemble `LogItem`; (8) pass through `beforeSendLog` hook — `null` return drops silently; (9) push to buffer.
- **FR-04:** `captureLog()` SHALL auto-capture a stack trace (parsed `Error().stack` stripped of SDK-internal frames) for `error` (severityNumber ≥ 17) and `fatal` log calls, and attach it as `attributes["error.stack_frames"]`.
- **FR-05:** `buffer` SHALL flush at 100 items or every 5 s (timer SHALL be `.unref()`'d); SHALL enforce a hard cap of 1000 items (silently drop and increment a `dropped` counter beyond cap); SHALL flush remaining items on `SIGTERM` and `SIGINT` before process exit.
- **FR-06:** `envelope.build(logs)` SHALL serialise a `LogItem[]` batch into exactly 3 newline-separated JSON lines: (1) envelope header `{ sdk: { name, version }, sent_at }`; (2) item header `{ type: "log", item_count: N, content_type: "application/vnd.sentry.items.log+json" }`; (3) item payload `{ items: [...] }`. No trailing newline.
- **FR-07:** `transport.send(logs)` SHALL POST the envelope to `https://<host>/api/<projectId>/envelope/` with headers `Content-Type: application/x-sentry-envelope` and `X-Sentry-Auth: Sentry sentry_version=7, sentry_client=<name>/<version>, sentry_key=<publicKey>`. A non-2xx response SHALL be logged to `stderr` only. Network errors SHALL be swallowed. The function SHALL never throw.
- **FR-08:** `traceMiddleware` SHALL read the incoming `sentry-trace` header (`<traceId>-<spanId>-<sampled>`); if present reuse `traceId` and generate a new `spanId`; if absent generate a fresh `traceId` and `spanId`. It SHALL run the request handler inside an `AsyncLocalStorage` context so `captureLog` can read the IDs without parameter passing. It SHALL set the outgoing `sentry-trace` response header.
- **FR-09:** The SDK SHALL NOT throw or reject at any point. All errors (transport failure, bad config access, parse errors) SHALL be swallowed or logged to `stderr`.
- **FR-10:** Calling `init()` a second time SHALL NOT overwrite the existing config (no-op or `console.warn`), preventing accidental reconfiguration in middleware-heavy setups.

---

## Acceptance Criteria

### FR-01: DSN parsing and config singleton

**Happy path:**
- GIVEN a valid DSN `https://abc123@localhost:3000/proj-uuid`
- WHEN `init({ dsn })` is called
- THEN `getConfig()` SHALL return `{ publicKey: "abc123", host: "localhost:3000", projectId: "proj-uuid" }`

**Failure path:**
- GIVEN a DSN missing the username segment (no `publicKey`)
- WHEN `init({ dsn })` is called
- THEN the SDK SHALL throw at init time with a descriptive message

**Edge case:**
- GIVEN `getConfig()` is called before `init()`
- THEN it SHALL throw `"call init() before using logger"`

### FR-02: Logger methods

**Happy path:**
- GIVEN the SDK is initialised
- WHEN `logger.error('Payment failed for %s', ['ORD-99'], { 'payment.code': 'declined' })` is called
- THEN `captureLog` SHALL be called with `level: "error"`, `severityNumber: 17`, `template: 'Payment failed for %s'`, `params: ['ORD-99']`, `attributes: { 'payment.code': 'declined' }`

**All levels:**
- GIVEN the SDK is initialised
- WHEN each of `trace/debug/info/warn/error/fatal` is called
- THEN the corresponding severity numbers `1/5/9/13/17/21` SHALL be passed to `captureLog`

### FR-03: captureLog pipeline

**enableLogs gate:**
- GIVEN `init({ enableLogs: false })`
- WHEN `logger.info('msg')` is called
- THEN the buffer SHALL receive no items

**Template interpolation:**
- GIVEN `template = 'User %s logged in'`, `params = ['john']`
- WHEN `captureLog` runs
- THEN `body` SHALL be `'User john logged in'`

**beforeSendLog drop:**
- GIVEN `beforeSendLog` returns `null`
- WHEN `captureLog` runs
- THEN the buffer SHALL receive no items

**Attribute merge:**
- GIVEN SDK default attributes and user attribute with the same key
- WHEN merged
- THEN the user-provided value SHALL win

### FR-04: Stack trace capture

**error/fatal:**
- GIVEN `logger.error(...)` is called
- WHEN `captureLog` runs
- THEN `attributes["error.stack_frames"]` SHALL be a JSON-stringified array of `StackFrame[]`
- AND SDK-internal frames (containing `@centry/sdk`) SHALL be stripped

**trace/info/warn:**
- GIVEN `logger.info(...)` is called
- WHEN `captureLog` runs
- THEN `attributes["error.stack_frames"]` SHALL NOT be set

### FR-05: Buffer flush and cap

**Size trigger:**
- GIVEN 99 items are in the buffer
- WHEN the 100th item is pushed
- THEN `flush()` SHALL be called immediately

**Hard cap:**
- GIVEN 1000 items are in the buffer
- WHEN a 1001st item is pushed
- THEN the item SHALL be dropped and `dropped` counter SHALL increment

**SIGTERM flush:**
- GIVEN items are in the buffer
- WHEN `process.emit('SIGTERM')` is triggered
- THEN `flush()` SHALL be called before process exit

### FR-06: Envelope format

**Happy path:**
- GIVEN `build([log1, log2])` is called
- WHEN serialised
- THEN the output SHALL be exactly 3 lines split by `\n`
- AND line 1 SHALL be valid JSON with `sdk.name` and `sent_at`
- AND line 2 SHALL be valid JSON with `type: "log"` and `item_count: 2`
- AND line 3 SHALL be valid JSON with `items` array of length 2
- AND there SHALL be NO trailing newline

### FR-07: Transport

**Non-2xx:**
- GIVEN `fetch` returns a `500` response
- WHEN `send(logs)` is called
- THEN `console.error` SHALL be called with the status
- AND no exception SHALL propagate

**Network error:**
- GIVEN `fetch` rejects with a network error
- WHEN `send(logs)` is called
- THEN the error SHALL be swallowed (logged to stderr)
- AND no exception SHALL propagate

**Before init:**
- GIVEN `send(logs)` is called without `init()` having been called
- WHEN `getConfig()` throws
- THEN `send` SHALL return silently without throwing

### FR-08: traceMiddleware

**Incoming sentry-trace header:**
- GIVEN an incoming request with header `sentry-trace: abc123def456-00f067aa0ba-1`
- WHEN the middleware runs
- THEN `store.getStore().traceId` SHALL be `"abc123def456"`
- AND a new `spanId` SHALL be generated (not `"00f067aa0ba"`)

**No incoming header:**
- GIVEN an incoming request with no `sentry-trace` header
- WHEN the middleware runs
- THEN a fresh 32-hex `traceId` and 16-hex `spanId` SHALL be generated
- AND the outgoing response SHALL have a `sentry-trace` header set

### FR-09 / FR-10: SDK never throws; init idempotency

**Never throws:**
- GIVEN any call to any SDK method (logger, transport, buffer, middleware)
- WHEN an internal error occurs
- THEN no exception SHALL propagate to the caller

**Init idempotency:**
- GIVEN `init(optionsA)` has been called
- WHEN `init(optionsB)` is called a second time
- THEN the config SHALL remain unchanged (optionsA still active)
- AND a warning SHALL be emitted to `console.warn`

---

## Constraints

### In Scope

- `packages/sdk/src/index.ts` — public API (`init`, `logger`, `traceMiddleware`, types)
- `packages/sdk/src/init.ts` — DSN parser + config singleton
- `packages/sdk/src/logger.ts` — six log-level methods
- `packages/sdk/src/captureLog.ts` — core pipeline (gate → enrich → hook → queue)
- `packages/sdk/src/stackTrace.ts` — `Error().stack` parser → `StackFrame[]`
- `packages/sdk/src/context.ts` — `AsyncLocalStorage` store + `traceMiddleware`
- `packages/sdk/src/buffer.ts` — batching, flush triggers, hard cap, SIGTERM/SIGINT handlers
- `packages/sdk/src/envelope.ts` — 3-line envelope serialiser
- `packages/sdk/src/transport.ts` — HTTP POST to backend; never throws
- Vitest unit tests for all above modules

### Out of Scope

- `@centry/shared` type changes — `LogItem` and `parseEnvelope` are already implemented; SDK must conform to them
- Backend changes — ingest endpoint already handles the envelope format
- Frontend changes — out of scope for this feature
- Browser SDK — Node.js only (`AsyncLocalStorage`, `os.hostname`, `fetch` (Node 18+))
- Redis rate limiting — deferred to M4 polish
- Log retention cron — deferred to M4 polish
- Live tail / SSE — deferred to M4 polish

### Prohibitions

- SHALL NOT modify `@centry/shared` types or `parseEnvelope` — treat them as a fixed contract
- SHALL NOT throw from `transport.ts` — backend problems must never crash the host application
- SHALL NOT call `.ref()` on the flush timer — the timer SHALL use `.unref()` so it never keeps the Node process alive
- SHALL NOT expose internal modules — only `init`, `logger`, `traceMiddleware`, `SdkConfig`, and `LogItem` (re-exported) are part of the public API
- SHALL NOT use `express.json()` on the ingest route — the SDK sends newline-delimited envelope text, not JSON

### Testing Approach

- **Selective TDD** — TDD for: DSN parsing, buffer flush triggers (size/time/cap/SIGTERM), `enableLogs:false` gate, `beforeSendLog` → null drop, transport resilience (non-2xx, network error, pre-init). Test-after for: glue code in `index.ts`, `traceMiddleware` wiring.
- Test runner: **Vitest** (already a devDependency target for the sdk package per `sdk-express-plan.md`)
