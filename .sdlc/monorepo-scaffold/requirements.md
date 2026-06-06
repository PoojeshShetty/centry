# Requirements: Monorepo Scaffold

## 1. Project

- Path: `C:\Users\sande\projects\centry`

---

## 2. Purpose

Bootstrap a production-ready pnpm monorepo for centry that co-locates the SDK, backend, and frontend packages under shared TypeScript config and tooling, so all three can be developed, typed, and tested in a single repository without duplication.

---

## 3. User Stories

- As a developer, I want a single repo with pnpm workspaces so I can install all dependencies and run scripts across packages with one command.
- As a developer, I want shared TypeScript types in `packages/shared` so SDK, backend, and frontend never drift on wire format.
- As a developer, I want a docker-compose file so I can spin up Postgres + Redis locally with one command.
- As a developer, I want each package pre-wired with its own tsconfig and build script so I can start implementing without fighting tooling setup.

---

## 4. Functional Requirements

- FR-01: Repo root SHALL have `pnpm-workspace.yaml` listing `packages/*`.
- FR-02: Root `package.json` SHALL have workspace-level scripts: `dev`, `build`, `test`, `lint`.
- FR-03: `tsconfig.base.json` SHALL exist at root; each package SHALL extend it with TypeScript project references.
- FR-04: `packages/shared` SHALL export `LogItem`, `Attribute`, `SeverityLevel` enum, envelope header types, and `parseEnvelope` utility.
- FR-05: `packages/sdk`, `packages/backend`, and `packages/frontend` SHALL each have their own `package.json`, `tsconfig.json`, and a `src/index.ts` stub.
- FR-06: `docker-compose.yml` SHALL define `postgres` and `redis` services with named volumes and health checks.
- FR-07: `.env.example` at root SHALL document all required environment variables: `DB_URL`, `REDIS_URL`, `ADMIN_TOKEN`, `PORT`.
- FR-08: Scaffold SHALL NOT contain application logic — stubs only; no Express routes, no UI components, no SDK send logic.
- FR-09: All dependencies SHALL be installed via `pnpm add <package>` commands (latest versions by default); `package.json` dependency entries SHALL NOT be hand-written with pinned version strings.

---

## 5. Acceptance Criteria

### FR-01: pnpm workspace config

**Happy path:**
- GIVEN the repo root with `pnpm-workspace.yaml`
- WHEN `pnpm install` is run
- THEN all packages resolve without errors
- AND no missing dependency warnings are emitted

### FR-03: TypeScript project references

**Happy path:**
- GIVEN `tsconfig.base.json` at root and per-package `tsconfig.json` files extending it
- WHEN `pnpm run build` is run from root
- THEN `tsc --build` completes with zero type errors across all packages

**Failure path:**
- GIVEN a missing project reference in a package `tsconfig.json`
- WHEN `tsc --build` runs
- THEN a descriptive error identifying the missing reference SHALL be emitted

### FR-04: Shared types resolution

**Happy path:**
- GIVEN `packages/shared` exports `LogItem`, `parseEnvelope`, and `SeverityLevel`
- WHEN any of `packages/sdk`, `packages/backend`, or `packages/frontend` imports from `@centry/shared`
- THEN TypeScript resolves the types without errors
- AND no `any` types are introduced by the import

### FR-06: Docker Compose services

**Happy path:**
- GIVEN `docker-compose.yml` with `postgres` and `redis` service definitions
- WHEN `docker compose up -d` is run
- THEN postgres is accessible on port `5432`
- AND redis is accessible on port `6379`
- AND both services report healthy status

### FR-07: Environment variable documentation

**Happy path:**
- GIVEN `.env.example` at repo root
- WHEN read
- THEN `DB_URL`, `REDIS_URL`, `ADMIN_TOKEN`, and `PORT` are all present with example values

### FR-09: Dependency installation via pnpm add

**Happy path:**
- GIVEN a package requiring a new dependency
- WHEN `pnpm add <package> --filter <workspace>` is run
- THEN the dependency is added at its latest version
- AND `package.json` is updated automatically by pnpm

**Boundary case:**
- GIVEN the root `package.json`
- WHEN inspected after scaffold setup
- THEN no dependency version strings SHALL have been hand-authored (all entries written by pnpm)

---

## 6. Constraints

### In Scope
- `pnpm-workspace.yaml` and root `package.json` with workspace scripts
- `tsconfig.base.json` and per-package `tsconfig.json` with project references
- `packages/shared` with canonical types (`LogItem`, `Attribute`, `SeverityLevel`, envelope headers) and `parseEnvelope` utility
- `packages/sdk`, `packages/backend`, `packages/frontend` stubs (`src/index.ts` only)
- `docker-compose.yml` with postgres and redis services
- `.env.example` documenting required env vars
- Dependency installation via `pnpm add` (no hand-written versions)

### Out of Scope
- Express routes or middleware — deferred to M1 (backend)
- SDK send logic, buffer, transport — deferred to M2 (SDK)
- React components, Vite config, UI — deferred to M3 (frontend)
- Database migrations and seed scripts — deferred to M1
- Auth middleware — deferred to M1
- CI/CD configuration — not in MVP scope

### Prohibitions
- SHALL NOT hand-write dependency version strings in any `package.json`
- SHALL NOT add application logic to package stubs
- SHALL NOT couple packages at runtime in the scaffold (stubs only, no cross-package imports beyond shared types)

### Testing Approach
- No tests — scaffold is pure configuration and type definitions; tests belong in M1+ milestones
