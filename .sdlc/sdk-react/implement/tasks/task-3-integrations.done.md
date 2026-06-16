# Task 3 Completion: Auto-instrumentation integrations

## Summary
Created four browser integration modules (`globalErrors`, `fetch`, `xhr`, `navigation`) with idempotent `install*()` functions and an `installIntegrations()` barrel. Updated `init.ts` to call `installIntegrations()` after a successful DSN parse when running in a browser context. 15 new integration tests, 61 total passing.

## Commits
- `7aec09e` feat(sdk-react): implement auto-instrumentation integrations (FR-07, FR-10)

## Deviations
- **Rule 2: Missing Critical** — Added `resetForTest()` exports to all four integration modules (same pattern as `buffer.ts` and `init.ts`). Required for test isolation because module-level `patched` booleans persist across test cases within a file.
- **Rule 1: Bug** — jsdom does not implement `PromiseRejectionEvent`; used `Object.assign(new Event('unhandledrejection'), { reason })` in tests instead of `new PromiseRejectionEvent(...)`. Implementation reads `event.reason` via duck typing, which works correctly in real browsers.

## Difficulties
- XHR tests: `event.target` is a read-only getter on `Event` — `Object.assign` to set it fails. Fixed by using `Object.defineProperty(xhr, 'status', { get: () => N, configurable: true })` before dispatching `loadend` synchronously.
- Navigation idempotency: `resetForTest()` initially only reset `patched`, leaving stale `history.pushState` wrappers from prior tests. Fixed by saving the original `pushState` and popstate listener at module level and restoring both in `resetForTest()`.
