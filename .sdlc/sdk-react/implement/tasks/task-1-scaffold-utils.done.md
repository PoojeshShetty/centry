# Task 1 Completion: Scaffold package and utilities

## Summary
Created the `@centry/sdk-react` workspace package with full scaffolding: `package.json`, `tsconfig.json`, `vitest.config.ts` (jsdom), `types.ts`, utils (`parseDsn`, `stackTrace`, `constants`), `transport/urls.ts`, and unit tests. Root `tsconfig.json` updated with the new package reference.

## Commits
- `af24a8c` feat(sdk-react): scaffold package, utils, and transport URLs (FR-01, FR-02)

## Deviations
- **Rule 1: Bug** — `transport/urls.ts` uses `/api/projects/${projectId}/envelope/` (matching the actual backend route at `app.use('/api/projects', projectRouter)`) rather than `/api/${projectId}/envelope/` as written in `design.md §Interface Contracts`. The design doc has a typo; the SDK's existing `urls.ts` uses the same corrected path.

## Difficulties
None.

## Notes
`envelopeUrl` currently hardcodes `http://` scheme. Task 2 (transport) may need to detect `https` from the DSN protocol if the SDK is used against a TLS backend.
