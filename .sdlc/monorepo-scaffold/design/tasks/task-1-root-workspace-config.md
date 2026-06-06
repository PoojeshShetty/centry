# Task 1: Create root workspace config

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-09
- **Depends on:** none
- **Design:** ../design.md

## Files
- `pnpm-workspace.yaml` — create
- `package.json` — create
- `tsconfig.base.json` — create
- `.gitignore` — create

## Design References
- design.md §Architecture (pnpm-workspace.yaml, tsconfig.base.json components)
- design.md §Interface Contracts (Workspace Scripts table)
- design.md §Design Decisions (TypeScript compiled output location)

## Contracts (task-specific)

### Internal Interfaces
- `pnpm-workspace.yaml` lists `packages/*`
- Root `package.json` scripts: `build: tsc --build`, `dev: tsc --build --watch`, `test: echo 'No tests in scaffold' && exit 0`, `lint: eslint packages/**/src`, `format: prettier --write .`
- `tsconfig.base.json` sets `strict: true`, `moduleResolution: bundler`, `target: ES2022`, `declaration: true`, `outDir` omitted (per-package), `composite: true`

## Acceptance Criteria

### FR-01: pnpm workspace config
- GIVEN the repo root with `pnpm-workspace.yaml`
- WHEN `pnpm install` is run
- THEN all packages resolve without errors
- AND no missing dependency warnings are emitted

### FR-03: TypeScript project references
- GIVEN `tsconfig.base.json` at root
- WHEN any package `tsconfig.json` extends it
- THEN `tsc --build` from root completes with zero type errors

### FR-09: Dependency installation via pnpm add
- GIVEN the root `package.json` after scaffold setup
- WHEN inspected
- THEN no dependency version strings have been hand-authored

## Done Criteria
- [ ] `pnpm-workspace.yaml` exists at repo root and lists `packages/*`
- [ ] Root `package.json` exists with `name: "centry"`, `private: true`, and all 5 workspace scripts (`build`, `dev`, `test`, `lint`, `format`)
- [ ] `tsconfig.base.json` exists with `strict: true`, `composite: true`, `moduleResolution: bundler`
- [ ] `.gitignore` exists and includes `node_modules`, `dist`, `.env`
- [ ] `pnpm install` runs without errors from repo root
- [ ] No version strings hand-authored in `package.json` (devDependencies added via `pnpm add -w -D`)
