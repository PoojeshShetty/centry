# Task 1: Install dependencies and configure Sequelize singleton

## Trace
- **FR-IDs:** FR-03
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/backend/package.json` — modify
- `packages/backend/src/config/sequelize.ts` — create
- `packages/backend/src/tests/config/sequelize.test.ts` — create

## Design References
- design.md §Architecture (src/config/sequelize.ts component)
- design.md §Interface Contracts (sequelize singleton)
- design.md §Design Decisions (Sequelize instance placement: config/ vs models/)
- design.md §Design Decisions (ESM compatibility)

## Contracts (task-specific)

### Internal Interfaces
- `sequelize` (default export from `src/config/sequelize.ts`): configured `Sequelize` instance
  - Pre: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` present in `process.env`
  - Post: instance is ready to call `.authenticate()` and register models; no connection is opened at import time

## Acceptance Criteria

### FR-03: Sequelize configured from environment variables
- GIVEN `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are set
- WHEN `src/config/sequelize.ts` is imported
- THEN the exported `sequelize` instance SHALL use those values (dialect: postgres)

## Done Criteria
- [ ] `express`, `sequelize`, `pg`, `pg-hstore` added to `dependencies` in `package.json`
- [ ] `@types/express`, `@types/pg`, `@types/node` added to `devDependencies`
- [ ] `src/config/sequelize.ts` exports a `Sequelize` singleton configured from env vars
- [ ] `src/config/sequelize.ts` has no implicit `any` (`tsc --build` passes)
- [ ] Test verifies the singleton reads correct dialect and database name from env
