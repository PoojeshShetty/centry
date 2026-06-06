# Task 3: Create sdk, backend, and frontend package stubs

## Trace
- **FR-IDs:** FR-05, FR-08, FR-09
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/sdk/package.json` — create
- `packages/sdk/tsconfig.json` — create
- `packages/sdk/src/index.ts` — create
- `packages/backend/package.json` — create
- `packages/backend/tsconfig.json` — create
- `packages/backend/src/index.ts` — create
- `packages/frontend/package.json` — create
- `packages/frontend/tsconfig.json` — create
- `packages/frontend/src/index.ts` — create

## Design References
- design.md §Architecture (packages/sdk, packages/backend, packages/frontend components)
- design.md §Data Flow (cross-package @centry/shared resolution)
- design.md §Interface Contracts (package.json exports field, Workspace Scripts)
- design.md §Design Decisions (TypeScript compiled output location, Package naming scope)

## Contracts (task-specific)

### Internal Interfaces
- Each package `package.json`: `name: "@centry/<name>"`, `exports: { ".": "./src/index.ts" }`, `scripts: { build: "tsc --build", dev: "tsc --build --watch" }`, `dependencies: { "@centry/shared": "workspace:*" }`
- Each `tsconfig.json`: extends `../../tsconfig.base.json`, `outDir: "dist"`, `rootDir: "src"`, project reference to `packages/shared`
- Each `src/index.ts`: stub export — `export {}` or a single comment stub; NO application logic

## Acceptance Criteria

### FR-05: Per-package structure
- GIVEN `packages/sdk`, `packages/backend`, and `packages/frontend`
- WHEN each directory is inspected
- THEN each has `package.json`, `tsconfig.json`, and `src/index.ts`

### FR-08: Stubs only
- GIVEN all three `src/index.ts` files
- WHEN read
- THEN none contains Express routes, UI components, or SDK send logic

### FR-03: TypeScript project references (cross-package)
- GIVEN each package `tsconfig.json` referencing `packages/shared`
- WHEN `tsc --build` runs from repo root
- THEN zero type errors across all packages

## Done Criteria
- [ ] `packages/sdk/package.json`, `packages/backend/package.json`, `packages/frontend/package.json` each exist with correct `name`, `exports`, and `scripts`
- [ ] All three `tsconfig.json` files extend `../../tsconfig.base.json` and include a project reference to `../../packages/shared`
- [ ] All three `src/index.ts` files exist and contain only a stub (no application logic)
- [ ] `@centry/shared` is listed as a workspace dependency in each package (`"workspace:*"`)
- [ ] `tsc --build` from repo root completes with zero errors across all 4 packages
- [ ] No hand-written version strings (dependencies added via `pnpm add --filter <package>`)
