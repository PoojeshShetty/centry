# `@logmvp/sdk` — Build Plan

> Scope: Node.js SDK that captures logs, enriches them, buffers, and ships to the backend via Sentry envelope wire format.
> Part of the `logs-mvp` monorepo at `packages/sdk`.

---

## 1. Package Structure

```
packages/sdk/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          ← public API (only init + logger exported)
    ├── init.ts           ← DSN parser + config singleton
    ├── logger.ts         ← trace/debug/info/warn/error/fatal methods
    ├── captureLog.ts     ← core pipeline: gate → enrich → hook → queue
    ├── stackTrace.ts     ← captures and parses Error().stack into frames
    ├── context.ts        ← AsyncLocalStorage for request-scoped trace_id/span_id
    ├── buffer.ts         ← batching: 100 items or 5s flush, 1000 hard cap
    ├── envelope.ts       ← wire format builder (3-line newline-delimited JSON)
    └── transport.ts      ← HTTP POST to backend, never throws
```

### `package.json`

```json
{
  "name": "@logmvp/sdk",
  "version": "1.0.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev":   "tsup src/index.ts --format esm,cjs --dts --watch",
    "test":  "vitest"
  },
  "dependencies": {
    "@logmvp/shared": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^1.0.0",
    "typescript": "^5.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src"]
}
```

---

## 2. Files and Their Responsibilities

| File | Exports | Responsibility |
|---|---|---|
| `index.ts` | `init`, `logger` | Public surface — nothing internal leaks out |
| `init.ts` | `init()`, `getConfig()` | Parse DSN, store config singleton |
| `logger.ts` | `logger` object | Six log-level methods; maps level → `captureLog` |
| `captureLog.ts` | `captureLog()` | Core pipeline: gate → interpolate → enrich → hook → push |
| `stackTrace.ts` | `captureFrames()` | Parse `new Error().stack` → `StackFrame[]` |
| `context.ts` | `store`, `traceMiddleware` | AsyncLocalStorage for request-scoped trace/span IDs |
| `buffer.ts` | `push()`, `flush()` | In-memory queue; flushes on size/time/exit |
| `envelope.ts` | `build()` | Serializes `LogItem[]` → 3-line envelope string |
| `transport.ts` | `send()` | HTTP POST to backend; never throws |

---

## 3. Data Flow

```
User Code
  │
  │  logger.error("Payment failed for %s", ["ORD-99"], { "payment.code": "declined" })
  ▼
logger.ts          — maps "error" → severityNumber 17 → calls captureLog()
  │
  ▼
captureLog.ts      — PIPELINE:
  │  1. enableLogs gate          → false? return (drop)
  │  2. interpolate()            → "Payment failed for ORD-99"
  │  3. captureFrames()          → StackFrame[] (only on error/fatal)
  │  4. store.getStore()         → { traceId, spanId } from AsyncLocalStorage
  │  5. build default attributes → sdk name/version, env, release, server.address, template
  │  6. merge user attributes    → { value, type } shape
  │  7. assemble LogItem         → { timestamp, level, severity_number, body, trace_id, ... }
  │  8. beforeSendLog(log)       → null? return (drop)
  │  9. push(log)                → hand off to buffer
  ▼
buffer.ts          — append to queue[]
  │  queue.length >= 100?  → flush() immediately
  │  setInterval 5s?       → flush() on tick
  │  SIGTERM/SIGINT?       → flush() then exit
  ▼
envelope.ts        — build(logs[]) → 3-line string
  ▼
transport.ts       — POST /api/:projectId/envelope/
                     headers: Content-Type + X-Sentry-Auth
                     non-2xx: stderr only, never throw
```

---

## 4. Core Logic — Pseudo Code

### 4.1 `init.ts`

```
TYPES:
  SdkConfig {
    dsn:            string               -- "https://<key>@<host>/<projectId>"
    environment?:   string               -- "production" | "staging" | ...
    release?:       string               -- "1.2.3"
    enableLogs?:    boolean              -- kill switch, default true
    beforeSendLog?: (log) => log | null  -- filter/mutate hook
  }

  ParsedDsn {
    publicKey:  string   -- URL username  → sentry_key in X-Sentry-Auth
    host:       string   -- URL hostname[:port]
    projectId:  string   -- URL pathname first segment
  }

MODULE STATE:
  _config: (SdkConfig & { parsed: ParsedDsn }) | null = null

FUNCTION init(options: SdkConfig):
  _config = { ...options, parsed: parseDsn(options.dsn) }

FUNCTION getConfig():
  IF _config is null:
    THROW "call init() before using logger"
  RETURN _config

FUNCTION parseDsn(dsn):
  url = new URL(dsn)
  RETURN {
    publicKey: url.username,
    host:      url.hostname + (url.port ? ":" + url.port : ""),
    projectId: url.pathname stripped of leading "/"
  }
```

---

### 4.2 `logger.ts`

```
FUNCTION makeLogFn(level, severityNumber):
  RETURN (template, params?, attributes?) =>
    captureLog({ level, severityNumber, template, params, attributes })

EXPORT logger = {
  trace: makeLogFn("trace", 1),
  debug: makeLogFn("debug", 5),
  info:  makeLogFn("info",  9),
  warn:  makeLogFn("warn",  13),
  error: makeLogFn("error", 17),
  fatal: makeLogFn("fatal", 21),
}
```

---

### 4.3 `captureLog.ts` — The Pipeline

```
TYPES:
  RawLog {
    level:           string
    severityNumber:  number
    template:        string
    params?:         unknown[]
    attributes?:     Record<string, unknown>
  }

CONSTANTS:
  SDK_NAME    = "logmvp.node"
  SDK_VERSION = "1.0.0"

FUNCTION captureLog(raw: RawLog):

  -- GATE 1: kill switch
  config = getConfig()
  IF config.enableLogs === false:
    RETURN

  -- STEP 2: interpolate template + params → human-readable body
  body = interpolate(raw.template, raw.params)
  -- "User %s logged in" + ["john"] → "User john logged in"

  -- STEP 3: capture stack trace for error/fatal levels only
  frames = []
  IF raw.severityNumber >= 17:   -- error (17) or fatal (21)
    frames = captureFrames()     -- new Error().stack, strip SDK frames

  -- STEP 4: read distributed trace context (set by traceMiddleware)
  ctx = store.getStore()
  -- ctx is { traceId: "4bf92f...", spanId: "00f067..." } | undefined

  -- STEP 5: build SDK default attributes
  attrs = {
    "sentry.sdk.name":    { value: SDK_NAME,         type: "string" },
    "sentry.sdk.version": { value: SDK_VERSION,      type: "string" },
    "server.address":     { value: os.hostname(),    type: "string" },
  }
  IF config.environment:
    attrs["sentry.environment"] = { value: config.environment, type: "string" }
  IF config.release:
    attrs["sentry.release"] = { value: config.release, type: "string" }

  -- Template params stored as discrete attributes for aggregation in the UI
  IF raw.params has items:
    attrs["sentry.message.template"] = { value: raw.template, type: "string" }
    FOR EACH param at index i:
      attrs["sentry.message.parameter." + i] = { value: param, type: typeof param }

  -- Stack frames stored as attribute (not top-level field)
  IF frames has items:
    attrs["error.stack_frames"] = { value: JSON.stringify(frames), type: "string" }

  -- STEP 6: merge user-provided attributes (user wins on key clash)
  userAttrs = serializeAttrs(raw.attributes)
  mergedAttrs = { ...attrs, ...userAttrs }

  -- STEP 7: assemble final LogItem
  log = {
    timestamp:       Date.now() / 1000,    -- unix epoch seconds, float
    level:           raw.level,
    severity_number: raw.severityNumber,
    body:            body,
    trace_id:        ctx?.traceId,         -- undefined if no middleware
    span_id:         ctx?.spanId,
    attributes:      mergedAttrs,
  }

  -- GATE 2: user hook (runs after enrichment — user sees full log)
  IF config.beforeSendLog exists:
    log = config.beforeSendLog(log)
    IF log === null:
      RETURN   -- user dropped it

  -- STEP 8: hand to buffer
  push(log)


FUNCTION interpolate(template, params):
  IF no params: RETURN template
  i = 0
  RETURN template with each "%s" replaced by String(params[i++])


FUNCTION serializeAttrs(raw):
  IF raw is empty: RETURN {}
  FOR EACH [key, value] in raw:
    type = Array.isArray(value) ? "array" : typeof value
    result[key] = { value, type }
  RETURN result
```

---

### 4.4 `stackTrace.ts`

```
TYPES:
  StackFrame {
    filename:  string    -- "services/payment.ts"
    function:  string    -- "PaymentService.charge"
    lineno:    number    -- 67
    colno:     number    -- 14
    in_app:    boolean   -- false if inside node_modules
  }

CONSTANTS:
  SDK_PATH_MARKER = "@logmvp/sdk"   -- frames containing this are stripped
  LINE_PATTERN    = /at (.+?) \((.+?):(\d+):(\d+)\)/

FUNCTION captureFrames(): StackFrame[]

  err = new Error()
  lines = err.stack.split("\n").slice(1)   -- drop "Error" header line

  frames = []
  FOR EACH line in lines:
    frame = parseLine(line)
    IF frame is null: CONTINUE
    IF frame.filename contains SDK_PATH_MARKER: CONTINUE   -- strip SDK internals
    frames.push(frame)

  RETURN frames   -- newest call first (same order as raw stack)


FUNCTION parseLine(line): StackFrame | null

  match = LINE_PATTERN on line
  -- input:  "    at PaymentService.charge (services/payment.ts:67:14)"
  -- groups: [full, "PaymentService.charge", "services/payment.ts", "67", "14"]

  IF no match: RETURN null

  RETURN {
    function: match[1],
    filename: match[2],
    lineno:   Number(match[3]),
    colno:    Number(match[4]),
    in_app:   NOT match[2].includes("node_modules"),
  }
```

---

### 4.5 `context.ts`

```
-- AsyncLocalStorage lets any code within a request handler read
-- the trace context without it being passed as a parameter.

store = new AsyncLocalStorage<{ traceId: string; spanId: string }>()

FUNCTION traceMiddleware(req, res, next):

  -- Read incoming trace header (W3C traceparent or sentry-trace)
  -- If absent (request originated here), generate a fresh trace.

  incoming = req.headers["sentry-trace"]    -- "traceId-spanId-sampled"

  IF incoming exists:
    [traceId, parentSpanId] = incoming.split("-")
    spanId = generateSpanId()               -- new span for this service
  ELSE:
    traceId = generateTraceId()             -- brand new trace
    spanId  = generateSpanId()

  -- Run next() inside the store context so all downstream code can read it
  store.run({ traceId, spanId }, next)

  -- After the request completes, propagate outgoing header so downstream
  -- services can join the same trace:
  res.setHeader("sentry-trace", traceId + "-" + spanId + "-1")


FUNCTION generateTraceId(): string
  RETURN crypto.randomUUID() with "-" removed   -- 32 hex chars

FUNCTION generateSpanId(): string
  RETURN crypto.randomUUID() with "-" removed, first 16 chars
```

---

### 4.6 `buffer.ts`

```
CONSTANTS:
  MAX_SIZE        = 1000   -- hard cap: drop beyond this
  FLUSH_SIZE      = 100    -- flush trigger: batch size
  FLUSH_INTERVAL  = 5000   -- flush trigger: ms

MODULE STATE:
  queue:   LogItem[] = []
  dropped: number    = 0
  timer:   Interval  = setInterval(flush, FLUSH_INTERVAL).unref()
  -- .unref() prevents the timer from keeping the Node process alive


FUNCTION push(log: LogItem):
  IF queue.length >= MAX_SIZE:
    dropped++
    RETURN   -- silently drop, count it
  queue.push(log)
  IF queue.length >= FLUSH_SIZE:
    flush()  -- trigger immediate flush when batch is full


FUNCTION flush():
  IF queue is empty: RETURN
  batch = queue.splice(0, FLUSH_SIZE)   -- take up to 100, leave the rest
  send(batch)                           -- fire-and-forget (transport)


-- Drain before process exits
process.on("SIGTERM", () => { flush(); process.exit(0) })
process.on("SIGINT",  () => { flush(); process.exit(0) })
```

---

### 4.7 `envelope.ts`

```
-- Sentry envelope wire format: exactly 3 newline-separated JSON lines.
-- Backend splits on \n and parses each line independently.

CONSTANTS:
  SDK_NAME    = "logmvp.node"
  SDK_VERSION = "1.0.0"

FUNCTION build(logs: LogItem[]): string

  -- Line 1: envelope header — metadata about this batch
  envelopeHeader = JSON.stringify({
    sdk: { name: SDK_NAME, version: SDK_VERSION },
    sent_at: new Date().toISOString(),
  })

  -- Line 2: item header — describes the payload that follows
  itemHeader = JSON.stringify({
    type:         "log",
    item_count:   logs.length,
    content_type: "application/vnd.sentry.items.log+json",
  })

  -- Line 3: item payload — the actual log data
  itemPayload = JSON.stringify({ items: logs })

  RETURN envelopeHeader + "\n" + itemHeader + "\n" + itemPayload
  -- NOTE: no trailing newline


-- Output example (pretty-printed for clarity; actual output is 3 lines):
--
-- {"sdk":{"name":"logmvp.node","version":"1.0.0"},"sent_at":"2026-06-13T10:00:00.000Z"}
-- {"type":"log","item_count":2,"content_type":"application/vnd.sentry.items.log+json"}
-- {"items":[{ "timestamp":1749..., "level":"error", "body":"...", "attributes":{...} }]}
```

---

### 4.8 `transport.ts`

```
FUNCTION send(logs: LogItem[]): void   -- fire-and-forget, no return value

  -- Silently bail if init() was never called (e.g. in tests)
  TRY:
    config = getConfig()
  CATCH:
    RETURN

  { host, projectId, publicKey } = config.parsed

  url  = "https://" + host + "/api/" + projectId + "/envelope/"
  body = build(logs)   -- from envelope.ts

  -- X-Sentry-Auth header — this is how the backend identifies which project
  -- and authenticates the ingest key without a login session
  authHeader = "Sentry sentry_version=7"
             + ", sentry_client=" + SDK_NAME + "/" + SDK_VERSION
             + ", sentry_key=" + publicKey

  TRY:
    response = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/x-sentry-envelope",
        "X-Sentry-Auth": authHeader,
      },
      body: body,
    })

    IF response.status is not 2xx:
      console.error("[logmvp/sdk] ingest HTTP " + response.status)
      -- do NOT throw — backend problems must never crash the host app

  CATCH networkError:
    console.error("[logmvp/sdk] transport error:", networkError)
    -- swallow — SDK must never throw
```

---

### 4.9 `index.ts`

```
-- Only export what users need. Internal modules stay private.

EXPORT { init }   from "./init"
EXPORT { logger } from "./logger"

-- Re-export types so users can type their beforeSendLog callbacks
EXPORT type { SdkConfig }  from "./init"
EXPORT type { LogItem }    from "@logmvp/shared"

-- context.ts middleware is exported so Express apps can install it
EXPORT { traceMiddleware } from "./context"
```

---

## 5. Key Contracts Between Files

```
init.ts ──────────────────────────► getConfig()
                                         │
              ┌──────────────────────────┼──────────────────┐
              │                          │                   │
         captureLog.ts            transport.ts          context.ts
              │                                              │
     ┌────────┼────────┐                              (middleware)
     │        │        │                                     │
stackTrace  buffer   envelope                         AsyncLocalStorage
              │        │
           transport ◄─┘
```

- `captureLog` is the only writer to `buffer`
- `buffer` is the only caller of `transport.send`
- `transport` is the only caller of `envelope.build`
- `context.store` is read by `captureLog`, written by `traceMiddleware`
- `getConfig()` is called by `captureLog` and `transport` — both need DSN info

---

## 6. Constraints Checklist

| Constraint | Where enforced |
|---|---|
| `enableLogs: false` drops everything | `captureLog.ts` gate 1 |
| `beforeSendLog → null` drops silently | `captureLog.ts` gate 2 |
| Buffer never exceeds 1000 | `buffer.ts` push() |
| Max 100 logs per envelope | `buffer.ts` splice(0, 100) |
| SDK never throws or crashes host | `transport.ts` try/catch |
| Flush on SIGTERM/SIGINT | `buffer.ts` process.on |
| Stack trace only on error/fatal | `captureLog.ts` severityNumber >= 17 |
| trace_id auto-attached (no user effort) | `context.ts` + `captureLog.ts` |
| User attributes serialized to {value,type} | `captureLog.ts` serializeAttrs() |

---

## 7. Usage Example (end-to-end)

```ts
import { init, logger, traceMiddleware } from '@logmvp/sdk'

// 1. Call init() once at app startup
init({
  dsn:         'https://abc123@localhost:3000/proj-uuid',
  environment: 'production',
  release:     '2.1.0',
  enableLogs:  true,
  beforeSendLog: (log) => {
    // Drop noisy health check logs
    if (log.body.includes('GET /health')) return null
    return log
  },
})

// 2. Install middleware so all logs auto-carry trace_id
app.use(traceMiddleware)

// 3. Use logger anywhere — attributes give context, template enables aggregation
logger.info('User %s logged in', ['john'], { 'user.id': 42 })

logger.warn('Slow DB query on %s: %sms', ['users', 1240], {
  'db.system':      'postgresql',
  'db.operation':   'SELECT',
  'db.duration_ms': 1240,
})

logger.error('Payment failed for order %s', ['ORD-99'], {
  'payment.error_code': 'card_declined',
  'payment.amount_usd': 9999,
})
// ↑ error level → stack trace auto-captured + attached as attribute
// ↑ trace_id/span_id auto-attached from traceMiddleware context
```
