# Design: backend-foundation

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07
- **Requirements:** ../requirements.md

## Architecture

### Components
- `src/index.ts`: Express app entry point — initializes middleware, authenticates DB, starts HTTP listener — modified (currently a stub)
- `src/config/sequelize.ts`: Sequelize singleton configured from env vars — new
- `src/models/account.ts`: Account Sequelize model definition — new
- `src/models/index.ts`: barrel re-exporting all models — new
- `src/routes/index.ts`: stub router (no handlers at this milestone) — new
- `src/services/index.ts`: stub — new
- `src/repositories/index.ts`: stub — new

### Data Flow
`process.env` → `config/sequelize.ts` → `sequelize.authenticate()` → startup confirmed or process exits

`src/index.ts` → imports `config/sequelize.ts` → `authenticate()` → on failure: `process.exit(1)`

`src/index.ts` → `app.listen(PORT)` → HTTP server running (no routes wired)

## Data Models

- Account (`accounts` table):
  - `id` (UUID, PK, auto-generated via `DataTypes.UUIDV4`)
  - `name` (TEXT / STRING, NOT NULL)
  - `created_at` (TIMESTAMPTZ, auto-managed by Sequelize `timestamps: true`)
  - No `updated_at` — omitted via `updatedAt: false`

Migration note: this scaffold intentionally omits `email`, `password_hash`, and `user_type`. Those fields are deferred to a future milestone via Sequelize migrations.

## Interface Contracts

### Internal Interfaces (shared)
- `sequelize` (exported singleton from `config/sequelize.ts`): configured `Sequelize` instance
  - Pre: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all set in environment
  - Post: instance ready for `.authenticate()` and model association

- `Account` (exported from `models/account.ts`): Sequelize Model class
  - Pre: `sequelize` singleton initialized
  - Post: `Account.create({ name })` inserts row with auto UUID and `created_at`

## Design Decisions

### Sequelize instance placement: config/ vs models/
- **Chosen:** `src/config/sequelize.ts` exports a singleton
- **Rationale:** Config is independently importable and testable without loading any model. Models import the singleton rather than creating their own connection.
- **Rejected:** Inline in `models/index.ts` — couples connection lifecycle to model registration, harder to unit-test config in isolation

### DB connectivity: authenticate-then-listen vs optimistic start
- **Chosen:** `await sequelize.authenticate()` before `app.listen()`; exit with code 1 on failure
- **Rationale:** FR-05 explicitly requires the app SHALL NOT start if the connection fails. Failing fast surfaces misconfiguration immediately.
- **Rejected:** Start HTTP server regardless and let queries fail at runtime — violates FR-05, harder to diagnose in production

### TypeScript model definition: class-based vs `Model.init`
- **Chosen:** Class extending `Model<InferAttributes<T>, InferCreationAttributes<T>>` with typed attribute interfaces
- **Rationale:** FR-07 requires no implicit `any`; Sequelize v6 generic helpers (`InferAttributes`, `InferCreationAttributes`, `CreationOptional`) provide full type safety without manual interface duplication
- **Rejected:** Plain `sequelize.define()` — returns loosely-typed `Model` without field-level type inference

### ESM compatibility
- **Chosen:** All imports use `.js` extension aliases (TypeScript ESM convention) and `sequelize` imported as default
- **Rationale:** `packages/backend` is `"type": "module"` — CommonJS `require()` is unavailable; Sequelize v6 ships CJS but is consumable via ESM interop with `import sequelize from 'sequelize'`
- **Rejected:** Converting the package to CJS — conflicts with the monorepo ESM-first stance established in the scaffold
