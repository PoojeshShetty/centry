# Task 2: Define typed Account Sequelize model

## Trace
- **FR-IDs:** FR-04, FR-07
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/backend/src/models/account.ts` — create
- `packages/backend/src/models/index.ts` — create
- `packages/backend/src/tests/models/account.test.ts` — create

## Design References
- design.md §Architecture (src/models/account.ts, src/models/index.ts components)
- design.md §Data Models (Account entity)
- design.md §Interface Contracts (Account exported model class)
- design.md §Design Decisions (TypeScript model definition: class-based vs Model.init)

## Contracts (task-specific)

### Internal Interfaces
- `Account` (default export from `src/models/account.ts`): Sequelize Model class
  - Pre: `sequelize` singleton from `config/sequelize.ts` is imported and used in `Account.init()`
  - Post: `Account.create({ name })` inserts a row with auto-generated UUID `id` and auto-managed `created_at`; no `updated_at` column

## Acceptance Criteria

### FR-04: Account model fields
- GIVEN Sequelize is connected and the `accounts` table exists
- WHEN `Account.create({ name: 'Acme' })` is called
- THEN a row SHALL exist in `accounts` with:
  - `id`: auto-generated UUID (not null)
  - `name`: `'Acme'` (not null)
  - `created_at`: timestamp set automatically

### FR-07: TypeScript cleanliness
- GIVEN `tsc --build` is run
- THEN zero type errors SHALL be reported for model files

## Done Criteria
- [ ] `src/models/account.ts` defines `Account` extending `Model<InferAttributes<Account>, InferCreationAttributes<Account>>`
- [ ] `id` declared as `CreationOptional<string>` with `DataTypes.UUIDV4` default
- [ ] `name` declared as `string` with `allowNull: false`
- [ ] `created_at` declared as `CreationOptional<Date>` with `timestamps: true`, `updatedAt: false`
- [ ] `src/models/index.ts` re-exports `Account`
- [ ] No implicit `any` in model files (`tsc --build` passes)
- [ ] Test verifies `Account.create({ name })` returns correct field types (mocked or integration)
