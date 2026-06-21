# Design: app-ui-theme-extension

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11
- **Requirements:** ../requirements.md

## Architecture

### Components
- `packages/frontend/src/theme.ts` — modified: add `app` light token group
- `packages/frontend/src/components/AppShell.tsx` — modified: adopt `theme.app.*`, apply indigo accent to Menu via antd theme prop
- `packages/frontend/src/pages/projects/index.tsx` — modified: light theme, card click navigates to `/projects/:id`
- `packages/frontend/src/pages/projects/ProjectCard.tsx` — modified: light theme tokens
- `packages/frontend/src/pages/projects/ProjectDetailPanel.tsx` — deleted: replaced by ProjectDetailPage
- `packages/frontend/src/pages/projects/ProjectDetailPage.tsx` — new: project info + DSN block + embedded log stream (FilterBar + LogStream + LogDetailDrawer composed directly)
- `packages/frontend/src/pages/logs/FilterBar.tsx` — modified: `position: sticky; top: 0`, light theme tokens
- `packages/frontend/src/pages/logs/index.tsx` — modified: light theme tokens, outer wrapper `overflow-y: auto`
- `packages/frontend/src/store/useProjectStore.ts` — modified: `rotateKey` updates both `selectedProject` and `projects` array
- `packages/frontend/src/routes/routes.tsx` — modified: add `projectDetail` path, remove `projectLogs`

### Data Flow

**Projects list → detail navigation:**
`ProjectsPage` → `ProjectCard` click → `navigate('/projects/:id')` → `ProjectDetailPage`

**ProjectDetailPage data loading:**
`useParams → projectId` → `useProjectStore.projects.find(p => p.id === projectId)` (calls `fetchProjects()` if array is empty) → renders project info + DSN block

**Embedded log stream:**
`ProjectDetailPage` → `FilterBar` (sticky, light) + `useLogStore.fetchLogs(projectId)` → `LogStream` → `LogDetailDrawer`

**DSN rotate flow:**
`ProjectDetailPage` → `rotateKey(projectId)` → store updates both `projects[]` and `selectedProject` → component re-reads from `projects.find()`

## Interface Contracts

### Internal Interfaces (shared)

- `paths.projectDetail = '/projects/:projectId'` — added to routes.tsx paths constant
- `paths.projectLogs` — removed from routes.tsx paths constant
- `useProjectStore.rotateKey(id)` — modified: now also updates `state.projects` array in addition to `selectedProject`
  - Pre: project with `id` exists in store
  - Post: `projects[i].dsn` updated with new DSN; `selectedProject.dsn` updated if it matches

## Design Decisions

### theme.app token values — duplicate from auth palette
- **Chosen:** Inline hex values mirroring `theme.auth` palette
- **Rationale:** `as const` prevents runtime aliasing; duplicating 6 values is acceptable and keeps the token group self-contained. Values: `bg: '#ffffff'`, `surface: '#f5f7fa'`, `elevated: '#e5e7eb'`, `border: '#d1d5db'`, `text: '#111827'`, `textSecondary: '#6b7280'`
- **Rejected:** Runtime reference to `theme.auth.*` — not possible cleanly with `as const` without restructuring the entire theme object

### AppShell active nav highlight — antd Menu theme prop
- **Chosen:** Pass `colorPrimary: theme.auth.accent` via antd `<Menu theme>` prop (antd v5 design token API)
- **Rationale:** The correct antd v5 way; avoids CSS selector overrides that break across antd upgrades
- **Rejected:** CSS override via `.ant-menu-item-selected` on a styled-component — fights the antd theming layer

### rotateKey — update projects array
- **Chosen:** `rotateKey` in `useProjectStore` now maps over `state.projects` to update the rotated project's DSN in addition to updating `selectedProject`
- **Rationale:** `ProjectDetailPage` looks up the project from `projects.find()`, not `selectedProject`. Without this fix, rotating the key would not update the DSN visible on the page
- **Rejected:** Coupling `ProjectDetailPage` to `selectedProject` — perpetuates the drawer-era pattern being removed

### ProjectDetailPage log embed — direct composition
- **Chosen:** `ProjectDetailPage` imports `FilterBar`, `LogStream`, `LogDetailDrawer` directly and wires `useLogStore` inline
- **Rationale:** `LogsPage` reads `projectId` from `useParams` itself; nesting it would create a double-routed component that is harder to test and reason about
- **Rejected:** Rendering `<LogsPage />` as a child — causes `useParams` conflict and wraps a full page inside another page
