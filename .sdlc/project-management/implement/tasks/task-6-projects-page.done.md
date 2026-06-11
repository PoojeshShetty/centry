# Task 6 Completion: Build ProjectsPage, ProjectCard grid, and CreateProjectModal

## Summary
Created ProjectsPage (card grid + empty state + Modal.confirm archive flow), ProjectCard (name/url/env badge/date/Archive button), and CreateProjectModal (antd Form with name/url/env/description fields). Wired `/projects` route into `routes.tsx` behind `ProtectedRoute` and added a Projects link to `HomePage`.

## Commits
- `eb94cc5` test(project-management): add failing tests for ProjectsPage (FR-08, FR-10)
- `4ba6bac` feat(project-management): implement ProjectsPage, ProjectCard, CreateProjectModal and wire routes (FR-08, FR-10)

## Deviations
- **Rule 1: Bug** — linter auto-changed `destroyOnClose` → `destroyOnHidden` on `CreateProjectModal`'s antd Modal (deprecated prop in antd v6)

## Difficulties
None

## Notes
`onSelect` prop on ProjectCard is wired as a no-op in ProjectsPage; task-7 (ProjectDetailPanel) will implement the full DSN reveal/copy flow. The `Modal.confirm` spy pattern (`jest.spyOn(Modal, 'confirm').mockImplementation(...)`) works because antd is CJS-transformed in Jest, giving both the component and test the same module instance.
