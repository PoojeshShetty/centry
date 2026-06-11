# Task 5: Create useProjectStore and frontend API client methods

## Trace
- **FR-IDs:** FR-08, FR-09, FR-10
- **Depends on:** task-4
- **Design:** ../design.md

## Files
- `packages/frontend/src/store/useProjectStore.ts` — create
- `packages/frontend/src/store/__tests__/useProjectStore.test.ts` — create
- `packages/frontend/src/utils/apiClient.ts` — modify (add project API methods)
- `packages/frontend/src/utils/__tests__/apiClient.test.ts` — update (interface change)

## Design References
- design.md §Architecture (useProjectStore)
- design.md §Interface Contracts (API Endpoints)

## Contracts (task-specific)

### Internal Interfaces

```typescript
// Project type as returned by the backend (no public_key in list)
export interface Project {
  id: string
  name: string
  application_url: string
  description: string | null
  environment: string
  created_at: string
}

// Extended with DSN for detail panel
export interface ProjectWithDsn extends Project {
  dsn: string
}

export interface ProjectState {
  projects: Project[]
  selectedProject: ProjectWithDsn | null
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<void>
  updateProject: (id: string, patch: UpdateProjectPatch) => Promise<void>
  archiveProject: (id: string) => Promise<void>
  rotateKey: (id: string) => Promise<void>
  selectProject: (project: ProjectWithDsn | null) => void
}
```

API client additions to `apiClient`:
- `projectApi.list() -> Promise<Project[]>`
- `projectApi.create(input) -> Promise<ProjectWithDsn>`
- `projectApi.update(id, patch) -> Promise<ProjectWithDsn>`
- `projectApi.archive(id) -> Promise<void>`
- `projectApi.rotateKey(id) -> Promise<{ dsn: string }>`

## Acceptance Criteria

### FR-08: Project card grid
- GIVEN `useProjectStore.fetchProjects()` is called
- WHEN the API call resolves
- THEN `projects` in the store SHALL be updated with the fetched array

### FR-10: Archive
- GIVEN `useProjectStore.archiveProject('id')` is called
- WHEN the API call succeeds
- THEN the project SHALL be removed from the `projects` array in the store

### FR-09: Rotate key
- GIVEN `useProjectStore.rotateKey('id')` is called
- WHEN the API call succeeds with `{ dsn: 'new-dsn' }`
- THEN `selectedProject.dsn` SHALL be updated in the store

## Done Criteria
- [ ] `useProjectStore` exported from `packages/frontend/src/store/useProjectStore.ts`
- [ ] All project API methods added to `apiClient`
- [ ] `Project` and `ProjectWithDsn` types exported
- [ ] Store tests cover fetchProjects, archiveProject (removes from array), rotateKey (updates dsn)
- [ ] `pnpm --filter @centry/frontend test` passes
