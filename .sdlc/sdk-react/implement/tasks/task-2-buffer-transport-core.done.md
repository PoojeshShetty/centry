# Task 2 Completion: Buffer, transport, and core pipeline

## Summary
Implemented the full browser log pipeline: `buffer.ts` (100-item flush, 5s interval, `beforeunload` beacon), `envelope.ts` (envelope string builder), `transport.ts` (fetch POST with Sentry auth headers), `init.ts` (DSN parsing, double-init guard), `captureLog.ts` (log assembly with `client.address`, stack frames for error/fatal, `beforeSendLog` hook), and `logger.ts` (six severity-level methods). 46 unit tests pass across buffer, transport, and captureLog.

## Commits
- `a0f2ace` feat(sdk-react): implement buffer, transport, and core pipeline (FR-03, FR-04, FR-05, FR-06, FR-11, FR-12, FR-13)

## Deviations
- **Rule 1: Bug** — `setInterval` was missing the `typeof window !== 'undefined'` SSR guard (only `window.addEventListener` had the guard). Fixed during implementation to prevent the timer from running in SSR/Node environments.

## Difficulties
- `navigator.sendBeacon` does not exist in jsdom — `vi.spyOn(navigator, 'sendBeacon')` throws "sendBeacon does not exist". Fixed by using `vi.stubGlobal('navigator', { ...navigator, sendBeacon: mockFn })` before the beacon tests.

## Notes
- `getConfig()` returns `ResolvedConfig | null` (unlike `@centry/sdk` which throws) — callers check for null and return early; SDK never throws.
- `setInterval` and `window.addEventListener('beforeunload', ...)` are co-located inside one `typeof window !== 'undefined'` block so both are consistently guarded against SSR.
