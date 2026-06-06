# Requirements: Backend Foundation

## 1. Project

- Path: `.`

---

## 2. Purpose

Establish a layered Express backend (routes → service → repository → models) inside `packages/backend`, with Sequelize configured and the Account model defined — providing a consistent foundation for all subsequent M1 backend features.

---

## 3. User Stories

- As a developer, I want a runnable Express app entry point, so I can start the backend server locally.
- As a developer, I want a `routes/` `services/` `repositories/` `models/` folder structure, so each layer has a clear home.
- As a developer, I want a Sequelize-connected Account model, so I can persist and query accounts in Postgres.

---

## 4. Functional Requirements

- FR-01: Backend SHALL have an Express entry point (`src/index.ts`) that initializes middleware and starts listening on a configurable `PORT` environment variable.
- FR-02: `src/` SHALL contain `routes/`, `services/`, `repositories/`, and `models/` directories (stub files acceptable at this milestone).
- FR-03: Sequelize SHALL be configured using environment variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- FR-04: An `Account` model SHALL be defined with: `id` (UUID, primary key, auto-generated), `name` (TEXT, NOT NULL), `created_at` (TIMESTAMPTZ, auto-managed).
- FR-05: The app SHALL verify database connectivity on startup and SHALL NOT start if the connection fails.
- FR-06: The app SHALL NOT expose any HTTP routes at this milestone (route wiring is deferred).
- FR-07: All Sequelize models SHALL be typed with TypeScript (no implicit `any`).

---

## 5. Acceptance Criteria

### FR-01: Express entry point

**Happy path:**
- GIVEN `PORT=3001`
- WHEN the server starts
- THEN it SHALL listen on `:3001`

### FR-03 + FR-05: Sequelize connectivity

**Happy path:**
- GIVEN valid `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- WHEN the app starts
- THEN Sequelize SHALL authenticate successfully and log a confirmation

**Failure path:**
- GIVEN an invalid `DB_HOST`
- WHEN the app starts
- THEN the process SHALL exit with a non-zero exit code

### FR-04: Account model

**Happy path:**
- GIVEN Sequelize is connected and the `accounts` table exists
- WHEN `Account.create({ name: 'Acme' })` is called
- THEN a row SHALL exist in `accounts` with an auto-generated UUID and `created_at` timestamp

### FR-06: No routes exposed

**Boundary:**
- GIVEN the server is running
- WHEN any HTTP route is requested
- THEN the server SHALL return 404

### FR-07: TypeScript cleanliness

**Static check:**
- GIVEN `tsc --build` is run
- THEN zero type errors SHALL be reported

---

## 6. Constraints

### In Scope
- Express app entry point (`src/index.ts`) with middleware init and port binding
- Layered directory structure: `src/routes/`, `src/services/`, `src/repositories/`, `src/models/`
- Sequelize instance configured from environment variables
- `Account` Sequelize model (id, name, created_at)
- DB connectivity check on startup

### Out of Scope
- `Project`, `ProjectKey`, and `Log` models — deferred to subsequent milestones
- HTTP route handlers for any endpoint — deferred to subsequent milestones
- Auth middleware (ingest key / read token / admin) — deferred
- Redis integration — deferred
- `seed.ts` — deferred

### Prohibitions
- SHALL NOT expose any HTTP routes at this milestone
- SHALL NOT use the raw `pg` driver for model definitions (Sequelize only)
- SHALL NOT store secrets or credentials in source code (environment variables only)
- SHALL NOT use `any` types in Sequelize model definitions

### Testing Approach
- Selective TDD — TDD for Account model (create/validate) and Sequelize config module; test-after for Express app wiring

### Branch
- Base branch: `dev`
- Feature branch: `feature/backend-foundation`
