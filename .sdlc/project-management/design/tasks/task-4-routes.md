# Task 4: Create projectRouter and wire into Express app

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07
- **Depends on:** task-3
- **Design:** ../design.md

## Files
- `packages/backend/src/routes/project.ts` — create
- `packages/backend/src/routes/index.ts` — modify (export projectRouter)
- `packages/backend/src/index.ts` — modify (mount projectRouter at /api/projects)
- `packages/backend/src/tests/routes/project.test.ts` — create

## Design References
- design.md §Architecture (projectRouter)
- design.md §Interface Contracts (API Endpoints)
- design.md §Design Decisions (Ownership check pattern)

## Contracts (task-specific)

### API Endpoints
- GET /api/projects → `requireAuth` → `ProjectService.list(req.accountId)`; respond 200 array
- POST /api/projects → `requireAuth` → `ProjectService.create(req.accountId, req.body)`; respond 201
- PATCH /api/projects/:id → `requireAuth` → `ProjectService.update(req.accountId, req.params.id, req.body)`; respond 200
- DELETE /api/projects/:id → `requireAuth` → `ProjectService.archive(req.accountId, req.params.id)`; respond 204
- POST /api/projects/:id/rotate-key → `requireAuth` → `ProjectService.rotateKey(req.accountId, req.params.id)`; respond 200 `{ dsn }`

Error mapping:
- `ZodError` → 400 `{ error: firstIssueMessage }`
- `ProjectNotFoundError` → 404 `{ error: 'not found' }`
- `ProjectForbiddenError` → 403 `{ error: 'forbidden' }`

## Acceptance Criteria

### FR-01: List projects
- GIVEN a valid JWT and `GET /api/projects`
- THEN the handler SHALL call `ProjectService.list` with the accountId from the token and respond 200

### FR-01: Unauthenticated
- GIVEN no Authorization header and `GET /api/projects`
- THEN the response SHALL be 401

### FR-02: Create
- GIVEN a valid JWT and `POST /api/projects` with valid body
- THEN the handler SHALL respond 201 with the project including `dsn`

### FR-03: Cross-account update
- GIVEN `ProjectService.update` throws `ProjectForbiddenError`
- THEN the handler SHALL respond 403 `{ error: 'forbidden' }`

### FR-04: Archive
- GIVEN a valid JWT and `DELETE /api/projects/:id`
- THEN the handler SHALL respond 204 with no body

### FR-05: Rotate key
- GIVEN a valid JWT and `POST /api/projects/:id/rotate-key`
- THEN the handler SHALL respond 200 `{ dsn: '<new-dsn>' }`

## Done Criteria
- [ ] `projectRouter` exported from `packages/backend/src/routes/index.ts`
- [ ] Router mounted at `/api/projects` in `packages/backend/src/index.ts`
- [ ] All 5 route handlers implemented with correct HTTP methods and status codes
- [ ] `requireAuth` middleware applied to all routes
- [ ] All error classes mapped to correct HTTP status codes
- [ ] Route handler tests pass (mock ProjectService with `vi.mock`)
- [ ] `pnpm --filter @centry/backend test` passes
