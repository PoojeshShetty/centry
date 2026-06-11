# Task 6: Build ProjectsPage, ProjectCard grid, and CreateProjectModal

## Trace
- **FR-IDs:** FR-08, FR-10
- **Depends on:** task-5
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/projects/index.tsx` — create
- `packages/frontend/src/pages/projects/ProjectCard.tsx` — create
- `packages/frontend/src/pages/projects/CreateProjectModal.tsx` — create
- `packages/frontend/src/pages/projects/__tests__/projects.test.tsx` — create
- `packages/frontend/src/routes/routes.tsx` — modify (add /projects route)
- `packages/frontend/src/pages/home/index.tsx` — modify (add link to /projects)

## Design References
- design.md §Architecture (ProjectsPage, ProjectCard, CreateProjectModal)

## Contracts (task-specific)

### Internal Interfaces
- `ProjectCard` props: `{ project: Project; onSelect: (p: ProjectWithDsn) => void; onArchive: (id: string) => void }`
  - Displays: name, application_url, environment badge (styled span), created_at (formatted date)
  - "Archive" button triggers `onArchive` — parent shows confirmation dialog before calling store
- `CreateProjectModal` props: `{ open: boolean; onClose: () => void }`
  - Form fields: name (required), application_url (required), environment (required), description (optional)
  - On submit: calls `useProjectStore.createProject`, closes modal on success

## Acceptance Criteria

### FR-08: Card grid
- GIVEN a logged-in user with 3 projects in `useProjectStore`
- WHEN `/projects` renders
- THEN 3 `ProjectCard` components SHALL render
- AND each SHALL display name, application_url, environment badge, and created_at

### FR-08: Empty state
- GIVEN a logged-in user with no projects
- WHEN `/projects` renders
- THEN an empty state message SHALL render with a "Create project" button

### FR-10: Archive with confirmation
- GIVEN the user clicks "Archive" on a card
- WHEN the antd confirmation modal appears and the user confirms
- THEN `useProjectStore.archiveProject` SHALL be called and the card SHALL disappear

### FR-10: Archive cancelled
- GIVEN the user clicks "Archive" on a card
- WHEN the user dismisses the confirmation dialog
- THEN `useProjectStore.archiveProject` SHALL NOT be called

## Done Criteria
- [ ] `/projects` route added to `routes.tsx` wrapped in `ProtectedRoute`
- [ ] `paths.projects` added to route constants
- [ ] `ProjectsPage` renders a grid of `ProjectCard` components from store
- [ ] `ProjectsPage` renders empty state when `projects` array is empty
- [ ] `CreateProjectModal` form submits via `useProjectStore.createProject`
- [ ] Archive button shows antd `Modal.confirm` before calling store
- [ ] Styled components defined at module scope (not inside render)
- [ ] Page tests pass using `renderPage` helper from `testUtils.tsx`
- [ ] `pnpm --filter @centry/frontend test` passes
