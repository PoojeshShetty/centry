# Task 7: Build ProjectDetailPanel with DSN reveal/copy and rotate-key control

## Trace
- **FR-IDs:** FR-09
- **Depends on:** task-5
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/projects/ProjectDetailPanel.tsx` — create
- `packages/frontend/src/pages/projects/__tests__/ProjectDetailPanel.test.tsx` — create
- `packages/frontend/src/pages/projects/index.tsx` — modify (wire in ProjectDetailPanel, pass selectedProject)
- `packages/frontend/src/pages/projects/__tests__/projects.test.tsx` — update (interface change — panel now renders)

## Design References
- design.md §Architecture (ProjectDetailPanel)
- design.md §Interface Contracts (API Endpoints — POST /api/projects/:id/rotate-key)

## Contracts (task-specific)

### Internal Interfaces
- `ProjectDetailPanel` props: `{ project: ProjectWithDsn | null; onClose: () => void }`
  - Renders as antd `Drawer` (or styled aside panel) when `project` is not null
  - DSN field: masked by default (`https://••••••••@host/id`); "Reveal" button toggles full value
  - Copy button: calls `navigator.clipboard.writeText(dsn)`; shows antd `message.success`
  - "Rotate key" button: calls `useProjectStore.rotateKey(project.id)` then updates display with new DSN

## Acceptance Criteria

### FR-09: Masked by default
- GIVEN the detail panel renders with a project
- THEN the DSN field SHALL show a masked value
- AND a "Reveal" control SHALL be present

### FR-09: Reveal
- GIVEN the panel is open
- WHEN the user clicks "Reveal"
- THEN the full DSN value SHALL be shown

### FR-09: Copy DSN
- GIVEN the panel is open and DSN is visible
- WHEN the user clicks the copy icon
- THEN `navigator.clipboard.writeText` SHALL be called with the full DSN

### FR-09: Rotate key
- GIVEN the panel is open
- WHEN the user clicks "Rotate key"
- THEN `useProjectStore.rotateKey` SHALL be called
- AND the displayed DSN SHALL update to the new value

## Done Criteria
- [ ] `ProjectDetailPanel` component renders when `selectedProject` in store is non-null
- [ ] DSN is masked on initial render
- [ ] Clicking "Reveal" shows the full DSN
- [ ] Copy button calls `navigator.clipboard.writeText` with the DSN
- [ ] "Rotate key" calls `useProjectStore.rotateKey` and updates displayed DSN
- [ ] Panel closes (sets `selectedProject` to null) when `onClose` is triggered
- [ ] Styled components defined at module scope
- [ ] Panel tests pass
- [ ] `pnpm --filter @centry/frontend test` passes
