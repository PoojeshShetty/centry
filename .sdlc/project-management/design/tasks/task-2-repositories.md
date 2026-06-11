# Task 2: Create ProjectRepository and ProjectKeyRepository

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/backend/src/repositories/project.ts` — create
- `packages/backend/src/repositories/projectKey.ts` — create
- `packages/backend/src/repositories/index.ts` — modify (export new repositories)
- `packages/backend/src/tests/repositories/project.test.ts` — create
- `packages/backend/src/tests/repositories/projectKey.test.ts` — create

## Design References
- design.md §Architecture (ProjectRepository, ProjectKeyRepository)
- design.md §Interface Contracts (Internal Interfaces — repository methods)
- design.md §Design Decisions (Key rotation atomicity)

## Contracts (task-specific)

### Internal Interfaces
- `ProjectRepository.findAllActive(accountId: string) -> Promise<Project[]>`: WHERE account_id = accountId AND archived_at IS NULL
- `ProjectRepository.findById(id: string) -> Promise<Project | null>`: find by PK (no account filter — service layer checks ownership)
- `ProjectRepository.create(input: CreateProjectInput) -> Promise<Project>`: insert row
- `ProjectRepository.update(id: string, patch: Partial<UpdateableFields>) -> Promise<Project>`: update and return updated instance
- `ProjectRepository.archive(id: string) -> Promise<void>`: SET archived_at = NOW()

- `ProjectKeyRepository.findActiveByProjectId(projectId: string) -> Promise<ProjectKey | null>`: most recent key for project
- `ProjectKeyRepository.create(projectId: string, publicKey: string) -> Promise<ProjectKey>`: insert new key row
- `ProjectKeyRepository.replaceKey(projectId: string, newPublicKey: string) -> Promise<ProjectKey>`: transaction — delete existing key(s) for project, insert new key, return new key

## Acceptance Criteria

### FR-01: List projects
- GIVEN `ProjectRepository.findAllActive('account-id')`
- WHEN there are 2 active and 1 archived project for that account
- THEN it SHALL return only the 2 active projects

### FR-04: Archive
- GIVEN `ProjectRepository.archive('project-id')`
- WHEN called
- THEN the project row SHALL have `archived_at` set to a non-null datetime

### FR-05: Rotate key
- GIVEN `ProjectKeyRepository.replaceKey('project-id', 'new-key')`
- WHEN called with an existing key present
- THEN the old key row SHALL be deleted and the new key row SHALL exist
- AND only one key row SHALL exist for the project after the call

## Done Criteria
- [ ] `ProjectRepository` exported from `packages/backend/src/repositories/index.ts`
- [ ] `ProjectKeyRepository` exported from `packages/backend/src/repositories/index.ts`
- [ ] `replaceKey` runs in a Sequelize transaction (delete + insert atomic)
- [ ] Repository unit tests pass (mocking Sequelize model methods with `vi.mock`)
- [ ] `pnpm --filter @centry/backend test` passes
