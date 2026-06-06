# Design: monorepo-scaffold

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09
- **Requirements:** ../requirements.md

## Architecture

### Components
- `pnpm-workspace.yaml`: workspace root listing `packages/*` — new
- `tsconfig.base.json`: shared strict TypeScript base config — new
- `eslint.config.js`: ESLint v9 flat config for all packages — new
- `.prettierrc`: Prettier formatting config — new
- `docker-compose.yml`: postgres + redis service definitions — new
- `.env.example`: environment variable documentation — new
- `packages/shared` (`@centry/shared`): canonical shared types and `parseEnvelope` utility — new
- `packages/sdk` (`@centry/sdk`): SDK stub — new
- `packages/backend` (`@centry/backend`): backend stub — new
- `packages/frontend` (`@centry/frontend`): frontend stub — new

### Data Flow
`packages/sdk` → imports `@centry/shared` → resolves to `packages/shared/src/index.ts` via TS path mapping
`packages/backend` → imports `@centry/shared` → same resolution
`packages/frontend` → imports `@centry/shared` → same resolution
`root tsc --build` → builds all packages in dependency order via project references

## Data Models

Defined in `packages/shared/src/index.ts`. No database entities in this milestone — types only.

- **SeverityLevel** (enum):
  - `DEBUG | INFO | WARN | ERROR | FATAL` (string values)

- **Attribute** (type):
  - `Record<string, string | number | boolean>` — arbitrary key-value metadata

- **LogItem** (interface):
  - `timestamp: string` — ISO-8601
  - `severity: SeverityLevel`
  - `message: string`
  - `attributes?: Attribute`

- **EnvelopeHeader** (interface):
  - `sdk_version: string`
  - `sent_at: string` — ISO-8601
  - `source: string` — e.g. `'browser' | 'node'`

- **Envelope** (interface):
  - `header: EnvelopeHeader`
  - `items: LogItem[]`

- **EnvelopeParseError** (class):
  - Extends `Error`
  - Thrown by `parseEnvelope` on invalid input

- **parseEnvelope** (function):
  - Signature: `parseEnvelope(raw: unknown): Envelope`
  - Stub implementation — throws `EnvelopeParseError('Not implemented')`
  - Real validation deferred to M1

## Interface Contracts

### Internal Interfaces (shared)

- `@centry/shared` export surface:
  - `LogItem`, `Attribute`, `SeverityLevel`, `EnvelopeHeader`, `Envelope` — type exports
  - `EnvelopeParseError` — class export
  - `parseEnvelope(raw: unknown) -> Envelope` — function export
  - Pre: `raw` is any unknown value
  - Post: returns a valid `Envelope` or throws `EnvelopeParseError`

- `package.json` `exports` field (each package):
  - `"." -> "./src/index.ts"` — TypeScript source resolution via `moduleResolution: bundler` or path mapping

### Workspace Scripts (root `package.json`)

| Script | Command |
|--------|---------|
| `build` | `tsc --build` |
| `dev` | `tsc --build --watch` |
| `test` | `echo 'No tests in scaffold' && exit 0` |
| `lint` | `eslint packages/**/src` |
| `format` | `prettier --write .` |

Each package (`shared`, `sdk`, `backend`, `frontend`) also exposes `build` and `dev` scripts with the same commands.

## Design Decisions

### parseEnvelope error behavior
- **Chosen:** Throw `EnvelopeParseError` on invalid input
- **Rationale:** Makes bad input explicit and catchable; aligns with backend ingestion error handling (M1); silent null returns risk undetected data loss
- **Rejected:** Return `null` on failure — callers can silently swallow invalid envelopes

### ESLint config format
- **Chosen:** ESLint v9 flat config (`eslint.config.js`)
- **Rationale:** `.eslintrc` is deprecated in ESLint v9; adopting flat config now avoids a forced migration once v10 drops legacy support
- **Rejected:** Legacy `.eslintrc.json` — deprecated, would require migration in a future milestone

### TypeScript compiled output location
- **Chosen:** `packages/<name>/dist/` per package
- **Rationale:** Each package is self-contained; standard for publishable npm packages; `.gitignore` can exclude `dist/` per-package; avoids a centralised output tree that complicates future publishing
- **Rejected:** Root `dist/<name>/` — non-standard, complicates per-package publishing and per-package `.gitignore` entries

### Linting and formatting toolchain
- **Chosen:** ESLint v9 + Prettier
- **Rationale:** Broader plugin ecosystem needed for React (M3) and Node (M1); team familiarity; Prettier handles formatting orthogonally to lint rules
- **Rejected:** Biome — faster but smaller plugin ecosystem; may not support all React/import rules needed in later milestones

### Package naming scope
- **Chosen:** `@centry/*` (matches project name)
- **Rationale:** Consistent with repo name; `@logmvp/*` referenced in acceptance criteria was a draft name
- **Rejected:** `@logmvp/*` — draft name from early requirements, does not match final project identity
