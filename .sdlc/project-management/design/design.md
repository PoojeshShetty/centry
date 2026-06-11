# Design: project-management

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10
- **Requirements:** ../requirements.md

## Architecture

### Components
- `Project` model: Sequelize model for the `projects` table — new
- `ProjectKey` model: Sequelize model for the `project_keys` table — new
- `ProjectRepository`: thin Sequelize wrapper for `projects` table — new
- `ProjectKeyRepository`: thin Sequelize wrapper for `project_keys` table — new
- `ProjectService`: business logic (ownership checks, key minting, DSN construction, soft-delete) — new
- `projectRouter`: Express router mounted at `/api/projects` — new
- `useProjectStore`: Zustand store for frontend project state — new
- `ProjectsPage`: route page component, renders card grid or empty state — new
- `ProjectCard`: card component showing name, URL, environment badge, created date — new
- `CreateProjectModal`: modal form for project creation — new
- `ProjectDetailPanel`: slide-in/drawer panel showing DSN with reveal/copy + rotate control — new

### Data Flow

**List:**
`GET /api/projects` → `requireAuth` → `ProjectService.list(accountId)` → `ProjectRepository.findAllActive(accountId)` → `[Project]`

**Create:**
`POST /api/projects` → `requireAuth` → `ProjectService.create(accountId, input)` → `ProjectRepository.create(input)` + `ProjectKeyRepository.create(projectId)` → `ProjectWithDsn`

**Archive:**
`DELETE /api/projects/:id` → `requireAuth` → `ProjectService.archive(accountId, id)` → ownership check → `ProjectRepository.archive(id)`

**Rotate key:**
`POST /api/projects/:id/rotate-key` → `requireAuth` → `ProjectService.rotateKey(accountId, id)` → ownership check → `ProjectKeyRepository.replaceKey(projectId)` → `{ dsn }`

**Ingest guard (FR-07):**
Future ingest middleware reads `projects.archived_at` before accepting envelopes; returns 403 if set.

## Data Models

### Project
- `id (uuid)`: primary key, auto-generated
- `account_id (uuid, FK → accounts.id)`: owning account
- `name (string)`: project display name, NOT NULL
- `application_url (string)`: URL of the application, NOT NULL
- `description (text)`: optional freeform description, nullable
- `environment (string)`: e.g. 'production', 'staging', 'development', NOT NULL
- `archived_at (datetime)`: null = active; set = archived (soft delete)
- `created_at (datetime)`: auto-set on creation

### ProjectKey
- `id (uuid)`: primary key, auto-generated
- `project_id (uuid, FK → projects.id)`: owning project
- `public_key (string, unique)`: ingest credential; 32 random hex bytes, NOT NULL
- `created_at (datetime)`: auto-set on creation

### Migrations
Two numbered SQL files (run on boot by the existing migration runner):
- `CREATE TABLE projects` — with FK constraint to accounts
- `CREATE TABLE project_keys` — with FK constraint to projects

Rollback: `DROP TABLE project_keys; DROP TABLE projects;`

## Interface Contracts

### API Endpoints (shared)

- GET /api/projects: list non-archived projects for the authenticated account
  - Input: none (account from JWT)
  - Output: 200 `[{ id, name, application_url, description, environment, created_at }]`
  - Errors: 401 unauthorized

- POST /api/projects: create a new project
  - Input: `{ name: string, application_url: string, description?: string, environment: string }`
  - Output: 201 `{ id, name, application_url, description, environment, created_at, dsn }`
  - Errors: 400 validation error, 401 unauthorized

- PATCH /api/projects/:id: update project fields
  - Input: `{ name?, application_url?, description?, environment? }` (at least one required)
  - Output: 200 `{ id, name, application_url, description, environment, created_at, dsn }`
  - Errors: 400 validation, 401 unauthorized, 403 not owner, 404 not found

- DELETE /api/projects/:id: soft-delete (archive) a project
  - Input: none
  - Output: 204 no content
  - Errors: 401 unauthorized, 403 not owner, 404 not found

- POST /api/projects/:id/rotate-key: regenerate public_key
  - Input: none
  - Output: 200 `{ dsn: string }`
  - Errors: 401 unauthorized, 403 not owner, 404 not found

### Internal Interfaces (shared)

- `ProjectService.list(accountId: string) -> ProjectWithDsn[]`: returns active projects with DSN
  - Pre: accountId is a valid JWT sub
  - Post: only non-archived rows returned; dsn constructed for each

- `ProjectService.create(accountId: string, input: CreateProjectInput) -> ProjectWithDsn`: validates, persists, mints key
  - Pre: input passes Zod schema
  - Post: project row + project_keys row created; dsn returned

- `ProjectService.update(accountId: string, id: string, patch: UpdateProjectPatch) -> ProjectWithDsn`: validates ownership, updates
  - Pre: project exists, caller owns it
  - Post: only provided fields changed

- `ProjectService.archive(accountId: string, id: string) -> void`: sets archived_at
  - Pre: project exists, caller owns it
  - Post: archived_at = now(); project excluded from future list calls

- `ProjectService.rotateKey(accountId: string, id: string) -> { dsn: string }`: replaces public_key
  - Pre: project exists, caller owns it
  - Post: old project_keys row deleted; new row inserted; new DSN returned

- `ProjectKeyRepository.replaceKey(projectId: string) -> ProjectKey`: deletes old key, mints new one atomically
  - Pre: project exists
  - Post: exactly one key row for the project; old key no longer valid for ingest

## Design Decisions

### DSN construction
- **Chosen:** `https://${publicKey}@${CENTRY_HOST}/${projectId}` where `CENTRY_HOST` is an env var defaulting to `localhost:3000`
- **Rationale:** portable across environments; no hardcoded host
- **Rejected:** hardcoded `localhost:3000` — breaks in any non-dev environment

### Key minting
- **Chosen:** `crypto.randomBytes(32).toString('hex')` — 64-char hex string
- **Rationale:** built-in Node crypto, no extra dependency, sufficient entropy for an ingest key
- **Rejected:** UUID — lower entropy, semantically wrong for a credential

### Ownership check pattern
- **Chosen:** `ProjectRepository.findById(id)` then check `project.account_id === accountId`; throw `ProjectNotFoundError` for null, `ProjectForbiddenError` for mismatch
- **Rationale:** consistent error shape; service layer controls the 403 vs 404 boundary so route handlers stay thin
- **Rejected:** pass `accountId` as a WHERE clause — would silently return 404 for both not-found and forbidden, losing the 403 distinction

### Key rotation atomicity
- **Chosen:** delete old `project_keys` row then insert new one in a single Sequelize transaction
- **Rationale:** no window where the project has zero keys or two active keys
- **Rejected:** update in-place — `public_key` is indexed unique; insert-before-delete risks constraint violation
