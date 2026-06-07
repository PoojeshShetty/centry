# Task 3: Configure Jest harness and add stub tests

## Trace
- **FR-IDs:** FR-08, FR-16, FR-17, FR-18, FR-19, FR-20, FR-22
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/frontend/jest.config.js` — create (ESM, `export default`)
- `packages/frontend/jest.setup.ts` — create
- `packages/frontend/src/components/__tests__/components.test.tsx` — create
- `packages/frontend/src/context/__tests__/context.test.ts` — create
- `packages/frontend/src/utils/__tests__/utils.test.ts` — create
- `packages/frontend/src/store/__tests__/useAppStore.test.ts` — create
- `packages/frontend/src/routes/__tests__/routes.test.tsx` — create
- `packages/frontend/src/pages/home/__tests__/home.test.tsx` — create

## Design References
- design.md §Architecture (jest.config.js, jest.setup.ts, all __tests__ stubs)
- design.md §Design Decisions (Native ESM Jest — ts-jest ESM preset)
- design.md §Design Decisions (Jest config as ESM `jest.config.js` (not `.ts`))
- design.md §Design Decisions (`tsconfig.jest.json` stays ESM)
- design.md §Design Decisions (Install packages via `pnpm install <package>`)

## Acceptance Criteria

### FR-08: __tests__ stubs in every directory
- GIVEN each of `components/`, `pages/home/`, `context/`, `utils/`, `store/`, `routes/`
- WHEN listed
- THEN each SHALL contain a `__tests__/` subfolder with at least one stub test file

### FR-16: Jest with jsdom
- GIVEN `jest.config.js`
- WHEN read
- THEN `testEnvironment` SHALL be `jsdom`

### FR-17: @testing-library configured
- GIVEN `jest.setup.ts`
- WHEN imported
- THEN `@testing-library/jest-dom` matchers SHALL be available in all test files

### FR-18: ts-jest ESM transform
- GIVEN a `.tsx` test file importing a React component
- WHEN `pnpm test` is run (`cross-env NODE_OPTIONS=--experimental-vm-modules jest`)
- THEN Jest SHALL compile and execute it without transform errors under native ESM
- AND the ts-jest transform SHALL use `tsconfig.jest.json` with `useESM: true`

### FR-19: pnpm test executes all stub tests
- GIVEN stub test files in each `__tests__/` folder
- WHEN `pnpm test` is run from `packages/frontend`
- THEN Jest SHALL discover and run all `**/__tests__/**/*.test.{ts,tsx}` files

### FR-20: All stub tests pass on first run
- GIVEN no feature code written
- WHEN `pnpm test` is run
- THEN all stub tests SHALL pass with 0 failures

### FR-22: No vitest in packages/frontend
- GIVEN `packages/frontend/package.json` and all config files
- WHEN scanned
- THEN `vitest` SHALL NOT appear as a dependency or in any config

## Done Criteria
- [ ] `jest.config.js` exists as ESM (`export default { ... }`) with `testEnvironment: 'jsdom'`, `setupFilesAfterEnv: ['./jest.setup.ts']`, `extensionsToTreatAsEsm: ['.ts', '.tsx']`, and a ts-jest ESM transform (`useESM: true`) pointing to `tsconfig.jest.json`
- [ ] `jest.config.js` includes `transformIgnorePatterns` allowing `antd` (and ESM-only transitive deps) to be transformed, and a `moduleNameMapper` (`^(\\.{1,2}/.*)\\.js$` → `$1`) to resolve `.js` specifiers under ESM
- [ ] `jest.setup.ts` imports `@testing-library/jest-dom`
- [ ] Stub test files exist in all 6 locations: `src/components/__tests__/`, `src/context/__tests__/`, `src/utils/__tests__/`, `src/store/__tests__/`, `src/routes/__tests__/`, `src/pages/home/__tests__/`
- [ ] Each stub test file contains at least one passing `it()` / `test()` assertion that verifies the test harness resolves imports from that directory
- [ ] `pnpm test` from `packages/frontend` exits with code 0 and reports 0 failures
- [ ] No `vitest` in `packages/frontend/package.json` dependencies or devDependencies (FR-22)
- [ ] Packages installed via `pnpm install <pkg>` in `packages/frontend`: `jest`, `ts-jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/jest` (`cross-env` installed in task-1)
