# Design: auth-onboarding

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15
- **Requirements:** ../requirements.md

## Architecture

Human-facing authentication layer added to the existing `centry` monorepo, additive to (and
independent of) the existing machine-auth schemes (ingest key / read token / admin token). Backend
follows a 3-layer split (repository → service → route) mirroring the existing empty
`repositories/` `services/` `routes/` scaffold dirs. Frontend follows the existing
`store/` `routes/` `pages/` layout.

### Components

**Backend (`packages/backend`)**
- `Account` model — **modified**: gains `email` + `password_hash` columns (the account is the login identity).
- `AccountRepository` — **new**: Sequelize data access (`create`, `findByEmail`, `findById`).
- `AuthService` — **new**: business logic — password hashing/verification (bcryptjs), JWT sign/verify (jsonwebtoken), zod input validation, `register()` and `login()`.
- `requireAuth` middleware — **new**: verifies the `Authorization: Bearer <jwt>`, attaches `req.accountId`, returns 401 on missing/invalid/expired.
- Auth router — **new**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- `index.ts` — **modified**: mounts the auth router under `/api/auth` with `express.json()` (currently mounts nothing).
- Migration tooling — **new**: sequelize-cli (`.sequelizerc`, env-driven config, `migrations/` dir).

**Frontend (`packages/frontend`)**
- `useAuthStore` (zustand) — **new**: `{ token, user, isAuthenticated, setAuth, logout }`, token+user persisted to `localStorage`.
- `apiClient` — **new**: thin fetch wrapper that attaches `Authorization: Bearer <token>` and parses JSON/errors.
- `RegisterPage` / `LoginPage` — **new**: antd forms; on success authenticate and navigate to home; render inline backend errors.
- `HomePage` — **modified**: protected, greets "Hello \<name>".
- `AccountPage` — **new**: protected, shows name / email / member-since.
- `ProtectedRoute` — **new**: redirects unauthenticated visitors to `/login`.
- Router — **modified**: adds `/login`, `/register`, protected `/` (home) and `/account`.

### Data Flow
`POST /api/auth/register` → validate (zod) → `AuthService.register()` → `AccountRepository.create()` → DB → sign JWT → `201 { token, user }`
`POST /api/auth/login` → validate (zod) → `AuthService.login()` → `AccountRepository.findByEmail()` → `bcryptjs.compare` → sign JWT → `200 { token, user }`
`GET /api/auth/me` → `requireAuth` (verify JWT) → `AccountRepository.findById(req.accountId)` → `200 { id, name, email, created_at }`
Frontend: form submit → `apiClient` → on success `useAuthStore.setAuth(token, user)` → persist `localStorage` → `navigate('/')`; `ProtectedRoute` reads `useAuthStore.isAuthenticated`.

## Data Models

**Account** (modify existing `accounts` table — currently `id`, `name`, `created_at`):
- `id (UUID, PK, default UUIDV4)` — existing
- `name (string, not null)` — existing
- `email (string, not null, unique)` — **new**; stored lowercased (normalized in `AuthService` on write and on lookup) so login is case-insensitive (FR-04)
- `password_hash (string, not null)` — **new**; bcryptjs hash; never selected into any API response (FR-08)
- `created_at (Date)` — existing; surfaced as "member since" (FR-06 / FR-13)

**Migration / rollback strategy:** introduced via **sequelize-cli**. A migration adds the two columns
with a unique index on `email`. `up` adds `email` + `password_hash` (+ unique index); `down` drops
both columns (reversible). An empty/dev database is assumed; the migration is the source of truth for
schema and is run with `npm run migrate` (sequelize-cli `db:migrate`). Migration files are plain
`.cjs` (sequelize-cli runs them outside the TS/ESM build), with DB connection read from the same
`DB_*` env vars used by `src/config/sequelize.ts`.

## Interface Contracts

### API Endpoints (shared)
- `POST /api/auth/register`: create an account and start a session
  - Input: `{ "name": string, "email": string, "password": string }`
  - Output: `201 { "token": string, "user": { "id", "name", "email", "created_at" } }`
  - Errors: `400` validation (empty name / malformed email / password < 8); `409 { "error": "email already registered" }`
- `POST /api/auth/login`: authenticate and start a session
  - Input: `{ "email": string, "password": string }`
  - Output: `200 { "token": string, "user": { "id", "name", "email", "created_at" } }`
  - Errors: `400` missing fields; `401 { "error": "invalid email or password" }` (identical message for unknown email and wrong password)
- `GET /api/auth/me`: return the signed-in account
  - Headers: `Authorization: Bearer <jwt>`
  - Output: `200 { "id", "name", "email", "created_at" }`
  - Errors: `401` missing / malformed / tampered / expired token

No response body ever contains `password_hash` (FR-08).

### Internal Interfaces (shared)
- `AccountRepository.create({ name, email, password_hash }) -> Account`: persist a new account
  - Pre: `email` is lowercased and not already present
  - Post: one row created with a UUID `id` and `created_at`
- `AccountRepository.findByEmail(email) -> Account | null`: lookup by normalized email
  - Pre: `email` lowercased by caller
- `AccountRepository.findById(id) -> Account | null`: lookup by primary key
- `AuthService.register({ name, email, password }) -> { token, user }`: validate, hash, persist, sign
  - Pre: input passes the zod register schema
  - Post: account persisted with a hash; JWT returned; throws a duplicate-email error if email exists
- `AuthService.login({ email, password }) -> { token, user }`: validate, verify, sign
  - Post: JWT returned on match; throws a single generic invalid-credentials error otherwise (no field disclosure)
- `requireAuth(req, res, next)`: Express middleware; verifies JWT, sets `req.accountId`, else `401`
- Frontend `useAuthStore`: `{ token, user, isAuthenticated, setAuth(token, user), logout() }` — `token`+`user` persisted to `localStorage`; `logout()` clears both
- Frontend `apiClient.request(path, opts) -> Promise<data>`: attaches `Authorization: Bearer <token>` when present; throws a typed error carrying the backend `{ error }` message + status
- Frontend `ProtectedRoute`: renders children when `isAuthenticated`, else `<Navigate to="/login" />`

## Design Decisions

### Password hashing: bcryptjs vs native bcrypt/argon2
- **Chosen:** `bcryptjs` (pure-JS bcrypt)
- **Rationale:** No native compilation — installs cleanly on the Windows + pnpm dev box and in minimal CI images; performance is ample for an auth MVP; salt is generated internally.
- **Rejected:** native `bcrypt` / `argon2` — faster / theoretically stronger, but native modules carry node-gyp build-toolchain risk on Windows and CI.

### Session token: jsonwebtoken HS256, 1h expiry
- **Chosen:** `jsonwebtoken`, HS256, signed with `JWT_SECRET` env var, 1-hour expiry, payload = `{ sub: accountId }` only.
- **Rationale:** Matches the requirements' "single short-lived JWT" MVP scope (no refresh tokens); the 1h expiry exercises the FR-07 expiry-rejection path; payload carries no PII or secrets.
- **Rejected:** 24h expiry — longer-lived token for an MVP without refresh; opaque DB sessions — adds storage/lookup the MVP does not need.

### Input validation: zod
- **Chosen:** `zod` schemas for register/login, validated in the service layer.
- **Rationale:** Declarative single source of truth for the FR-03 rules (name non-empty, email well-formed, password ≥ 8), good error messages, reusable inferred types.
- **Rejected:** hand-written checks + email regex — zero deps but more boilerplate and prone to drifting between endpoints.

### Email case-insensitivity: normalize in application
- **Chosen:** lowercase the email in `AuthService` before write and before lookup; plain unique constraint on the column.
- **Rationale:** Portable, no DB-specific features, trivially unit-testable; satisfies the FR-04 `Alice@Example.com` edge case.
- **Rejected:** Postgres `citext` — adds an extension + custom Sequelize type for the same outcome.

### Register status codes: 201 + 409
- **Chosen:** `201` on success; `409 Conflict` for duplicate email (distinct from `400` validation).
- **Rationale:** REST-conventional; lets the frontend cleanly distinguish "email taken" from "bad input" by status, not message parsing.
- **Rejected:** `200` + `400`-for-everything — simpler status surface but forces message-based discrimination on the client.

### Frontend token storage: localStorage (mandated)
- **Chosen:** persist JWT + user in `localStorage`, send as `Authorization: Bearer <token>` (per requirements §6 In Scope).
- **Rationale:** Required by the spec; survives reload for the MVP; logout clears it (FR-14) and a fresh load with no token redirects to login (FR-15).
