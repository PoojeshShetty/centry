# Task 2: Scaffold source structure, routing, store, and UI libraries

## Trace
- **FR-IDs:** FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-21, FR-23
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/frontend/src/main.tsx` — create
- `packages/frontend/src/App.tsx` — create
- `packages/frontend/src/index.ts` — create (barrel re-exporting `App`, satisfies `exports`)
- `packages/frontend/src/routes/index.tsx` — create
- `packages/frontend/src/pages/home/index.tsx` — create
- `packages/frontend/src/pages/not-found/index.tsx` — create
- `packages/frontend/src/store/useAppStore.ts` — create
- `packages/frontend/src/components/.gitkeep` — create (marks directory)
- `packages/frontend/src/context/.gitkeep` — create (marks directory)
- `packages/frontend/src/utils/.gitkeep` — create (marks directory)

## Design References
- design.md §Architecture (src/main.tsx, src/App.tsx, src/index.ts, src/routes/index.tsx, src/pages/*, src/store/useAppStore.ts, src/components|context|utils)
- design.md §Design Decisions (Keep `"type": "module"` + `exports` — `src/index.ts` barrel re-exports `App`)
- design.md §Data Flow
- design.md §Data Models (AppState)
- design.md §Design Decisions (Modern React Router v6: createBrowserRouter + RouterProvider)
- design.md §Design Decisions (Styled components defined inline in component body)
- design.md §Design Decisions (Install packages via `pnpm install <package>`)

## Contracts (task-specific)

### Internal Interfaces
- `useAppStore() -> AppState & actions`:
  - `state.ready: boolean`
  - `state.theme: 'light' | 'dark'`
  - `setTheme(t: 'light' | 'dark'): void`
  - Pre: Zustand installed; function called inside a React component or test
  - Post: returns current state slice and setter; calling `setTheme` updates `theme` in store

- `createBrowserRouter([...]) -> router` (in `src/routes/index.tsx`):
  - Routes: `{ path: '/', element: <HomePage /> }`, `{ path: '*', element: <NotFoundPage /> }`
  - Pre: `react-router-dom` installed
  - Post: router instance exported and consumed by `<RouterProvider>` in `src/App.tsx`

- `App` (default export of `src/App.tsx`):
  - Renders `<RouterProvider router={router} />`
  - Post: re-exported from `src/index.ts` (the `exports` entry) and mounted by `src/main.tsx`

## Acceptance Criteria

### FR-05: src/ top-level folders
- GIVEN `packages/frontend/src/`
- WHEN listed
- THEN it SHALL contain exactly `components/`, `pages/`, `context/`, `utils/`, `store/`, `routes/`

### FR-06: Page co-location convention
- GIVEN `src/pages/home/index.tsx`
- WHEN read
- THEN the page component SHALL be the default export and be co-located with any page-specific files

### FR-07: src/components for shared components only
- GIVEN `src/components/`
- WHEN reviewed
- THEN it SHALL contain only shared/cross-page components — no page-specific code

### FR-09: Zustand store stub
- GIVEN `src/store/useAppStore.ts`
- WHEN imported in a component or test
- THEN it SHALL export a typed Zustand hook with `ready: boolean` and `theme: 'light' | 'dark'` fields
- AND `pnpm build` SHALL compile without type errors

### FR-10–FR-11: Routing
- GIVEN `pnpm dev` running
- WHEN browser navigates to `/`
- THEN `HomePage` SHALL render with no console errors
- GIVEN an unmatched route
- THEN `NotFoundPage` SHALL render

### FR-12–FR-15: UI library and styling
- GIVEN a component using `styled.div` defined inline in the function body
- WHEN rendered in the browser
- THEN styles SHALL apply correctly with no runtime warnings
- GIVEN any `src/` file
- WHEN scanned for styled-component definitions
- THEN none SHALL be defined outside a component function body (FR-23)

### FR-21: No feature-specific components
- GIVEN `src/` directory
- WHEN scanned
- THEN no FilterBar, LogStream, LogRow, or LogDetailDrawer components SHALL exist

## Done Criteria
- [ ] `src/main.tsx` exists and mounts `<App />` inside `ReactDOM.createRoot`
- [ ] `src/App.tsx` exports a default `App` component rendering `<RouterProvider router={router} />`
- [ ] `src/index.ts` re-exports `App` (satisfies the package `exports` entry)
- [ ] `src/routes/index.tsx` defines `createBrowserRouter` with `/` → `HomePage` and `*` → `NotFoundPage`; router is the default export
- [ ] `src/pages/home/index.tsx` exports a default `HomePage` function component (stub, renders a placeholder)
- [ ] `src/pages/not-found/index.tsx` exports a default `NotFoundPage` function component (stub)
- [ ] `src/store/useAppStore.ts` exports `useAppStore` with `AppState { ready: boolean, theme: 'light' | 'dark' }` and `setTheme` action
- [ ] `src/components/`, `src/context/`, `src/utils/` directories exist (`.gitkeep` or stub file)
- [ ] `src/routes/` directory exists (populated by `routes/index.tsx`)
- [ ] `src/pages/home/` uses an inline `styled` component in at least one element to demonstrate the pattern (FR-14)
- [ ] No styled component defined outside a function body in any `src/` file (FR-23)
- [ ] Packages installed via `pnpm install <pkg>` in `packages/frontend`: `react-router-dom`, `zustand`, `antd`, `styled-components`, `@types/styled-components`
- [ ] `pnpm build` from `packages/frontend` completes with no TypeScript errors
