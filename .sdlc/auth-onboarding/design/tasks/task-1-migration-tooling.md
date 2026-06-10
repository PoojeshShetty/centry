# Task 1: Set up sequelize-cli migration tooling and add auth columns

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-08
- **Depends on:** none
- **Design:** ../design.md

## Files
- `.sequelizerc` — create
- `packages/backend/config/database.cjs` — create
- `packages/backend/migrations/001-add-auth-columns.cjs` — create
- `packages/backend/package.json` — modify (add `sequelize-cli` devDependency, add `migrate` script)

## Design References
- design.md §Data Models (Account — email + password_hash columns, unique index on email)
- design.md §Design Decisions (Email case-insensitivity: normalize in application)
- design.md §Architecture (Migration tooling — sequelize-cli, `.cjs` files, env-driven config)

## Contracts (task-specific)

### Migration — up
- Adds `email VARCHAR NOT NULL` with a unique index to `accounts`
- Adds `password_hash VARCHAR NOT NULL` to `accounts`

### Migration — down
- Drops `password_hash` column
- Drops unique index on `email`
- Drops `email` column

### `packages/backend/package.json` additions
- devDependency: `sequelize-cli`
- Script: `"migrate": "sequelize-cli db:migrate"` (reads config from `.sequelizerc`)

## Acceptance Criteria

### FR-01 / FR-08: Schema prerequisites
- GIVEN the migration has been run (`pnpm migrate`)
- WHEN the `accounts` table is inspected
- THEN it SHALL have an `email` column (VARCHAR, NOT NULL, unique) and a `password_hash` column (VARCHAR, NOT NULL)
- AND a rollback (`db:migrate:undo`) SHALL restore the table to its original shape (only `id`, `name`, `created_at`)

## Done Criteria
- [ ] `.sequelizerc` exists at repo root pointing `migrations-path` to `packages/backend/migrations` and `config` to `packages/backend/config/database.cjs`
- [ ] `packages/backend/config/database.cjs` reads `DB_URL` (or `DB_*` individual vars) from env — same vars used by `src/config/sequelize.ts`
- [ ] `packages/backend/migrations/001-add-auth-columns.cjs` implements `up` (add `email` + `password_hash` + unique index) and `down` (reverse)
- [ ] `pnpm --filter @centry/backend migrate` runs without error against a local Postgres instance
- [ ] Migration is reversible: `sequelize-cli db:migrate:undo` drops the added columns cleanly
