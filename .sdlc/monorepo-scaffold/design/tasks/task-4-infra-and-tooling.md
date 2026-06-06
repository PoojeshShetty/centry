# Task 4: Add infra and tooling config (docker-compose, .env.example, eslint, prettier)

## Trace
- **FR-IDs:** FR-06, FR-07, FR-02
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `docker-compose.yml` — create
- `.env.example` — create
- `eslint.config.js` — create
- `.prettierrc` — create

## Design References
- design.md §Architecture (docker-compose.yml, .env.example, eslint.config.js, .prettierrc components)
- design.md §Design Decisions (ESLint config format, Linting and formatting toolchain)

## Contracts (task-specific)

### Internal Interfaces
- `docker-compose.yml`:
  - `postgres` service: image `postgres:16-alpine`, port `5432:5432`, named volume `postgres_data`, health check via `pg_isready`
  - `redis` service: image `redis:7-alpine`, port `6379:6379`, named volume `redis_data`, health check via `redis-cli ping`
  - Both services declare `restart: unless-stopped`
- `.env.example` documents: `DB_URL`, `REDIS_URL`, `ADMIN_TOKEN`, `PORT` — each with a safe example value
- `eslint.config.js`: ESLint v9 flat config; targets `packages/**/src/**/*.ts`; uses `@typescript-eslint/recommended` rules
- `.prettierrc`: standard config — `singleQuote: true`, `semi: true`, `trailingComma: "all"`, `printWidth: 100`

## Acceptance Criteria

### FR-06: Docker Compose services
- GIVEN `docker-compose.yml` with `postgres` and `redis` service definitions
- WHEN `docker compose up -d` is run
- THEN postgres is accessible on port `5432`
- AND redis is accessible on port `6379`
- AND both services report healthy status

### FR-07: Environment variable documentation
- GIVEN `.env.example` at repo root
- WHEN read
- THEN `DB_URL`, `REDIS_URL`, `ADMIN_TOKEN`, and `PORT` are all present with example values

## Done Criteria
- [ ] `docker-compose.yml` exists with `postgres` (port 5432, health check) and `redis` (port 6379, health check) services
- [ ] Both services have named volumes defined in the top-level `volumes` key
- [ ] `.env.example` exists and contains all 4 variables: `DB_URL`, `REDIS_URL`, `ADMIN_TOKEN`, `PORT`
- [ ] `eslint.config.js` exists as ESLint v9 flat config (no `.eslintrc` files)
- [ ] `.prettierrc` exists with at minimum `singleQuote`, `semi`, `trailingComma`, `printWidth` set
- [ ] `pnpm run lint` runs without config errors (zero source files to lint is acceptable at this stage)
- [ ] ESLint + Prettier devDependencies added via `pnpm add -w -D` (no hand-written versions)
