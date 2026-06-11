# Task 1: Create Project and ProjectKey Sequelize models + SQL migrations

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/backend/src/models/project.ts` — create
- `packages/backend/src/models/projectKey.ts` — create
- `packages/backend/src/models/index.ts` — modify (export new models)
- `packages/backend/db/migrations/002_create_projects.sql` — create
- `packages/backend/db/migrations/003_create_project_keys.sql` — create
- `packages/backend/src/tests/models/project.test.ts` — create
- `packages/backend/src/tests/models/projectKey.test.ts` — create

## Design References
- design.md §Data Models (Project, ProjectKey)
- design.md §Design Decisions (Key minting)

## Contracts (task-specific)

### Internal Interfaces
- `Project` Sequelize model with fields: id, account_id, name, application_url, description, environment, archived_at, created_at
- `ProjectKey` Sequelize model with fields: id, project_id, public_key, created_at

## Acceptance Criteria

### FR-02: Create project
- GIVEN a `Project.create()` call with valid fields
- WHEN it persists to the database
- THEN the returned instance SHALL have id, account_id, name, application_url, environment, created_at
- AND description SHALL be nullable

### FR-04: Archive project
- GIVEN a `Project` instance
- WHEN `archived_at` is set
- THEN the field SHALL persist as a datetime (not rejected by the model)

### FR-02: Project key creation
- GIVEN a `ProjectKey.create()` call with a project_id and public_key
- WHEN it persists
- THEN the returned instance SHALL have id, project_id, public_key, created_at

## Done Criteria
- [ ] `Project` model exported from `packages/backend/src/models/index.ts`
- [ ] `ProjectKey` model exported from `packages/backend/src/models/index.ts`
- [ ] `002_create_projects.sql` creates `projects` table with all columns and FK to `accounts`
- [ ] `003_create_project_keys.sql` creates `project_keys` table with FK to `projects` and unique constraint on `public_key`
- [ ] Both migrations are reversible (drop statements in comments or separate down migration)
- [ ] Model unit tests pass (`pnpm --filter @centry/backend test`)
