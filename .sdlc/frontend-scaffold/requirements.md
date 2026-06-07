# Frontend Scaffold — Requirements

> Step 1 of the SDLC workflow for `packages/frontend`.
> Scope: project structure only. Feature components (FilterBar, LogStream, LogDetailDrawer) are M3 and follow in the next step.

---

## 1. Project

- **Path:** `packages/frontend` (within the `centry` pnpm monorepo at `C:\Users\sande\projects\centry`)
- **Branch:** no dedicated branch created (`--no-commit` flag); work continues on `feature/backend-foundation` until a new branch is cut for M3 implementation.

---

## 2. Purpose

Establish `packages/frontend` as a ready-to-develop Vite + React + TypeScript workspace within the Centry monorepo — with a defined page-level folder structure, Zustand state store, React Router v6 routing, Ant Design + styled-components UI layer, and Jest test harness — so M3 feature development (logs explorer) can start from a consistent, convention-driven foundation without structural decisions outstanding.

---

## 3. User Stories

- As a developer, I want a working `pnpm dev` frontend workspace with correct folder conventions, so I can start building M3 feature components without setup overhead.
- As a developer, I want the folder structure, styling pattern, state store, and routing all stubbed out, so I can add new pages and components by following examples rather than making structural decisions mid-feature.

---

## 4. Functional Requirements

### Setup & Integration

- **FR-01:** The `packages/frontend` directory SHALL be a valid Vite + React + TypeScript project registered in `pnpm-workspace.yaml` and resolvable by the monorepo root.
- **FR-02:** The package SHALL expose `dev`, `build`, `preview`, and `test` scripts in `package.json`.
- **FR-03:** TypeScript SHALL be configured via a local `tsconfig.json` that extends `tsconfig.base.json` from the monorepo root.
- **FR-04:** The project SHALL integrate `@centry/shared` as a workspace dependency so frontend code can import canonical `LogItem` and related types directly.

### Folder Structure

- **FR-05:** The `src/` directory SHALL contain exactly these top-level folders on scaffold: `components/`, `pages/`, `context/`, `utils/`, `store/`, `routes/`.
- **FR-06:** Each page SHALL live under `src/pages/<page-name>/index.tsx`; components specific to that page SHALL be co-located in the same folder alongside `index.tsx`.
- **FR-07:** `src/components/` SHALL hold only shared/cross-page components (Ant Design wrappers, styled-component primitives usable across pages).
- **FR-08:** Each directory (`components/`, `pages/`, `context/`, `utils/`, `store/`) SHALL contain a `__tests__/` subfolder with at least one stub test file (`.test.tsx` or `.test.ts`) to confirm the test harness resolves imports in that location.

### State Management

- **FR-09:** Zustand SHALL be installed and `src/store/` SHALL contain at least one stub store module (e.g. `useAppStore.ts`) exporting a typed Zustand store with a placeholder state slice.

### Routing

- **FR-10:** React Router v6 SHALL be installed; `src/routes/` SHALL contain the root router definition (`index.tsx`) declaring at least one stub route (e.g. `/` → a placeholder `HomePage`).
- **FR-11:** The router SHALL be mounted in `src/main.tsx` wrapped in `<BrowserRouter>` (or `<RouterProvider>` if using `createBrowserRouter`).

### UI Library & Styling

- **FR-12:** Ant Design (`antd`) SHALL be installed and importable; no global CSS overrides SHALL be introduced at scaffold stage.
- **FR-13:** `styled-components` SHALL be installed.
- **FR-14:** Styled components SHALL be defined **inline within the component function body**, not in separate files. The canonical pattern is:

  ```tsx
  function MyComponent() {
    const Wrapper = styled.div`
      color: red;
    `
    return <Wrapper />
  }
  ```

- **FR-15:** No global `createGlobalStyle` or theme provider SHALL be introduced in the scaffold; theming is deferred to M3.

### Test Harness

- **FR-16:** Jest SHALL be configured as the test runner with `jsdom` as the test environment (`testEnvironment: 'jsdom'`).
- **FR-17:** `@testing-library/react` and `@testing-library/jest-dom` SHALL be installed and configured in the Jest setup file.
- **FR-18:** `ts-jest` (or Babel + `babel-jest` with TS preset) SHALL be configured so `.tsx`/`.ts` files compile correctly under Jest. (Note: Vite uses esbuild; Jest requires a separate TS transform since Vite's dev pipeline is not used in test runs.)
- **FR-19:** Running `pnpm test` from `packages/frontend` SHALL execute all `**/__tests__/**/*.test.{ts,tsx}` files and report pass/fail.
- **FR-20:** The scaffold stub tests SHALL all pass on first run with no feature code written.

### Prohibitions

- **FR-21:** The scaffold SHALL NOT include any feature-specific components (FilterBar, LogStream, LogRow, LogDetailDrawer) — those belong in M3.
- **FR-22:** The scaffold SHALL NOT introduce vitest — the backend/SDK use vitest; the frontend SHALL use Jest to avoid config bleed and honour the user's explicit choice.
- **FR-23:** Styled components SHALL NOT be extracted to separate files or a `styles/` directory — inline definition is the project convention.

---

## 5. Acceptance Criteria

### FR-01–FR-04: Workspace integration

**Happy path:**
- GIVEN the monorepo root
- WHEN `pnpm install` is run from the root
- THEN `packages/frontend` SHALL be linked as a workspace package with no resolution errors
- AND `@centry/shared` types SHALL be importable in `src/` files without path aliases

### FR-05–FR-08: Folder structure

**Happy path:**
- GIVEN a fresh clone of the repo
- WHEN a developer opens `packages/frontend/src/`
- THEN they SHALL see `components/`, `pages/`, `context/`, `utils/`, `store/`, `routes/` at the top level
- AND each SHALL contain a `__tests__/` subfolder with at least one stub test file

**Page co-location:**
- GIVEN a new page `LogsPage`
- WHEN it is created following the convention
- THEN its entry point SHALL be `src/pages/logs/index.tsx` with page-specific components alongside it

### FR-09: Zustand store

**Happy path:**
- GIVEN `src/store/useAppStore.ts`
- WHEN imported in any component
- THEN it SHALL export a typed Zustand hook with at least one readable state field
- AND `pnpm build` SHALL compile without type errors

### FR-10–FR-11: Routing

**Happy path:**
- GIVEN `pnpm dev` is running
- WHEN the browser navigates to `/`
- THEN the stub `HomePage` SHALL render with no console errors

**Failure path:**
- GIVEN an unmatched route (e.g. `/unknown`)
- THEN the router SHALL render a 404/fallback route (stub is sufficient)

### FR-12–FR-15: UI library and styling

**Happy path:**
- GIVEN a component using `styled.div` defined inline in the function body
- WHEN rendered in the browser
- THEN the styles SHALL apply correctly with no runtime warnings

**Prohibition check:**
- GIVEN any `src/` file
- WHEN a code reviewer scans for `styled` imports
- THEN no styled component SHALL be defined outside a component function body

### FR-16–FR-20: Jest harness

**Happy path:**
- GIVEN stub tests in each `__tests__/` folder
- WHEN `pnpm test` is run
- THEN all tests SHALL pass and Jest SHALL report 0 failures

**TS compilation:**
- GIVEN a `.tsx` test file importing a React component
- WHEN Jest runs
- THEN it SHALL compile and execute without transform errors

**Failure path (regression guard):**
- GIVEN a broken import in a stub test
- WHEN `pnpm test` is run
- THEN Jest SHALL report the failure clearly with file + line

---

## 6. Constraints

### In Scope
- `packages/frontend` Vite + React + TypeScript project creation
- `pnpm-workspace.yaml` registration
- Folder structure: `components/`, `pages/`, `context/`, `utils/`, `store/`, `routes/` with `__tests__/` stubs
- Zustand store stub (`useAppStore.ts`)
- React Router v6 root router with one stub route
- Ant Design install (no config beyond install)
- styled-components install + inline convention enforced via stub
- Jest + jsdom + `@testing-library/react` + `ts-jest` configuration
- Stub test files (one per directory, all passing)
- `@centry/shared` as workspace dependency

### Out of Scope
- FilterBar, LogStream, LogRow, LogDetailDrawer components — M3 feature step
- Ant Design theme customization / `ConfigProvider` — deferred to M3
- Global styled-components `ThemeProvider` — deferred to M3
- Live tail, polling, TanStack Query setup — deferred to M3
- E2E / integration tests — deferred to M3/M4
- ESLint / Prettier configuration — deferred (handled at monorepo root if needed)
- Storybook or component playground — not in MVP

### Prohibitions
- SHALL NOT use vitest in `packages/frontend` — Jest is the chosen test runner for frontend
- SHALL NOT define styled components outside component function bodies — inline pattern is the project convention
- SHALL NOT introduce any feature-specific UI components in the scaffold step
- SHALL NOT add project-level CSS files or global style resets at scaffold stage

### Testing Approach
- **Selective TDD** — Jest harness is configured as part of the scaffold; stub tests verify the harness works. Actual component/feature tests are written during M3 implementation alongside the components themselves.

### Branch
- No new branch created (`--no-commit`). Scaffold work continues on the current branch (`feature/backend-foundation`) or a branch the developer cuts before starting M3 implementation.
