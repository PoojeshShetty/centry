# Task 2: Backend — Log Sequelize model and migration

## Trace
- **FR-IDs:** FR-03, FR-04
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/backend/src/models/log.ts` — create
- `packages/backend/src/models/index.ts` — modify
- `packages/backend/migrations/<timestamp>-create-logs.js` — create
- `packages/backend/src/tests/models/log.test.ts` — create

## Design References
- design.md §Data Models (Log Sequelize model — `logs` table schema)
- design.md §Architecture (Log component)

## Contracts (task-specific)

### Internal Interfaces
- `Log` (Sequelize model class) with fields: `id`, `project_id`, `timestamp`, `level`, `severity_number`, `body`, `trace_id`, `span_id`, `attributes`, `received_at`
  - Pre: `project_id` references a valid project UUID
  - Post: record persisted with `received_at` defaulting to `now()`

## Acceptance Criteria

### FR-03 / FR-04: Log model and migration
- GIVEN the migration runs against a fresh database
- WHEN `db.Log.create({ project_id, timestamp, level, severity_number, body })` is called
- THEN the record is persisted and retrievable
- AND querying by `project_id` with `ORDER BY timestamp DESC` uses the composite index

## Done Criteria
- [ ] `packages/backend/src/models/log.ts` defines `Log` class with all 10 fields and correct DataTypes (`UUID`, `FLOAT`, `STRING`, `INTEGER`, `TEXT`, `JSONB`, `DATE`)
- [ ] `tableName: 'logs'` and `timestamps: false` set on model options
- [ ] `Log` exported from `packages/backend/src/models/index.ts`
- [ ] Migration file creates `logs` table with all columns and NOT NULL constraints
- [ ] Migration adds composite index on `(project_id, timestamp DESC)`
- [ ] Migration adds index on `(project_id, level)`
- [ ] Migration adds GIN index on `to_tsvector('english', body)` for full-text search
- [ ] Migration is reversible (down drops the `logs` table)
- [ ] `log.test.ts` verifies model can create and retrieve a record
