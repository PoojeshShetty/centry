# Task 3 Completion: Implement AsyncLocalStorage context and traceMiddleware

## Summary
Created `context.ts` exporting a single `AsyncLocalStorage<TraceContext>` instance (`traceStore`) and `traceMiddleware` that reads/generates trace IDs, sets the outgoing `sentry-trace` response header, and runs `next()` inside `traceStore.run()` for context propagation.

## Commits
- `b8a8a54` refactor(sdk): move tests to tests/ subdirs and centralise SDK_NAME constant
- `f4837bc` refactor(sdk): remove old test files from src root (moved to tests/ subdirs)
- `39119b3` feat(sdk): implement AsyncLocalStorage context and traceMiddleware (FR-08)

## Deviations
- **Rule 1: Bug** — Vitest does not support the `done()` callback pattern; rewrote tests as `async/await` with `Promise` wrappers. No spec impact.

## Difficulties
- None

## Notes
- Two refactor commits precede the feat commit because the user requested structural changes (test layout + `SDK_NAME` constant) mid-task before the commit was finalised.
- `SDK_VERSION` is also exported from `constants.ts` for use by future tasks (captureLog builds `sentry.sdk.version` attribute).
