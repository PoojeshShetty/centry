# Design: frontend-scaffold

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-23
- **Requirements:** ../requirements.md

## Architecture

### Components

- `index.html`: Vite HTML entry point at package root — new
- `vite.config.ts`: Vite build config with `@vitejs/plugin-react` — new
- `src/main.tsx`: React app entry; mounts `<App />` into `#root` — new
- `src/App.tsx`: Top-level app component; renders `<RouterProvider router={router} />` — new
- `src/index.ts`: Package barrel; re-exports `App` (satisfies the `exports` field) — modified
- `src/routes/index.tsx`: `createBrowserRouter` definition; declares `/` → `HomePage`, `*` → `NotFoundPage` — new
- `src/pages/home/index.tsx`: Stub `HomePage` component — new
- `src/pages/not-found/index.tsx`: Stub `NotFoundPage` component — new
- `src/store/useAppStore.ts`: Zustand store exporting `useAppStore` hook — new
- `src/components/`: Shared/cross-page components directory + `__tests__/` stub — new
- `src/context/`: Context directory + `__tests__/` stub — new
- `src/utils/`: Utilities directory + `__tests__/` stub — new
- `src/store/__tests__/`: Store stub test — new
- `src/routes/__tests__/`: Routes stub test — new
- `src/pages/home/__tests__/`: HomePage stub test — new
- `jest.config.js`: Jest config as **ESM** (`export default`), `testEnvironment: jsdom`, ts-jest ESM transform pointing to `tsconfig.jest.json`, `extensionsToTreatAsEsm`, `transformIgnorePatterns` for `antd`, `moduleNameMapper` to strip `.js` specifiers — new
- `jest.setup.ts`: Imports `@testing-library/jest-dom` — new
- `tsconfig.json`: Overrides base for the Vite app (`composite: false`, `declaration: false`, adds `DOM`/`DOM.Iterable` libs, `jsx: react-jsx`, removes `outDir`) — modified
- `tsconfig.jest.json`: ts-jest config extending `tsconfig.json`; **keeps** `module: ESNext` + `moduleResolution: bundler` (native ESM) — new
- `package.json`: **Keeps** `"type": "module"` and `exports`; updated scripts (`dev`, `build`, `preview`, `test`); adds all deps via install — modified

### Data Flow

`index.html` → `src/main.tsx` → `<App />` → `<RouterProvider router>` → `src/routes/index.tsx`
`src/routes/index.tsx` → `{ path: '/' }` → `src/pages/home/index.tsx`
`src/routes/index.tsx` → `{ path: '*' }` → `src/pages/not-found/index.tsx`
Components → `useAppStore()` → Zustand store (`AppState`)

## Data Models

- `AppState`:
  - `ready (boolean)`: scaffold initialisation flag
  - `theme ('light' | 'dark')`: UI theme selection (placeholder; theming deferred to M3)

- `useAppStore` actions:
  - `setTheme(t: 'light' | 'dark'): void`: updates `theme` in store

No database migrations — frontend-only package.

## Design Decisions

### Keep `"type": "module"` + `exports` — ESM-native package (revised)
- **Chosen:** Keep `"type": "module"` and `"exports": { ".": "./src/index.ts" }` in `packages/frontend/package.json`. `src/index.ts` is a thin barrel re-exporting `App`.
- **Rationale:** All sibling packages (`@centry/shared`, `@centry/sdk`, `@centry/backend`) declare `"type": "module"` with the same `exports` shape; matching them keeps the monorepo uniform and lets frontend code author with native ESM `import`/`export` throughout. The `"type": "module"` field does **not** force Jest into experimental ESM by itself — ts-jest transforms `.ts`/`.tsx` inside Jest's own runtime — but here we deliberately adopt native ESM Jest anyway (see next decision) so package, app, and tests all share one ESM module system. The real app entry remains `index.html` → `src/main.tsx`; `exports`/`index.ts` is consistency-only dead weight, not the runtime path.
- **Rejected:** Removing `"type": "module"` and `exports` (the prior design's approach) — diverges from every sibling package and forces a CommonJS island purely to simplify Jest, which native ESM Jest already handles.

### Native ESM Jest (ts-jest ESM preset)
- **Chosen:** ts-jest in ESM mode — `useESM: true`, `extensionsToTreatAsEsm: ['.ts', '.tsx']`, ts-jest ESM preset. Test script: `cross-env NODE_OPTIONS=--experimental-vm-modules jest`. `cross-env` is added as a devDependency so the flag works on Windows (PowerShell/cmd can't set inline env prefixes).
- **Rationale:** End-to-end ESM — package, source, and tests share one module system with no CommonJS bridge. Aligns the test pipeline with how Vite and the rest of the monorepo run. User explicitly chose this over the lower-friction CJS-transform path.
- **Rejected:** ts-jest CommonJS transform (config named `.cjs`, `module: CommonJS` in `tsconfig.jest.json`) — lower friction and no experimental flag, but keeps a CJS translation layer the user opted out of.

### Jest config as ESM `jest.config.js` (not `.ts`)
- **Chosen:** `jest.config.js` using `export default { ... }` (interpreted as ESM under `"type": "module"`). Includes `transformIgnorePatterns` allowing `antd` (and ESM-only transitive deps) to be transformed, and a `moduleNameMapper` (`^(\\.{1,2}/.*)\\.js$` → `$1`) to resolve `.js` specifiers emitted under ESM.
- **Rationale:** A `.js` config is already valid ESM under `"type": "module"`; avoids the fragility of loading a `jest.config.ts` through ts-node under ESM. Keeps config resolution dependency-free.
- **Rejected:** `jest.config.ts` — requires a ts-node ESM loader path that is brittle for a scaffold; `jest.config.cjs` — would reintroduce a CommonJS file into an otherwise all-ESM package.

### `tsconfig.jest.json` stays ESM (extends base unchanged module settings)
- **Chosen:** `tsconfig.jest.json` extends `tsconfig.json`/`tsconfig.base.json` and **keeps** `module: ESNext` + `moduleResolution: bundler`. It only layers in test ergonomics (`DOM`/`DOM.Iterable` libs, `jsx: react-jsx`) and drops `composite`/`declaration`.
- **Rationale:** `tsconfig.base.json` already targets `ES2022` / `module: ESNext` / `moduleResolution: bundler` — exactly what native ESM Jest needs. No CommonJS override is required, so the Jest tsconfig is a thin delta rather than a parallel module-system definition.
- **Rejected:** Overriding `module: CommonJS` (the prior design) — only needed for the CJS-transform path, which is no longer chosen.

### Modern React Router v6: `createBrowserRouter` + `<RouterProvider>`
- **Chosen:** `createBrowserRouter([...])` in `src/routes/index.tsx`; `<RouterProvider router={router} />` rendered inside `src/App.tsx`.
- **Rationale:** This is the data-router API introduced in React Router v6.4+ and is the recommended approach for new projects. Enables future use of loaders and actions without refactoring. Wrapping it in `App` (rather than inline in `main.tsx`) gives `src/index.ts` a meaningful default export.
- **Rejected:** `<BrowserRouter>` wrapping — legacy v6 API; the requirements acknowledge both but the modern approach is preferable for a new scaffold.

### Styled components defined inline in component body (FR-14, FR-23)
- **Chosen:** All styled components defined inside the function body, not extracted to separate files.
- **Rationale:** Project convention enforced by requirements. Inline definition co-locates style with the component that owns it; no `styles/` directories introduced.
- **Rejected:** Extracting to separate files or a `styles/` folder — prohibited by FR-23.

### Install packages via `pnpm install <package>` (no hardcoded versions)
- **Chosen:** All dependencies are added by running `pnpm install <package>` within `packages/frontend`, resolving to latest versions automatically.
- **Rationale:** User preference — avoids stale pinned versions and keeps the install step as the source of truth for version resolution.
- **Rejected:** Hardcoding versions in `package.json` — contradicts project convention.
