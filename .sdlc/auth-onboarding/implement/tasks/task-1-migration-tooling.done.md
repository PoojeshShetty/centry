# Task 1 Completion: Set up sequelize-cli migration tooling and add auth columns

## Summary
Added sequelize-cli migration tooling (`.sequelizerc`, env-driven `config/database.cjs`, `migrate`
script) and migration `001-add-auth-columns.cjs` that adds `email` (NOT NULL + unique index) and
`password_hash` (NOT NULL) to the `accounts` table, with a reversible `down`.

## Commits
- `a668e2f` chore(auth-onboarding): set up sequelize-cli migration tooling and add auth columns (FR-01, FR-02, FR-03, FR-04, FR-08)

## Deviations
- **Rule 3: Blocking** — Task contract specified the migrate script as `"sequelize-cli db:migrate"`,
  but sequelize-cli only looks for `.sequelizerc` in `process.cwd()` (no upward walk; confirmed in
  `yargs.js`). `pnpm --filter @centry/backend migrate` sets cwd to `packages/backend`, so the
  repo-root `.sequelizerc` would not be found. Fixed by passing `--options-path ../../.sequelizerc`
  in the script and making the rc resolve its paths via `__dirname` (absolute) so they work
  regardless of cwd.
- **Rule 2: Missing Critical** — `database.cjs` supports both `DB_URL` (connection string) and the
  individual `DB_*` vars used by `src/config/sequelize.ts`, per the task's "DB_URL (or DB_* vars)"
  note. `up`/`down` wrapped in a transaction so a partial failure rolls back.

## Difficulties
- No `.env` file exists in the repo (only `.env.example`, which uses `DB_URL`). Verified the live
  migrate run by passing `DB_URL` inline against the docker-compose Postgres (centry/centry@5432).
- `pnpm-lock.yaml` was already modified before this task and pnpm rewrote it when adding
  sequelize-cli, so the dependency change could not be cleanly isolated from a pre-existing
  (js-cookie) change. Committed together with user approval.

## Notes
- Verified end-to-end: `migrate` → `email`/`password_hash` + `accounts_email_unique_idx` present;
  `db:migrate:undo` → table restored to `id`/`name`/`created_at`; re-applied so the DB is left in
  the migrated state for downstream tasks.
- The DB is currently **migrated** (columns present). Task 2 (Account model + repository) can build
  on this directly.
- Migration files are CommonJS `.cjs` and live outside `src/`, so they are not covered by
  `pnpm lint` (`packages/**/src/**/*.ts`) — intentional, matching the design.
