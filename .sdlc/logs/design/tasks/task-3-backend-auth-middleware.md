# Task 3: Backend — requireIngestKey and requireProjectOwner middleware

## Trace
- **FR-IDs:** FR-05, FR-06
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/backend/src/middleware/requireIngestKey.ts` — create
- `packages/backend/src/middleware/requireProjectOwner.ts` — create
- `packages/backend/src/types/express.d.ts` — modify
- `packages/backend/src/tests/middleware/requireIngestKey.test.ts` — create
- `packages/backend/src/tests/middleware/requireProjectOwner.test.ts` — create

## Design References
- design.md §Architecture (requireIngestKey, requireProjectOwner components)
- design.md §Interface Contracts (requireIngestKey, requireProjectOwner internal interfaces)
- design.md §Data Flow (Ingest path, Query path)

## Contracts (task-specific)

### Internal Interfaces
- `requireIngestKey(req, res, next): void`
  - Pre: `req.params.id` is the project UUID from the route
  - Post: sets `req.project` on success; returns `401` if `X-Sentry-Auth` is missing/invalid; returns `403` if key belongs to a different project

- `requireProjectOwner(req, res, next): void`
  - Pre: `req.accountId` is set by prior `requireAuth`; `req.params.id` is the project UUID
  - Post: sets `req.project` on success; returns `404` if project not found; returns `403` if `project.account_id !== req.accountId`

## Acceptance Criteria

### FR-05: requireIngestKey — happy path
- GIVEN a valid `X-Sentry-Auth` header with a known `sentry_key` matching `:projectId`
- WHEN the middleware runs
- THEN it SHALL call `next()` and attach the project to `req`

### FR-05: requireIngestKey — 401
- GIVEN an `X-Sentry-Auth` header with an unknown `sentry_key`
- WHEN the middleware runs
- THEN it SHALL return `401`

### FR-05: requireIngestKey — 403
- GIVEN a valid key that belongs to a different project
- WHEN the middleware runs
- THEN it SHALL return `403`

### FR-06: requireProjectOwner — happy path
- GIVEN a valid JWT whose `accountId` owns `:projectId`
- WHEN the middleware runs (after `requireAuth`)
- THEN it SHALL call `next()`

### FR-06: requireProjectOwner — 401
- GIVEN a missing or invalid JWT (handled by upstream `requireAuth`)
- WHEN `requireAuth` runs
- THEN it SHALL return `401` before `requireProjectOwner` is reached

### FR-06: requireProjectOwner — 403
- GIVEN a valid JWT whose `accountId` does NOT own `:projectId`
- WHEN the middleware runs
- THEN it SHALL return `403`

## Done Criteria
- [ ] `requireIngestKey` parses `X-Sentry-Auth` header for `sentry_key` value
- [ ] `requireIngestKey` looks up `ProjectKey` by `public_key` and confirms `project_id` matches `req.params.id`
- [ ] `requireIngestKey` sets `req.project` on success
- [ ] `requireProjectOwner` fetches `Project` by `req.params.id`, returns `404` if not found
- [ ] `requireProjectOwner` returns `403` if `project.account_id !== req.accountId`
- [ ] `requireProjectOwner` sets `req.project` on success
- [ ] `express.d.ts` extends `Request` with `project?: Project`
- [ ] All 401/403/success cases covered in test files
