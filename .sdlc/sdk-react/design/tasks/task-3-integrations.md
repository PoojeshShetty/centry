# Task 3: Auto-instrumentation integrations

## Trace
- **FR-IDs:** FR-07, FR-10
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/sdk-react/src/integrations/globalErrors.ts` — create
- `packages/sdk-react/src/integrations/fetch.ts` — create
- `packages/sdk-react/src/integrations/xhr.ts` — create
- `packages/sdk-react/src/integrations/navigation.ts` — create
- `packages/sdk-react/src/integrations/tests/integrations.test.ts` — create

## Design References
- design.md §Architecture (`integrations/globalErrors.ts`, `integrations/fetch.ts`, `integrations/xhr.ts`, `integrations/navigation.ts`)
- design.md §Interface Contracts (`installIntegrations()`)
- design.md §Design Decisions (Double-patch guard for integrations)

## Contracts (task-specific)

### Internal Interfaces
- `installGlobalErrors(): void`
  - Pre: `typeof window !== 'undefined'`
  - Post: patches `window.onerror` to call `logger.fatal`; patches `window.onunhandledrejection` to call `logger.fatal`; idempotent (module-level `patched` boolean guard)

- `installFetch(): void`
  - Pre: `typeof window !== 'undefined'` and `typeof window.fetch !== 'undefined'`
  - Post: wraps `window.fetch`; on response → `logger.info` (2xx) or `logger.error` (4xx/5xx) with `http.method`, `http.url`, `http.status_code`, `http.duration_ms`; original response returned to caller; idempotent

- `installXhr(): void`
  - Pre: `typeof window !== 'undefined'`
  - Post: wraps `XMLHttpRequest.prototype.open` and `send`; on `loadend` → `logger.info` (status 200-399) or `logger.error` (status ≥ 400 or 0) with `http.method`, `http.url`, `http.status_code`; idempotent

- `installNavigation(): void`
  - Pre: `typeof window !== 'undefined'`
  - Post: wraps `history.pushState`; listens to `popstate`; on navigation → `logger.info` with `navigation.url`; idempotent

- `installIntegrations(): void` (called from `core/init.ts`)
  - Pre: `typeof window !== 'undefined'`
  - Post: calls all four `install*()` functions

## Acceptance Criteria

### FR-07: Global errors
- GIVEN `window.onerror` fires with an error message and error object
- THEN `logger.fatal` is called with the error message and `{ 'error.type': error.name }` in attributes

### FR-07: Unhandled rejection
- GIVEN an unhandled promise rejection occurs with a reason
- THEN `logger.fatal` is called with the rejection reason as message

### FR-07: Fetch success
- GIVEN `window.fetch('https://api/pay', { method: 'POST' })` returns status 200
- THEN a `logger.info` log with `http.method='POST'`, `http.url='https://api/pay'`, `http.status_code=200`, and `http.duration_ms` (number) is buffered

### FR-07: Fetch error
- GIVEN `window.fetch` returns a 4xx/5xx response
- THEN a `logger.error` log is buffered and the response is still returned to the caller

### FR-07: XHR success
- GIVEN an XHR request completes with status 200
- THEN a `logger.info` log with `http.method`, `http.url`, and `http.status_code=200` is buffered

### FR-07: XHR error
- GIVEN an XHR request completes with status ≥ 400 or status 0
- THEN a `logger.error` log is buffered

### FR-07: Navigation via pushState
- GIVEN `history.pushState(null, '', '/checkout')` is called
- THEN a `logger.info` log with `navigation.url='/checkout'` is buffered

### FR-07: Double-patch guard
- GIVEN `init()` is called twice
- THEN `fetch`, `XHR`, and `history.pushState` are patched only once (no duplicate listeners or wrapping)

### FR-10: SSR safety
- GIVEN `typeof window === 'undefined'`
- WHEN `installIntegrations()` is called
- THEN no integration code executes and no error is thrown

## Done Criteria
- [ ] `installGlobalErrors` patches `window.onerror` once; calling it twice leaves only one layer of patching
- [ ] `installGlobalErrors` patches `window.onunhandledrejection` once
- [ ] `installFetch` wraps `window.fetch`; patched only once; original response returned to caller
- [ ] `installFetch` logs `logger.info` for 2xx and `logger.error` for 4xx/5xx with correct attributes
- [ ] `installXhr` wraps `XMLHttpRequest`; patched only once
- [ ] `installXhr` logs correct level based on status code
- [ ] `installNavigation` wraps `history.pushState`; patched only once; `popstate` listener installed once
- [ ] All integration unit tests pass (`pnpm --filter @centry/sdk-react test`)
