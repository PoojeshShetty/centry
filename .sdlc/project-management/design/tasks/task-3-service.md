# Task 3: Create ProjectService with business logic

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/backend/src/services/project.ts` — create
- `packages/backend/src/services/index.ts` — modify (export ProjectService and error classes)
- `packages/backend/src/tests/services/project.test.ts` — create

## Design References
- design.md §Architecture (ProjectService)
- design.md §Interface Contracts (Internal Interfaces — ProjectService methods)
- design.md §Design Decisions (DSN construction, Key minting, Ownership check pattern)

## Contracts (task-specific)

### Internal Interfaces
- `ProjectNotFoundError extends Error`: thrown when project does not exist (→ 404)
- `ProjectForbiddenError extends Error`: thrown when caller does not own the project (→ 403)

- `ProjectService.list(accountId) -> Promise<ProjectWithDsn[]>`
- `ProjectService.create(accountId, input: CreateProjectInput) -> Promise<ProjectWithDsn>`
  - Validates with Zod schema: name (string min 1), application_url (string url), description (optional string), environment (string min 1)
  - Mints public_key via `crypto.randomBytes(32).toString('hex')`
  - Constructs DSN: `https://${publicKey}@${CENTRY_HOST}/${projectId}` where CENTRY_HOST defaults to 'localhost:3000'
- `ProjectService.update(accountId, id, patch: UpdateProjectPatch) -> Promise<ProjectWithDsn>`
  - Loads project, checks ownership, updates
- `ProjectService.archive(accountId, id) -> Promise<void>`
  - Loads project, checks ownership, calls ProjectRepository.archive
- `ProjectService.rotateKey(accountId, id) -> Promise<{ dsn: string }>`
  - Loads project, checks ownership, calls ProjectKeyRepository.replaceKey with new minted key

```typescript
export interface ProjectWithDsn {
  id: string
  account_id: string
  name: string
  application_url: string
  description: string | null
  environment: string
  archived_at: Date | null
  created_at: Date
  dsn: string
}
```

## Acceptance Criteria

### FR-01: List projects
- GIVEN `ProjectService.list('account-id')`
- THEN it SHALL call `ProjectRepository.findAllActive('account-id')` and attach a DSN to each project

### FR-02: Create project
- GIVEN valid input and `ProjectService.create('account-id', input)`
- THEN it SHALL persist a project, create a key, and return the project with a correctly formatted DSN
- GIVEN input missing `name`
- THEN it SHALL throw a `ZodError`

### FR-03: Update — cross-account
- GIVEN `ProjectService.update('account-A', 'project-owned-by-B', patch)`
- THEN it SHALL throw `ProjectForbiddenError`

### FR-04: Archive — not found
- GIVEN `ProjectService.archive('account-id', 'nonexistent-id')`
- THEN it SHALL throw `ProjectNotFoundError`

### FR-05: Rotate key
- GIVEN `ProjectService.rotateKey('account-id', 'project-id')`
- THEN it SHALL call `ProjectKeyRepository.replaceKey` and return a new DSN with the new public_key

## Done Criteria
- [ ] `ProjectService` exported from `packages/backend/src/services/index.ts`
- [ ] `ProjectNotFoundError` and `ProjectForbiddenError` exported from services
- [ ] DSN format is `https://<publicKey>@<CENTRY_HOST>/<projectId>`
- [ ] Zod validation on create and update input
- [ ] Ownership check on all mutating operations (update, archive, rotateKey)
- [ ] Service unit tests pass with mocked repositories
- [ ] `pnpm --filter @centry/backend test` passes
