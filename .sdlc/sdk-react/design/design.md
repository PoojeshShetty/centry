# Design: sdk-react

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13
- **Requirements:** ../requirements.md

## Architecture

### Components

- `packages/sdk-react` (`@centry/sdk-react`): new workspace package — new
- `core/init.ts`: `init()` entry point; SSR guard; double-init guard; DSN parsing; integration installation — new
- `core/captureLog.ts`: log pipeline — `enableLogs` check, body interpolation, attribute assembly, `beforeSendLog`, stack capture for error/fatal, `buffer.push()` — new
- `core/logger.ts`: exported `logger` object with six severity-level methods — new
- `buffer/buffer.ts`: browser log buffer — 100-item capacity flush, 5s interval timer, `beforeunload` beacon flush — new
- `transport/envelope.ts`: envelope string builder (Node-free copy of `@centry/sdk`'s builder) — new
- `transport/transport.ts`: `fetch` POST transport with `X-Sentry-Auth` and `Content-Type` headers — new
- `transport/urls.ts`: `envelopeUrl(config)` helper — new
- `integrations/globalErrors.ts`: patches `window.onerror` and `window.onunhandledrejection` — new
- `integrations/fetch.ts`: wraps `window.fetch` to log HTTP events — new
- `integrations/xhr.ts`: wraps `XMLHttpRequest` to log HTTP events — new
- `integrations/navigation.ts`: patches `history.pushState` and listens to `popstate` — new
- `react/ErrorBoundary.tsx`: React class component; catches render errors; logs via `logger.fatal` — new
- `react/useLogger.ts`: hook returning a bound logger with `component.name` in attributes — new
- `utils/parseDsn.ts`: DSN parser (copied from `@centry/sdk`, no Node deps) — new
- `utils/stackTrace.ts`: stack frame parser filtering `@centry/sdk-react` frames (copied, adapted) — new
- `utils/constants.ts`: `SDK_NAME='@centry/sdk-react'`, `SDK_VERSION='0.0.0'` — new
- `types.ts`: all type definitions for the package — new
- `@centry/shared`: `LogItem`, `EnvelopeHeader`, `Envelope`, `parseEnvelope` — existing

### Data Flow

```
init(config)
  → parseDsn(dsn) → store ResolvedConfig
  → installIntegrations() [SSR guard: skip if typeof window === 'undefined']

logger.X(template, params?, attrs?) / integration event
  → captureLog(level, severityNumber, ...)
  → enableLogs === false? → return
  → assemble LogItem (body, attributes, client.address, stack frames for error/fatal)
  → beforeSendLog(logItem)? → null → drop | LogItem → continue
  → buffer.push(logItem)
      → buffer.length >= 100? → flush()
      → else wait for 5s timer → flush()

flush()
  → transport.send(batch)
  → fetch POST envelopeUrl(config)
      headers: Content-Type: application/x-sentry-envelope
               X-Sentry-Auth: Sentry sentry_version=7, sentry_key=<publicKey>
      body: envelope string (header\nitem-header\npayload\n...)

beforeunload event
  → buffer.beacon()
  → navigator.sendBeacon(envelopeUrl, envelopeStr)
```

## Data Models

All type definitions live in `packages/sdk-react/src/types.ts`. No new fields are added to `LogItem`.

- `SdkReactConfig`:
  - `dsn (string)`: Sentry-format DSN
  - `enableLogs? (boolean)`: kill switch; default true
  - `environment? (string)`: attached as `sentry.environment` attribute
  - `release? (string)`: attached as `sentry.release` attribute
  - `beforeSendLog? ((log: LogItem) => LogItem | null)`: per-log mutation or drop hook

- `ParsedDsn`:
  - `publicKey (string)`: username from DSN URL
  - `host (string)`: hostname[:port] from DSN URL
  - `projectId (string)`: path segment from DSN URL

- `ResolvedConfig`: `ParsedDsn & SdkReactConfig`

- `StackFrame`:
  - `filename (string)`
  - `function (string)`
  - `lineno? (number)`
  - `colno? (number)`

- `LogItem` (from `@centry/shared`):
  - `timestamp (number)`: `Date.now()`
  - `level (string)`: trace | debug | info | warn | error | fatal
  - `severity_number (number)`: 1 | 5 | 9 | 13 | 17 | 21
  - `body (string)`: interpolated message
  - `attributes? (Record<string, unknown>)`: SDK attrs + user attrs + stack frames + component name

## Interface Contracts

### Public API (index.ts)

- `init(config: SdkReactConfig): void`
  - Pre: called once at app root (e.g. `main.tsx`)
  - Post: config stored, integrations installed (unless SSR or bad DSN)
  - Errors: bad DSN → `console.error`, return without installing integrations; second call → `console.warn`, return

- `logger.trace / debug / info / warn / error / fatal (template: string, params?: unknown[], attributes?: Record<string, unknown>): void`
  - Pre: none (safe to call before `init()` — logs are silently swallowed)
  - Post: `LogItem` pushed to buffer (unless killed by `enableLogs:false` or `beforeSendLog` returning null)

- `ErrorBoundary` React class component
  - Props: `fallback?: ReactNode`
  - Post: on child render error → `logger.fatal(error.message, [], { 'error.component_stack': componentStack })`; renders `fallback` or `<p>Something went wrong.</p>`

- `useLogger(componentName: string): typeof logger`
  - Post: returns logger-shaped object; every call auto-merges `{ 'component.name': componentName }` into attributes
  - Stable ref: memoised on `componentName`

### Internal Interfaces

- `captureLog(level, severityNumber, template, params?, attributes?): void`
  - Pre: `getConfig()` may throw if `init()` not called — caught internally, SDK never throws
  - Post: `LogItem` assembled and pushed to buffer, or silently dropped

- `buffer.push(item: LogItem): void`
  - Post: item appended; triggers `flush()` when length reaches 100

- `buffer.flush(): void`
  - Post: buffer drained, `transport.send(batch)` called; no-op if buffer empty

- `buffer.beacon(): void`
  - Post: `navigator.sendBeacon(url, envelopeStr)` called with current buffer contents; buffer cleared

- `transport.send(logs: LogItem[]): Promise<void>`
  - Post: envelope POSTed; non-2xx → `console.warn`; network error → `console.warn`; never throws

- `envelopeUrl(config: ResolvedConfig): string`
  - Returns: `http(s)://<host>/api/<projectId>/envelope/`

- `parseDsn(dsn: string): ParsedDsn`
  - Pre: valid DSN URL with username
  - Errors: throws `Error` with descriptive message (caught by `init()`)

- `parseStack(stack: string): StackFrame[]`
  - Post: frames from `@centry/sdk-react` internal files filtered out

- `installIntegrations(): void`
  - Pre: `typeof window !== 'undefined'`
  - Post: patches `window.onerror`, `onunhandledrejection`, `fetch`, `XMLHttpRequest`, `history.pushState`; each patch is idempotent (double-patch guard)

## Design Decisions

### Copy utils vs import from @centry/sdk

- **Chosen:** Copy `parseDsn.ts`, `stackTrace.ts`, and `envelope.ts` into `sdk-react/src/utils/` and `sdk-react/src/transport/`
- **Rationale:** `@centry/sdk`'s `buffer.ts` runs `process.once('SIGTERM', ...)` and `timer.unref()` at module load time. Importing any re-export from `@centry/sdk` would pull in these Node-only side effects and crash the browser. Copying the three files (≈80 lines total) keeps the package fully Node-free with no monkey-patching needed.
- **Rejected:** Expose `parseDsn` / `parseStack` as named exports from `@centry/sdk` index — still requires the consumer to import from a Node-side-effect package

### Unload flush strategy: beforeunload only

- **Chosen:** `window.addEventListener('beforeunload', beacon)`
- **Rationale:** User chose `beforeunload` only to keep the implementation simple. Desktop browser navigations and tab closes reliably fire `beforeunload`.
- **Rejected:** Dual `beforeunload` + `visibilitychange` — more resilient on mobile but adds complexity the user opted out of

### Test runner: Vitest + jsdom

- **Chosen:** Vitest with `environment: 'jsdom'`; `@testing-library/react` for `ErrorBoundary` and `useLogger` component tests
- **Rationale:** Consistent with `@centry/backend`. Avoids the `jest-fixed-jsdom` workaround required by the frontend. Vitest's jsdom environment is sufficient since sdk-react does not import `react-router-dom`.
- **Rejected:** Jest + jest-fixed-jsdom — adds a second test configuration style; `jest-fixed-jsdom` was only needed due to `react-router-dom`'s `TextEncoder` dependency, which sdk-react doesn't have

### Browser attribute substitutions in captureLog

- **Chosen:** `client.address: window.location.hostname` instead of `server.address: hostname()` (Node `os` module); no `AsyncLocalStorage` trace context
- **Rationale:** `os.hostname()` and `AsyncLocalStorage` are Node-only. `window.location.hostname` gives the equivalent "where is this running" signal for browser logs.
- **Rejected:** Omit host attribute entirely — loses page origin context useful for multi-tenant deployments

### Double-patch guard for integrations

- **Chosen:** Each integration checks a module-level `patched` boolean before installing; `init()` double-init guard (`config !== null → warn + return`) provides the outer guard
- **Rationale:** Prevents duplicate event listeners and infinite loops if `init()` is called twice (e.g. in HMR scenarios)
- **Rejected:** Tracking patch state on `window` (e.g. `window.__centry_patched`) — pollutes global namespace
