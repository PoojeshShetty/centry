# Task 5 Completion: Implement HTTP transport (never-throws)

## Summary
Created `transport.ts` with a `send(logs)` function that builds an envelope and POSTs it to the backend. Extracted URL construction into `urls.ts` for centralised API URL management. All error paths (non-2xx, network failure, pre-init) are swallowed and logged to `console.error` — the function never throws or rejects.

## Commits
- `3eb15f5` feat(sdk): implement HTTP transport and centralise API URLs (FR-07, FR-09)

## Deviations
- **Rule 1: Refactor** — extracted URL construction into `urls.ts` (user request during review, no behaviour change)

## Difficulties
None

## Notes
- `urls.ts` is the single place to add new SDK API endpoint URLs. Future tasks (e.g. a session endpoint) should add a builder function there.
- The `X-Sentry-Auth` scheme name (`Sentry sentry_version=7`) is intentional wire-protocol compatibility — to be revisited alongside the backend ingest middleware.
