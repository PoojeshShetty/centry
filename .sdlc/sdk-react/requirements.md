# Requirements: sdk-react

## 1. Project

- Path: `.`

---

## 2. Purpose

Enable React applications to ship structured logs to the centry backend using the same DSN and envelope wire format as the Node SDK, giving frontend teams the same observability as their backend counterparts.

---

## 3. User Stories

- As a frontend developer, I want to call `init()` once with a DSN and have all errors, HTTP calls, and navigations logged automatically, so I don't have to instrument each event manually.
- As a React component author, I want a `useLogger` hook that auto-tags every log with my component name, so I can correlate logs to components without repeating myself.
- As a product owner, I want React render errors caught by an `ErrorBoundary` and logged to centry, so crashes that are invisible to `window.onerror` are still captured.
- As an ops engineer, I want `sdk-react` to use the same DSN/envelope format as the Node SDK, so centry ingest needs zero changes to accept browser logs.

---

## 4. Functional Requirements

- FR-01: SDK SHALL be a new `@centry/sdk-react` workspace package under `packages/sdk-react`.
- FR-02: SDK SHALL accept a DSN string (same format as `@centry/sdk`) and parse it to derive the ingest URL and public key.
- FR-03: SDK SHALL expose `logger.trace`, `logger.debug`, `logger.info`, `logger.warn`, `logger.error`, and `logger.fatal` with the same call signature as `@centry/sdk`.
- FR-04: SDK SHALL buffer logs and flush: (a) every 5 seconds, (b) when the buffer reaches 100 items, (c) on page unload via `navigator.sendBeacon`.
- FR-05: Transport SHALL POST envelopes using the Sentry envelope format (`application/x-sentry-envelope` Content-Type, `X-Sentry-Auth` header) so the existing centry ingest endpoint accepts them without modification.
- FR-06: `logger.error` and `logger.fatal` SHALL auto-capture a JS stack trace and attach it to the log item's `attributes` field, excluding sdk-react-internal frames.
- FR-07: SDK SHALL install four auto-instrumentation integrations on `init()`: global errors (`window.onerror` + `onunhandledrejection`), fetch patching, XHR patching, and navigation tracking (`history.pushState` + `popstate`).
- FR-08: SDK SHALL export an `ErrorBoundary` React class component that catches render errors and logs them via `logger.fatal`.
- FR-09: SDK SHALL export a `useLogger(componentName: string)` hook that returns a bound logger where every call automatically includes `component.name` in attributes.
- FR-10: All integrations and `init()` SHALL be SSR-safe by guarding on `typeof window === 'undefined'`.
- FR-11: `enableLogs: false` in config SHALL suppress all log capture — no logs are buffered or sent.
- FR-12: A `beforeSendLog` hook SHALL allow per-log mutation or silent drop (returning `null` drops the log without sending).
- FR-13: SDK SHALL NOT throw on any internal error — transport failures and parse errors are swallowed and logged to `console.warn`.

---

## 5. Acceptance Criteria

### FR-01: Workspace package

**Happy path:**
- GIVEN the monorepo root
- WHEN `pnpm install` runs
- THEN `@centry/sdk-react` resolves as a workspace package with `packages/sdk-react` as its root

### FR-02: DSN parsing

**Happy path:**
- GIVEN a valid DSN `'http://key@host/42'`
- WHEN `init()` is called
- THEN `publicKey` equals `'key'` and the computed ingest URL is `'http://host/api/42/envelope/'`

**Failure path:**
- GIVEN a malformed DSN (e.g. `'not-a-dsn'`)
- WHEN `init()` is called
- THEN the SDK logs a `console.error` and returns without installing any integrations

### FR-03: Logger API

**Happy path:**
- GIVEN `init()` has run successfully
- WHEN `logger.info('Payment submitted')` is called
- THEN a `LogItem` with `level='info'` and `severity_number=9` is added to the buffer

### FR-04: Buffer and flush

**Capacity flush:**
- GIVEN 99 buffered logs
- WHEN a 100th log is captured
- THEN a flush is triggered immediately

**Timer flush:**
- GIVEN 1 buffered log and no other activity
- WHEN 5 seconds elapse
- THEN a flush is triggered

**Unload flush:**
- GIVEN at least one buffered log
- WHEN the page unloads (`beforeunload` / `visibilitychange`)
- THEN `navigator.sendBeacon` delivers the envelope to the ingest endpoint

### FR-05: Envelope transport

**Happy path:**
- GIVEN a flush is triggered
- WHEN the POST request is made
- THEN the `Content-Type` header is `'application/x-sentry-envelope'`
- AND the `X-Sentry-Auth` header contains the public key from the DSN
- AND the body is a valid newline-delimited envelope parseable by `parseEnvelope`

### FR-06: Stack trace capture

**Happy path:**
- GIVEN `logger.error('Payment failed')` is called from `PaymentForm.tsx`
- THEN the resulting `LogItem.attributes` contains `stack_frames` with at least one frame pointing to `PaymentForm.tsx`
- AND no frames from sdk-react internal files are present

**No capture for non-error levels:**
- GIVEN `logger.info('msg')` is called
- THEN `LogItem.attributes` does NOT contain `stack_frames`

### FR-07: Auto-instrumentation integrations

**Global errors:**
- GIVEN `window.onerror` fires with an error
- THEN `logger.fatal` is called with the error message and `error.type` attribute

**Unhandled rejection:**
- GIVEN an unhandled promise rejection occurs
- THEN `logger.fatal` is called with the rejection reason

**Fetch patching:**
- GIVEN `window.fetch('https://api/pay', { method: 'POST' })` is called and returns 200
- THEN a `logger.info` log with `http.method='POST'`, `http.url`, `http.status_code=200`, and `http.duration_ms` is buffered

**Fetch error:**
- GIVEN `window.fetch` returns a 4xx/5xx response
- THEN a `logger.error` log is buffered and the response is still returned to the caller

**XHR success:**
- GIVEN an XHR request completes with status 200
- THEN a `logger.info` log with `http.method`, `http.url`, and `http.status_code=200` is buffered

**XHR error:**
- GIVEN an XHR request completes with status ≥ 400 or status 0
- THEN a `logger.error` log is buffered

**Navigation:**
- GIVEN `history.pushState(null, '', '/checkout')` is called
- THEN a `logger.info` log with `navigation.url='/checkout'` is buffered

**Double-patch guard:**
- GIVEN `init()` is called twice
- THEN `fetch`, `XHR`, and `history.pushState` are patched only once

### FR-08: ErrorBoundary

**Happy path:**
- GIVEN a child component throws an error during render
- WHEN it is wrapped in `<ErrorBoundary fallback={<p>Oops</p>}>`
- THEN `logger.fatal` is called with the error message and `error.component_stack`
- AND the fallback UI is rendered instead of crashing the page

**Default fallback:**
- GIVEN no `fallback` prop is provided
- WHEN a child throws
- THEN a default "Something went wrong." message is rendered

### FR-09: useLogger hook

**Happy path:**
- GIVEN `const log = useLogger('PaymentForm')`
- WHEN `log.info('msg')` is called
- THEN the resulting `LogItem.attributes` includes `component.name='PaymentForm'`

**Stable reference:**
- GIVEN the parent component re-renders with the same `componentName`
- THEN `useLogger` returns the same object reference (no unnecessary re-creation)

### FR-10: SSR safety

**Happy path:**
- GIVEN `typeof window === 'undefined'` (e.g. Next.js SSR)
- WHEN `init()` is called
- THEN no integration code executes and no error is thrown

### FR-11: enableLogs kill switch

**Happy path:**
- GIVEN `init({ dsn, enableLogs: false })`
- WHEN `logger.error('msg')` is called
- THEN no `LogItem` is added to the buffer
- AND no network request is made

### FR-12: beforeSendLog hook

**Mutation:**
- GIVEN `beforeSendLog` returns a modified log
- WHEN a log is captured
- THEN the modified log (not the original) is what gets sent

**Drop:**
- GIVEN `beforeSendLog` returns `null`
- WHEN a log is captured
- THEN the log is silently dropped and no request is made

### FR-13: SDK never throws

**Transport failure:**
- GIVEN the ingest endpoint returns HTTP 500
- THEN the SDK logs `console.warn` with the status and does not throw

**Malformed config:**
- GIVEN any internal error occurs inside the SDK
- THEN the error is caught internally and does not propagate to application code

---

## 6. Constraints

### In Scope

- New `@centry/sdk-react` package (`packages/sdk-react`) in the centry monorepo
- DSN parsing shared with or modelled after `@centry/sdk`
- Sentry envelope format transport with `X-Sentry-Auth` and `sendBeacon` fallback
- `logger` object with six severity levels
- Buffer (max 100 items) with 5-second timer flush, capacity flush, and unload flush
- Stack trace capture for `error` / `fatal` stored in `LogItem.attributes`
- Four auto-instrumentation integrations: global errors, fetch, XHR, navigation
- `ErrorBoundary` React class component
- `useLogger(componentName)` hook
- SSR guard (`typeof window === 'undefined'`)

### Out of Scope

- DOM log panel — this was a browser SDK POC feature; not part of centry's architecture
- React Native — different platform with different globals
- First-class SSR (e.g., log flushing on the server) — only a `typeof window` guard is provided
- Distributed tracing header injection beyond `sentry-trace` on fetch — deferred

### Prohibitions

- SHALL NOT modify `@centry/shared` `LogItem` shape — stack frames go in `attributes`, not a top-level field
- SHALL NOT bundle React — declared as `peerDependency` only
- SHALL NOT throw on any transport, parse, or integration error
- SHALL NOT double-patch `fetch`, `XHR.prototype`, or `history.pushState` if `init()` is called more than once

### Testing Approach

- Selective TDD — TDD for: buffer module, `captureLog` pipeline, transport (envelope building, flush logic), DSN parser, stack trace parser. Test-after for: `ErrorBoundary`, `useLogger`, integration glue code.

### Branch

- Base branch: `dev`
- Feature branch: `feature/sdk-react`
