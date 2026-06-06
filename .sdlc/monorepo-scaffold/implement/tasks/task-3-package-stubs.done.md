# Task 3 Completion: Create sdk, backend, and frontend package stubs

## Summary
Created `@centry/sdk`, `@centry/backend`, and `@centry/frontend` packages — each with `package.json` (exports `.` → `./src/index.ts`, `build`/`dev` scripts), `tsconfig.json` (extends `tsconfig.base.json`, `outDir: dist`, `rootDir: src`, project reference to `../shared`), and a stub `src/index.ts` (doc comment + `export {}`, no application logic). `@centry/shared` was added to each as a `workspace:*` dependency via `pnpm add --filter`. `tsc --build` from repo root now builds all 4 packages with zero errors.

## Commits
- `98ae31b` feat(monorepo-scaffold): add sdk, backend, frontend stubs and root tsconfig (FR-05, FR-08, FR-09)

## Deviations
- **Rule 3: Blocking** — No root `tsconfig.json` existed after tasks 1–2 (task 2 only built `packages/shared` directly), so `tsc --build` from repo root had no entry point and the done criterion "tsc --build from repo root completes with zero errors across all 4 packages" could not pass. Added a solution-style root `tsconfig.json` (`files: []`, `references` to all 4 packages). Standard TS monorepo pattern; not an architectural change.
- **Rule 2: Missing Critical** — each package `package.json` includes `"type": "module"`, `"version": "0.0.0"`, `"private": true` (not enumerated in the task contract), matching the `@centry/shared` precedent from Task 2 to align with the base config's `module: ESNext` and silence pnpm workspace warnings.

## Difficulties
- pnpm 11 does not auto-link workspace packages by default. `pnpm add @centry/shared --filter ...` hit `ERR_PNPM_FETCH_404` (tried the npm registry). Resolved by using the explicit workspace protocol: `pnpm add "@centry/shared@workspace:*" --filter <pkg>`, run once per package. pnpm wrote `"@centry/shared": "workspace:*"` — no hand-authored versions (FR-09 satisfied).

## Notes
- Stubs use `export {}` to keep each module a valid ES module with an empty public surface; no cross-package imports yet (prohibition: no runtime coupling beyond shared types).
- Project references (`../shared`) + the root solution tsconfig mean `tsc --build` resolves the dependency graph in order; FR-04 cross-package `@centry/shared` import resolution is now wired and ready for M1+ consumers.
- Task 4 (infra and tooling: docker-compose, .env.example, eslint, prettier) is the only remaining task and depends only on task-1 — now unblocked.
