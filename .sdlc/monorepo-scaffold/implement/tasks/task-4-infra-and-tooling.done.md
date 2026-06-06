# Task 4 Completion: Add infra and tooling config (docker-compose, .env.example, eslint, prettier)

## Summary
Added `docker-compose.yml` (postgres:16-alpine + redis:7-alpine with named volumes and health checks), `.env.example` (DB_URL, REDIS_URL, ADMIN_TOKEN, PORT), ESLint v9+ flat config (`eslint.config.js`) with typescript-eslint recommended rules, and `.prettierrc`. Tooling devDependencies installed via `pnpm add -w -D` (no hand-written versions).

## Commits
- `ae120de` chore(monorepo-scaffold): add infra and tooling config (FR-06, FR-07, FR-02)

## Deviations
- **Rule 3: Blocking** — `eslint.config.js` uses ESM `import` syntax; root `package.json` lacked `"type": "module"`, causing a MODULE_TYPELESS_PACKAGE_JSON warning and reparse. Added `"type": "module"` to root `package.json`.
- **Rule 1: Bug** — design's lint script `eslint packages/**/src` fails under ESLint flat config on Windows (exit 2, "No files matching the pattern"). Changed to `eslint .`; the flat config's `files: ['packages/**/src/**/*.ts']` key now scopes linting. `pnpm run lint` exits 0.

## Difficulties
- ESLint v10 / typescript-eslint v8 were installed (latest), newer than the v9 referenced in the design. Flat config is the default and fully compatible — no change needed.

## Notes
- Verified `pnpm run lint` (exit 0) and `pnpm run build` (exit 0) both pass after adding `type: module` to root.
- `docker compose up -d` was not run in this environment (no Docker); FR-06 runtime health verification deferred to `/verify`.
