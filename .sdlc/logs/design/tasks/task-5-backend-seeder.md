# Task 5: Backend — Logs seeder

## Trace
- **FR-IDs:** FR-11
- **Depends on:** task-2, task-4
- **Design:** ../design.md

## Files
- `packages/backend/src/seeders/seed-logs.ts` — create

## Design References
- design.md §Architecture (seed-logs.ts seeder script)
- design.md §Data Models (Log Sequelize model)

## Acceptance Criteria

### FR-11: Seeder
- GIVEN a project exists in the database
- WHEN the seeder is run
- THEN at least 50 log records SHALL exist spanning all 6 severity levels (trace, debug, info, warn, error, fatal)
- AND records SHALL have varied timestamps spread across the last 7 days
- AND records SHALL have varied bodies and attribute payloads
- AND running the seeder again SHALL NOT increase the count (idempotent)

## Done Criteria
- [ ] Seeder script connects to the database using the same `sequelize` config
- [ ] Seeder finds the first project in the database; exits with a message if none exists
- [ ] Idempotency guard: script checks for existing seeded logs (e.g. by count or a sentinel attribute) and skips if already seeded
- [ ] Generates at least 50 records spread across all 6 levels: trace, debug, info, warn, error, fatal
- [ ] Timestamps are spread across the last 7 days (varied, not identical)
- [ ] Each record has a varied `body` string and a non-empty `attributes` object
- [ ] All records are inserted via `LogRepository.bulkCreate` (or `Log.bulkCreate` directly)
- [ ] Script can be run with `tsx packages/backend/src/seeders/seed-logs.ts`
