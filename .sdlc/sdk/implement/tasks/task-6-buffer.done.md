# Task 6 Completion: Implement log buffer with flush triggers, hard cap, and signal handlers

## Summary
Created `buffer.ts` with `push`/`flush` functions, a 5s `setInterval` timer (`.unref()`'d), hard cap at 1000 items with a `dropped` counter, and `SIGTERM`/`SIGINT` signal handlers that await flush before `process.exit(0)`. Test-only exports (`resetForTest`, `setBufferForTest`) allow isolated unit testing without module re-imports.

## Commits
- `d89487d` test(sdk): add failing tests for log buffer (FR-05, FR-09)
- `b456113` feat(sdk): implement log buffer with flush, hard cap, and signal handlers (FR-05, FR-09)

## Deviations
- **Rule 2: Missing Critical** — added `setBufferForTest(items)` export beyond the spec's `resetForTest`. Auto-flush at 100 items drains the buffer synchronously (the `buffer = []` swap precedes the first `await`), making it impossible to test the 1000-item hard cap by pushing 1000 times through `push()`. `setBufferForTest` pre-fills the buffer directly, bypassing auto-flush to make the cap tests deterministic.

## Difficulties
- Hard cap tests failed initially because the synchronous buffer swap inside `flush()` (`buffer = []` before `await send(batch)`) means the buffer drains on every 100th push, preventing the buffer from reaching 1000 items via `push()`. Solved by adding `setBufferForTest` to pre-fill the buffer directly for cap-testing scenarios.

## Notes
Signal handler tests use `process.emit('SIGTERM'/'SIGINT')` + a short `setTimeout(r, 10)` tick to let the async handler resolve before asserting. This is sufficient because the handler is `process.once`, so repeated `resetForTest` calls in `beforeEach` don't re-register handlers — signal handlers survive across test cases in the same module instance.
