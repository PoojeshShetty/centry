# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**centry** is a minimal Sentry-style logging platform built from scratch as a pnpm-workspaces
TypeScript monorepo. It has four runtime parts plus a shared contract package:

- **`packages/sdk`** (`@centry/sdk`) — a Node SDK that backends install to buffer and ship logs
  over the Sentry envelope wire format.
- **`packages/sdk-react`** (`@centry/sdk-react`) — a browser/React SDK with auto-instrumentation
  integrations (global errors, fetch, XHR, navigation), an `ErrorBoundary` component, and a
  `useLogger` hook. Initialized via `init({ dsn })` in `main.tsx`; `VITE_CENTRY_DSN` controls
  activation. Uses **Vitest** (not Jest) for tests.
- **`packages/backend`** (`@centry/backend`) — Express service that ingests envelopes, authenticates,
  stores logs in Postgres, and serves them to the UI.
- **`packages/frontend`** (`@centry/frontend`) — React (Vite) logs-explorer UI.
- **`packages/shared`** (`@centry/shared`) — canonical TS types (`LogItem`, envelope headers,
  severity map) and `parseEnvelope`. **The envelope is the integration boundary: define it once
  here so SDK/backend/frontend never drift.**

`plan.md` is the authoritative spec for the wire format, data model, endpoints, auth schemes, and
build order (Backend → SDK → Frontend). Read it before doing feature work. Current state: all
packages are implemented; the frontend uses `@centry/sdk-react` for browser-side log shipping.

> Note: `plan.md` describes raw `pg`+`ioredis`. The backend actually uses **Sequelize** (`pg` +
> `pg-hstore`) and Redis is not wired up yet. Trust the code for stack details, `plan.md` for intent.

## Commands

Run from the repo root unless noted. This is a pnpm workspace — use `--filter <pkg>` to target one package.

```bash
pnpm install                         # install all workspace deps
pnpm build                           # tsc --build across all project references
pnpm lint                            # eslint over packages/**/src/**/*.ts
pnpm format                          # prettier --write .

docker compose up -d                 # local Postgres (5432) + Redis (6379)
cp .env.example .env                 # then fill DB_URL / REDIS_URL / ADMIN_TOKEN / PORT
```

The root `pnpm test` is a no-op placeholder. **Tests run per package, with different runners:**

```bash
# Frontend — Jest (native ESM)
pnpm --filter @centry/frontend test
pnpm --filter @centry/frontend test -- -t "name of test"      # single test by name
pnpm --filter @centry/frontend test -- routes.test.tsx        # single file

# Backend — Vitest
pnpm --filter @centry/backend test
pnpm --filter @centry/backend test -- account.test.ts         # single file
pnpm --filter @centry/backend test -- -t "name of test"       # single test by name

# SDK (Node) — Vitest
pnpm --filter @centry/sdk test
pnpm --filter @centry/sdk test -- buffer.test.ts              # single file

# SDK React — Vitest
pnpm --filter @centry/sdk-react test
pnpm --filter @centry/sdk-react test -- useLogger.test.ts     # single file

# Frontend dev server / build
pnpm --filter @centry/frontend dev
pnpm --filter @centry/frontend build
```

When installing dependencies, always `pnpm install <pkg>` (or `pnpm --filter <pkg> add <dep>`) — never
hand-edit a hardcoded version into `package.json`.

# Coding styles to follow

- For application code always follow top level imports. 
- For unit test, use inline imports when dealing with mocked objects. Else follow top level imports
- Define styled components outside render methods since within render methods leads to creation of component on every render
- Dont't right comments that add zero value
    eg: - This component is created using the fr-...
        - --------- Utils ---------------
  The comments should be for section of code which might have some complexity or some solution that was not straight forward to implement
- Follow DRY for code and in tests too: extract repeated render/setup boilerplate (e.g. a `renderPage(initialEntries, routes)` MemoryRouter helper) into a shared file and reuse it across test files instead of redefining per file
- Do not define types inside code files. Keep types in a dedicated `types.ts` file per package (e.g. `packages/sdk/src/types.ts`). Mixing type definitions into logic files makes the code harder to read and navigate.


## Architecture notes

**Three auth schemes, one per actor** (see `plan.md` §2.2 for the middleware contracts):
- **Ingest** (SDK→backend): `X-Sentry-Auth` header carries the public key → `project_keys`. The DSN
  encodes the project.
- **Read** (frontend→backend): JWT via `Authorization: Bearer <token>` + project ownership check.
  There is no `read_token` column on `projects` — ownership is verified against the JWT subject.
- **Management** (provisioning): a single `ADMIN_TOKEN` env secret gates the `/api/internal/*` routes.

**sdk-react architecture:** `init()` in `src/core/init.ts` parses the DSN, generates a session
`traceId` (random 16-char hex), and calls `installIntegrations()` which patches `window.onerror`,
`window.addEventListener('unhandledrejection')`, `fetch`, `XMLHttpRequest`, and the History API.
All logs funnel through `captureLog` → `Buffer` → `Transport` (same envelope wire format as the
Node SDK). `useLogger(componentName)` returns a memoized logger that auto-tags `'component.name'`.
The `ErrorBoundary` component wraps subtrees and logs render errors. `resetForTest()` is exported
from `init.ts` and individual integration modules for test isolation.

**Ingest route quirk:** the envelope body is newline-delimited, NOT a single JSON object. Read it as
raw text (`express.text({ type: 'application/x-sentry-envelope' })`) and run it through
`parseEnvelope` — do not apply `express.json()` to that route. A malformed *item* must be skipped
(not 500 the batch); a malformed *body* is a 400; a valid envelope is always `200 { id }`.

**SDK hard constraints:** `enableLogs:false` suppresses everything; `beforeSendLog`→null drops
silently; buffer ≤1000 items; ≤100 logs/envelope; flush at 100 items or 5s and on SIGTERM/SIGINT;
**the SDK never throws** (non-2xx transport → log to stderr).

### TypeScript / module setup

- Every package is `"type": "module"` and uses TS **project references**. `tsconfig.base.json` sets
  `moduleResolution: "bundler"`, `composite: true`, `strict: true`. Root `tsconfig.json` references
  all five packages; `pnpm build` is `tsc --build`.
- Packages export source directly (`"exports": { ".": "./src/index.ts" }`) and depend on each other
  via `"@centry/shared": "workspace:*"`.
- `@centry/sdk-react` lists `react >=18` as a peer dependency and uses **Vitest** (with `jsdom`
  environment) — not Jest. Tests use `@testing-library/react`.
- Prettier: single quotes, semicolons, trailing commas (`all`), width 100.

## Coding gotchas

These are non-obvious and have already cost time:

- **styled-components must use the named import:** `import { styled } from 'styled-components'`, NOT
  the default `import styled from 'styled-components'`. styled-components has no `exports` map, so
  native-ESM Jest resolves the CJS `main` and hands back `module.exports` as the default →
  `styled.div is not a function`. The named export is detected correctly by Jest's cjs-module-lexer.
- **Frontend Jest env must be `jest-fixed-jsdom`, not plain `jsdom`** (set in
  `packages/frontend/jest.config.js`). react-router-dom v7 touches `TextEncoder` at import time and
  jsdom doesn't expose it (`ReferenceError: TextEncoder is not defined`). `jest-fixed-jsdom` is a
  jsdom superset that restores Node globals.
- antd v6: `Alert` takes `title` (and `description`), not `message` — `message` is deprecated

## SDLC workflow (`.sdlc/`)

This repo is driven by a spec-first workflow. Each feature has a directory under `.sdlc/<feature>/`:

```
.sdlc/<feature>/
  requirements.md            # user stories + numbered functional requirements (FR-NN)
  design/design.md           # architecture/design for the feature
  design/tasks/task-N-*.md   # planned task files
  implement/tasks/task-N-*.done.md   # tasks renamed *.done.md once implemented
  verify/report.md           # verification results
```

Commits reference the FR numbers a change satisfies (e.g. `feat(frontend-scaffold): ... (FR-05, FR-06)`).
The matching skills drive each phase: `/requirements` → `/design` (or `/design_and_taskify`) →
`/taskify` → `/implement` → `/verify`. Work follows TDD and mirrors existing codebase patterns.
