# Task 7 Completion: Build ProjectDetailPanel with DSN reveal/copy and rotate-key control

## Summary
Created `ProjectDetailPanel` as an antd Drawer that shows a masked DSN with reveal/hide toggle, a copy button, and a rotate-key button wired to `useProjectStore.rotateKey`. Wired the panel into `ProjectsPage` via `selectedProject`/`selectProject` from the store.

## Commits
- `9b93e13` feat(project-management): implement ProjectDetailPanel with DSN reveal, copy, and rotate-key (FR-09)

## Deviations
- **Rule 1: Bug** — `projectApi.list()` was typed as `Promise<Project[]>` but the backend has always returned `ProjectWithDsn[]` (DSN included). Updated the type to match the actual API response so the store's `projects` array carries DSN and can pass it to the panel without an extra fetch.
- **Rule 2: Missing Critical** — `ProjectCard.onSelect` was in the interface but never called, making the detail panel unreachable. Added an `onClick` handler to the card and `e.stopPropagation()` on the Archive button. `ProjectCard.project` type updated from `Project` to `ProjectWithDsn` accordingly.

## Difficulties
None.
