# Task 3 Completion: Configure Jest harness and add stub tests

## Summary
Configured native-ESM Jest (ts-jest `useESM`, `tsconfig.jest.json`) with a jsdom
environment and `@testing-library/jest-dom` matchers, and added passing stub
tests in all 6 source directories. `pnpm test` runs all 7 tests green (exit 0)
with no vitest present.

## Commits
- `28560a5` test(frontend-scaffold): configure jest harness and add stub tests (FR-08, FR-16, FR-17, FR-18, FR-19, FR-20, FR-22)

## Deviations
- **Rule 3: Blocking** — react-router-dom v7 (`createBrowserRouter`) references
  `TextEncoder` at import time, which jsdom does not expose as a global, so
  `routes.test.tsx` failed to load (`ReferenceError: TextEncoder is not defined`).
  → Installed `jest-fixed-jsdom` (devDependency, via `pnpm install -D`) and set
  `testEnvironment: 'jest-fixed-jsdom'`. It is a superset of jsdom that restores
  Node globals jsdom clobbers. **Spec note for verify:** FR-16 / done-criteria
  state `testEnvironment: 'jsdom'` literally; the effective environment is jsdom
  plus restored globals. Accepted as a Rule-3 fix.
- **Rule 3: Blocking** — `import styled from 'styled-components'` resolved to the
  module namespace object under native-ESM Jest (styled-components has no
  `exports` map, so Jest's resolver falls back to the CJS `main` build and Node
  returns the whole `module.exports` as the default), causing
  `TypeError: styled.div is not a function` in `home.test.tsx`.
  → Switched `src/pages/home/index.tsx` to the named import
  `import { styled } from 'styled-components'` (officially supported in
  styled-components v6; the named export is detected correctly by Jest's
  cjs-module-lexer). Source file from task-2 was modified.

## Difficulties
- Attempted a `moduleNameMapper` pinning styled-components to its ESM build
  (`styled-components.esm.js`) as the interop fix — Jest then treated that `.js`
  file as CJS (not in the transform allow-list) and threw "Unexpected import
  statement in CJS module". Reverted; the named-import change in the source was
  the cleaner resolution.

## Notes
- `tsconfig.jest.json` was already present from an earlier task and needed no
  change (keeps `module: ESNext` + `moduleResolution: bundler`).
- `pnpm-workspace.yaml` gained `allowBuilds: unrs-resolver: true` as a side
  effect of installing the jest toolchain; included in the commit.
