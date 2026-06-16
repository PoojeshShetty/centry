# Task 2: Buffer, transport, and core pipeline

## Trace
- **FR-IDs:** FR-03, FR-04, FR-05, FR-06, FR-11, FR-12, FR-13
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/sdk-react/src/buffer/buffer.ts` — create
- `packages/sdk-react/src/transport/envelope.ts` — create
- `packages/sdk-react/src/transport/transport.ts` — create
- `packages/sdk-react/src/core/captureLog.ts` — create
- `packages/sdk-react/src/core/logger.ts` — create
- `packages/sdk-react/src/core/init.ts` — create
- `packages/sdk-react/src/buffer/tests/buffer.test.ts` — create
- `packages/sdk-react/src/transport/tests/transport.test.ts` — create
- `packages/sdk-react/src/core/tests/captureLog.test.ts` — create

## Design References
- design.md §Architecture (`buffer/buffer.ts`, `transport/envelope.ts`, `transport/transport.ts`, `core/captureLog.ts`, `core/logger.ts`, `core/init.ts`)
- design.md §Data Flow (full pipeline from `init()` through `captureLog` → `buffer.push` → `flush` → `transport.send`)
- design.md §Design Decisions (Unload flush strategy: beforeunload only; Browser attribute substitutions in captureLog; Copy utils vs import from @centry/sdk)

## Contracts (task-specific)

### Internal Interfaces
- `buffer.push(item: LogItem): void`
  - Post: item appended to internal array; triggers `flush()` when length reaches 100

- `buffer.flush(): void`
  - Post: buffer drained synchronously, `transport.send(batch)` called; no-op if buffer is empty

- `buffer.beacon(): void`
  - Post: `navigator.sendBeacon(url, envelopeStr)` called with current buffer contents; buffer cleared

- `captureLog(level, severityNumber, template, params?, attributes?): void`
  - Pre: `getConfig()` may return null if `init()` not called — silently swallowed
  - Post: assembles `LogItem` with `timestamp`, `level`, `severity_number`, `body`, `attributes` (including `client.address: window.location.hostname`), stack frames for error/fatal; calls `beforeSendLog` if configured; calls `buffer.push(item)`

- `transport.send(logs: LogItem[]): Promise<void>`
  - Post: POSTs envelope to `envelopeUrl(config)` with `Content-Type: application/x-sentry-envelope` and `X-Sentry-Auth: Sentry sentry_version=7, sentry_key=<publicKey>`; non-2xx or network error → `console.warn`; never throws

- `init(config: SdkReactConfig): void`
  - Pre: first call; valid DSN
  - Post: parses DSN, stores `ResolvedConfig`; double-call → `console.warn` and return; bad DSN → `console.error` and return without installing integrations

## Acceptance Criteria

### FR-03: Logger API
- GIVEN `init()` has run successfully
- WHEN `logger.info('Payment submitted')` is called
- THEN a `LogItem` with `level='info'` and `severity_number=9` is added to the buffer

### FR-04: Buffer capacity flush
- GIVEN 99 buffered logs
- WHEN a 100th log is captured
- THEN a flush is triggered immediately

### FR-04: Buffer timer flush
- GIVEN 1 buffered log and no other activity
- WHEN 5 seconds elapse
- THEN a flush is triggered

### FR-04: Unload flush
- GIVEN at least one buffered log
- WHEN the page fires `beforeunload`
- THEN `navigator.sendBeacon` delivers the envelope to the ingest endpoint

### FR-05: Envelope transport
- GIVEN a flush is triggered
- WHEN the POST request is made
- THEN `Content-Type` is `'application/x-sentry-envelope'`
- AND `X-Sentry-Auth` contains the public key from the DSN
- AND the body is a valid newline-delimited envelope parseable by `parseEnvelope`

### FR-06: Stack trace capture for error/fatal
- GIVEN `logger.error('Payment failed')` is called from `PaymentForm.tsx`
- THEN `LogItem.attributes` contains `stack_frames` with at least one frame pointing to `PaymentForm.tsx`
- AND no frames from sdk-react internal files are present

### FR-06: No stack capture for non-error levels
- GIVEN `logger.info('msg')` is called
- THEN `LogItem.attributes` does NOT contain `stack_frames`

### FR-11: enableLogs kill switch
- GIVEN `init({ dsn, enableLogs: false })`
- WHEN `logger.error('msg')` is called
- THEN no `LogItem` is added to the buffer and no network request is made

### FR-12: beforeSendLog mutation
- GIVEN `beforeSendLog` returns a modified log
- WHEN a log is captured
- THEN the modified log is what gets buffered

### FR-12: beforeSendLog drop
- GIVEN `beforeSendLog` returns `null`
- WHEN a log is captured
- THEN the log is silently dropped

### FR-13: Transport failure
- GIVEN the ingest endpoint returns HTTP 500
- THEN the SDK logs `console.warn` with the status and does not throw

## Done Criteria
- [ ] `buffer.push` appends items and triggers `flush()` at 100 items
- [ ] 5-second `setInterval` is registered on buffer init; `flush()` called when timer fires
- [ ] `beforeunload` listener calls `buffer.beacon()` with `navigator.sendBeacon`
- [ ] `captureLog` assembles correct `LogItem` fields including `client.address: window.location.hostname`
- [ ] `captureLog` attaches `stack_frames` only for `error` and `fatal` levels
- [ ] `captureLog` respects `enableLogs: false` (returns early without buffering)
- [ ] `captureLog` calls `beforeSendLog`; drops on `null` return
- [ ] `transport.send` sends correct headers; `console.warn`s on non-2xx; never throws
- [ ] `logger.trace/debug/info/warn/error/fatal` all call `captureLog` with correct severity numbers (1/5/9/13/17/21)
- [ ] All buffer, transport, and captureLog unit tests pass
