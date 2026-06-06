# Task 1 Completion: Install dependencies and configure Sequelize singleton

## Summary
Added `express`, `sequelize`, `pg`, `pg-hstore` prod deps and `vitest`, `@types/*` dev deps to `packages/backend`. Created `src/config/sequelize.ts` exporting a typed Sequelize singleton configured from env vars. Two TDD commits (test RED → feat GREEN).

## Commits
- `432dab1` test(backend-foundation): install deps and add failing Sequelize config test (FR-03)
- `f2d9854` feat(backend-foundation): implement Sequelize config singleton (FR-03)

## Deviations
- **Rule 3: Blocking** — pnpm 11.5.2 moved `onlyBuiltDependencies` out of `package.json`; esbuild (vitest dependency) had blocked build scripts. Fixed by setting `allowBuilds: esbuild: true` in `pnpm-workspace.yaml` (the stub was already present with a placeholder value).

## Difficulties
- `npm install` run instead of `pnpm install` initially — caught from lockfile (`pnpm-lock.yaml`) and corrected.
- esbuild build scripts blocked by pnpm 11 default security policy — resolved via `pnpm-workspace.yaml` `allowBuilds` field.

## Notes
- `sequelize.config.database` access requires a type assertion (`as unknown as { config: { database: string } }`) in tests since Sequelize does not expose `config` in its public TypeScript types. This is a Sequelize v6 limitation, not a project issue.
