# Task 5 Completion: Backend — Logs seeder

## Summary
Created `packages/backend/src/seeders/seed-logs.ts` which connects to Postgres via the existing sequelize config, finds the first project, checks idempotency via a count of `attributes.seeded = true` logs, and inserts 60 records (10 per level across trace/debug/info/warn/error/fatal) with varied bodies, timestamps spread over the last 7 days, and varied attribute payloads. Run with `tsx packages/backend/src/seeders/seed-logs.ts`.

## Commits
- `de28322` feat(logs): add seed-logs.ts seeder with 60 records across all 6 severity levels (FR-11)

## Deviations
- **Rule 1: Bug** — `packages/shared/dist/index.d.ts` was stale (had old `LogItem` shape with `severity`/`message` fields). Rebuilt shared package (`pnpm --filter @centry/shared build`) to regenerate `.d.ts` before type-checking the seeder. Pre-existing errors in `requireProjectOwner.ts`, `routes/project.ts`, and test files remain but are unrelated to this task.

## Difficulties
- None

## Notes
- Idempotency uses `Log.count` with `{ attributes: { seeded: true } }` — relies on Sequelize JSONB containment query. Sentinel attribute `seeded: true` is present on every generated record.
