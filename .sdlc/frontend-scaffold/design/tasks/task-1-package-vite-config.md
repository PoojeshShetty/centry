# Task 1: Configure package.json and Vite build tooling

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/frontend/package.json` — modify (update scripts, **keep** `"type": "module"` and `exports`, add workspace dep + `cross-env` devDep)
- `packages/frontend/tsconfig.json` — modify (override base for Vite app: `composite: false`, `declaration: false`, add `DOM`/`DOM.Iterable` libs, `jsx: react-jsx`, remove `outDir`)
- `packages/frontend/tsconfig.jest.json` — create
- `packages/frontend/vite.config.ts` — create
- `packages/frontend/index.html` — create

## Design References
- design.md §Architecture (vite.config.ts, index.html, tsconfig.json, tsconfig.jest.json, package.json components)
- design.md §Design Decisions (Keep `"type": "module"` + `exports` — ESM-native package)
- design.md §Design Decisions (`tsconfig.jest.json` stays ESM)
- design.md §Design Decisions (Install packages via `pnpm install <package>`)

## Contracts (task-specific)

### Internal Interfaces
- `packages/frontend` package: exposes `dev`, `build`, `preview`, `test` scripts
  - Pre: pnpm workspace root can resolve `packages/frontend`
  - Post: `pnpm dev` starts Vite dev server; `pnpm build` runs `tsc -b && vite build`; `pnpm test` runs `cross-env NODE_OPTIONS=--experimental-vm-modules jest`

## Acceptance Criteria

### FR-01: Valid Vite + React + TypeScript workspace
- GIVEN the monorepo root
- WHEN `pnpm install` is run from the root
- THEN `packages/frontend` SHALL be linked as a workspace package with no resolution errors

### FR-02: Package scripts
- GIVEN `packages/frontend/package.json`
- WHEN read
- THEN it SHALL expose `dev`, `build`, `preview`, and `test` scripts

### FR-03: TypeScript configuration
- GIVEN `packages/frontend/tsconfig.json`
- WHEN read
- THEN it SHALL extend `../../tsconfig.base.json` and override `composite: false`, `declaration: false`, set `jsx: react-jsx`, and include `DOM`/`DOM.Iterable` in `lib`

### FR-04: Shared workspace dependency
- GIVEN `packages/frontend/package.json`
- WHEN `@centry/shared` is listed as a dependency
- THEN TypeScript SHALL resolve `LogItem` and related types from `@centry/shared` without path aliases

## Done Criteria
- [ ] `packages/frontend/package.json` **retains** `"type": "module"` and `"exports": { ".": "./src/index.ts" }`; has scripts `dev`, `build`, `preview`, `test` (test = `cross-env NODE_OPTIONS=--experimental-vm-modules jest`); `@centry/shared: workspace:*` in dependencies
- [ ] `packages/frontend/tsconfig.json` extends `../../tsconfig.base.json` with `composite: false`, `declaration: false`, `jsx: react-jsx`, `lib` includes `DOM`/`DOM.Iterable`, no `outDir`
- [ ] `packages/frontend/tsconfig.jest.json` exists and extends `./tsconfig.json`, **keeping** `module: ESNext` + `moduleResolution: bundler` (no CommonJS override); layers in `DOM`/`DOM.Iterable` libs + `jsx: react-jsx`, drops `composite`/`declaration`
- [ ] `packages/frontend/vite.config.ts` exists and uses `@vitejs/plugin-react`
- [ ] `packages/frontend/index.html` exists with a `<script type="module" src="/src/main.tsx">` entry
- [ ] `pnpm install` from monorepo root completes with no errors
- [ ] Packages installed via `pnpm install <pkg>` in `packages/frontend`: `vite`, `@vitejs/plugin-react`, `react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom`, `cross-env`
