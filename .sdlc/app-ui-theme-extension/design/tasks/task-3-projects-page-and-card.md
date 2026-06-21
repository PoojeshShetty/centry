# Task 3: Update ProjectsPage, ProjectCard, and fix rotateKey in store

## Trace
- **FR-IDs:** FR-03, FR-04, FR-06
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/projects/index.tsx` — modify
- `packages/frontend/src/pages/projects/ProjectCard.tsx` — modify
- `packages/frontend/src/store/useProjectStore.ts` — modify
- `packages/frontend/src/pages/projects/__tests__/projects.test.tsx` — update (card click now expects navigation, not selectProject)
- `packages/frontend/src/pages/projects/__tests__/ProjectDetailPanel.test.tsx` — delete or skip (component being removed)
- `packages/frontend/src/store/__tests__/useProjectStore.test.ts` — update (rotateKey now updates projects array)

## Design References
- design.md §Architecture (ProjectsPage, ProjectCard, useProjectStore)
- design.md §Design Decisions (rotateKey — update projects array)

## Contracts (task-specific)

### Internal Interfaces
- `ProjectCard.onSelect` prop: `(p: ProjectWithDsn) => void` — signature unchanged; `ProjectsPage` now passes `(p) => navigate('/projects/' + p.id)` instead of `selectProject`
- `useProjectStore.rotateKey(id)`: also updates `state.projects` map — `projects[i].dsn` set to new DSN for matching id

## Acceptance Criteria

### FR-03 & FR-04: ProjectsPage and ProjectCard light theme
- GIVEN the user navigates to `/projects`
- WHEN the page renders
- THEN the page background SHALL be white or off-white
- AND each project card SHALL have a white/light-surface background with a light border and dark text

### FR-06: ProjectCard click navigates to detail page
- GIVEN the projects list page
- WHEN the user clicks a project card
- THEN the browser SHALL navigate to `/projects/:projectId`
- AND no drawer SHALL appear

- GIVEN `ProjectsPage` after this change
- WHEN rendered
- THEN `ProjectDetailPanel` SHALL NOT be present in the component tree

## Done Criteria
- [ ] `ProjectsPage` `PageWrapper` uses `theme.app.bg` background
- [ ] `ProjectsPage` `EmptyState` text uses `theme.app.textSecondary`
- [ ] `ProjectCard` `Card` uses `theme.app.surface` background, `theme.app.border` border
- [ ] `ProjectCard` `ProjectName` uses `theme.app.text`
- [ ] `ProjectCard` `ProjectUrl` uses `theme.app.textSecondary`
- [ ] `ProjectCard` `EnvironmentBadge` uses `theme.app.elevated` background, `theme.app.textSecondary` text
- [ ] `ProjectCard` `CreatedAt` uses `theme.app.textSecondary`
- [ ] `ProjectsPage` card click calls `navigate('/projects/' + p.id)`, not `selectProject`
- [ ] `ProjectDetailPanel` import and usage removed from `ProjectsPage`
- [ ] `useProjectStore.rotateKey` updates `state.projects` array (not only `selectedProject`)
- [ ] Existing `projects.test.tsx` tests pass with updated expectations (card click → navigate)
- [ ] `useProjectStore.test.ts` rotateKey test updated and passing
- [ ] TypeScript compiles with no errors
