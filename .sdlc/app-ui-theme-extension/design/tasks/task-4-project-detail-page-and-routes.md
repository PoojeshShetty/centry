# Task 4: Create ProjectDetailPage and update routes

## Trace
- **FR-IDs:** FR-05, FR-07, FR-10, FR-11
- **Depends on:** task-3
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/projects/ProjectDetailPage.tsx` — create
- `packages/frontend/src/routes/routes.tsx` — modify
- `packages/frontend/src/pages/projects/ProjectDetailPanel.tsx` — delete
- `packages/frontend/src/routes/__tests__/routes.test.tsx` — update (new projectDetail route, removed projectLogs)

## Design References
- design.md §Architecture (ProjectDetailPage, Data Flow — embedded log stream, routes.tsx)
- design.md §Design Decisions (ProjectDetailPage log embed — direct composition)
- design.md §Interface Contracts (paths.projectDetail, rotateKey)

## Contracts (task-specific)

### Internal Interfaces
- `paths.projectDetail = '/projects/:projectId'` — new constant in `routes.tsx`
- `paths.projectLogs` — removed from `routes.tsx`
- `ProjectDetailPage` reads `projectId` from `useParams`; calls `useProjectStore` (fetchProjects if empty, find by id); calls `useLogStore` (fetchLogs, logs, filters, hasMore, fetchNextPage)

## Acceptance Criteria

### FR-05: ProjectDetailPage — project info + embedded logs
- GIVEN the user is on `/projects/:projectId`
- WHEN the page renders
- THEN a top section SHALL show the project name, environment, application URL, and created date
- AND a DSN block SHALL appear below showing the masked DSN with Copy, Reveal/Hide, and Rotate key buttons
- AND the full logs section (FilterBar + log stream) SHALL appear below the DSN block for the same project

- GIVEN the ProjectDetailPage
- WHEN the user clicks "Reveal"
- THEN the full DSN value SHALL be displayed in plaintext
- WHEN the user clicks "Hide"
- THEN the DSN SHALL be masked again

- GIVEN the ProjectDetailPage
- WHEN the user clicks "Rotate key"
- THEN `rotateKey` store action SHALL be called and the DSN SHALL revert to masked state

### FR-07: Route changes
- GIVEN the application router
- WHEN the user navigates to `/projects/abc123`
- THEN `ProjectDetailPage` SHALL render with `projectId = "abc123"`

- GIVEN the application router
- WHEN the user navigates to `/projects/abc123/logs`
- THEN the route SHALL either redirect to `/projects/abc123` or render the 404 page

### FR-10: Back navigation
- GIVEN the user is on `/projects/:projectId`
- WHEN the user clicks "← Projects"
- THEN the browser SHALL navigate to `/projects`

### FR-11: ProjectDetailPage light theme
- GIVEN `/projects/:projectId`
- WHEN the page renders
- THEN all surfaces SHALL use `theme.app.*` light tokens

## Done Criteria
- [ ] `ProjectDetailPage.tsx` exists at `packages/frontend/src/pages/projects/ProjectDetailPage.tsx`
- [ ] Page renders: project name, environment badge, application URL, created date in a top info section
- [ ] DSN block renders masked DSN by default; Reveal/Hide toggles; Copy copies full DSN to clipboard
- [ ] Rotate key button calls `rotateKey(projectId)` and resets reveal state to false
- [ ] "← Projects" link navigates to `/projects`
- [ ] `FilterBar` + `LogStream` + `LogDetailDrawer` rendered below DSN block, wired to `useLogStore` with `projectId`
- [ ] `routes.tsx` `paths.projectDetail = '/projects/:projectId'` added
- [ ] `routes.tsx` `paths.projectLogs` removed; route entry for projectLogs removed
- [ ] `ProjectDetailPage` added to `appRoutes` inside the `ProtectedRoute`/`AppShell` children
- [ ] `ProjectDetailPanel.tsx` file deleted
- [ ] All `theme.app.*` tokens used for surfaces, text, borders (no `theme.bg.*` or `theme.border.*`)
- [ ] Render test for `ProjectDetailPage` passes (project info section + back link visible)
- [ ] `routes.test.tsx` updated and passing
- [ ] TypeScript compiles with no errors
