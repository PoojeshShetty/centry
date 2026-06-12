# Task 6: Frontend — Route, logApi, useLogStore, LogsPage skeleton, and FilterBar

## Trace
- **FR-IDs:** FR-12, FR-13, FR-17
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/frontend/src/routes/routes.tsx` — modify
- `packages/frontend/src/api/logApi.ts` — create
- `packages/frontend/src/store/useLogStore.ts` — create
- `packages/frontend/src/pages/logs/index.tsx` — create
- `packages/frontend/src/pages/logs/FilterBar.tsx` — create
- `packages/frontend/src/routes/__tests__/routes.test.tsx` — update (interface change)
- `packages/frontend/src/pages/logs/__tests__/FilterBar.test.tsx` — create

## Design References
- design.md §Architecture (LogsPage, FilterBar, useLogStore, logApi, paths.projectLogs)
- design.md §Data Flow (Frontend render path)
- design.md §Interface Contracts (GET /api/projects/:id/logs)

## Contracts (task-specific)

### Internal Interfaces
- `logApi.query(projectId: string, filters: LogFilters, token: string) -> Promise<{ logs: LogItem[], nextCursor: string | null, hasMore: boolean }>`
  - Pre: valid JWT `token`; `projectId` matches an owned project
  - Post: returns paginated log response

- `useLogStore` (Zustand) — state shape:
  - `logs: LogItem[]`, `filters: LogFilters`, `nextCursor: string | null`, `hasMore: boolean`, `loading: boolean`, `error: string | null`
  - Actions: `fetchLogs(projectId)`, `fetchNextPage(projectId)`, `setFilter(key, value)`, `resetFilters()`

## Acceptance Criteria

### FR-12: Logs page route
- GIVEN the user navigates to `/projects/:projectId/logs`
- WHEN the route matches
- THEN `LogsPage` SHALL render and begin fetching logs

### FR-13: FilterBar — level filter
- GIVEN the logs page is open
- WHEN the user selects the "error" level pill
- THEN only error-level logs SHALL be requested
- AND the URL SHALL update with `?level=error`

### FR-17: URL state sync
- GIVEN the user sets filters (level + search)
- WHEN the page URL is copied and opened in a new tab
- THEN the same filter state SHALL be restored

## Done Criteria
- [ ] `paths.projectLogs` added to `routes.tsx` as `/projects/:projectId/logs`
- [ ] `LogsPage` route entry added to `appRoutes` wrapped in `ProtectedRoute`
- [ ] `logApi.query` calls `GET /api/projects/:id/logs` with correct auth header and query params
- [ ] `useLogStore` manages `logs`, `filters`, `nextCursor`, `hasMore`, `loading`, `error`
- [ ] `useLogStore.setFilter` updates filter state and resets `logs` + `nextCursor` (new filter = fresh fetch)
- [ ] `FilterBar` renders: ALL / TRACE / DEBUG / INFO / WARN / ERROR / FATAL level pills (default ALL)
- [ ] `FilterBar` renders debounced text search input (300 ms)
- [ ] `FilterBar` renders 1h / 6h / 24h / 7d time-range preset buttons
- [ ] All filter state (level, search, start, end) synced to URL query params via `useSearchParams`
- [ ] On mount, `LogsPage` reads filter state from URL params and restores it to `useLogStore`
- [ ] `routes.test.tsx` updated to include the new `/projects/:projectId/logs` path
- [ ] `FilterBar.test.tsx` covers: level pill selection updates store + URL; debounced search fires after 300 ms
