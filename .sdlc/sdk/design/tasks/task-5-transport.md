# Task 5: Implement HTTP transport (never-throws)

## Trace
- **FR-IDs:** FR-07, FR-09
- **Depends on:** task-1, task-4
- **Design:** ../design.md

## Files
- `packages/sdk/src/transport.ts` — create
- `packages/sdk/src/transport.test.ts` — create

## Design References
- design.md §Architecture (transport.ts component)
- design.md §Interface Contracts (transport.send)
- design.md §Design Decisions (Config singleton: module-level variable + getConfig())

## Contracts (task-specific)

### Internal Interfaces
- `send(logs: LogItem[]) -> Promise<void>`
  - Pre: none (safe to call before `init()`)
  - Post: POSTs `envelope.build(logs)` to `https://<host>/api/<projectId>/envelope/`
  - Headers: `Content-Type: application/x-sentry-envelope`, `X-Sentry-Auth: Sentry sentry_version=7, sentry_client=<name>/<version>, sentry_key=<publicKey>`
  - Non-2xx: calls `console.error` with status, does not throw
  - Network error: swallows, logs to `console.error`, does not throw
  - `getConfig()` throws (called before init): returns silently without throwing
  - Post: never throws or rejects under any circumstances

## Acceptance Criteria

### FR-07: Transport

**Non-2xx response:**
- GIVEN `fetch` returns a `500` response
- WHEN `send(logs)` is called
- THEN `console.error` SHALL be called with the status
- AND no exception SHALL propagate

**Network error:**
- GIVEN `fetch` rejects with a network error
- WHEN `send(logs)` is called
- THEN the error SHALL be swallowed (logged to `console.error`)
- AND no exception SHALL propagate

**Before init:**
- GIVEN `send(logs)` is called without `init()` having been called
- WHEN `getConfig()` throws internally
- THEN `send` SHALL return silently without throwing

### FR-09: SDK never throws

- GIVEN any transport call
- WHEN an internal error occurs
- THEN no exception SHALL propagate to the caller

## Done Criteria
- [ ] `send` POSTs to correct URL with correct `Content-Type` and `X-Sentry-Auth` headers
- [ ] Non-2xx response results in `console.error` call, no thrown exception
- [ ] Network error is swallowed, no thrown exception
- [ ] Calling `send` before `init()` returns silently without throwing
- [ ] `send` is typed as `Promise<void>` and never rejects
- [ ] All `transport.test.ts` cases pass
