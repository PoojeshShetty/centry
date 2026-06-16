# Task 4 Completion: React layer and public API

## Summary
Created `ErrorBoundary` class component and `useLogger` hook, then wired up the public `index.ts` exporting all four public symbols. Also updated `tsconfig.json` and `vitest.config.ts` to enable JSX/TSX support, and added `react`/`react-dom` devDependencies needed for `@testing-library/react`.

## Commits
- `3b7d010` feat(sdk-react): implement React layer and public API (FR-08, FR-09)

## Deviations
- **Rule 1: Bug** — `xhr.ts` had `boolean | undefined` type error on `originalOpen.call` spread that was hidden before DOM lib was added to tsconfig. Fixed by extracting `async` with default `true` before spreading.

## Difficulties
- `tsconfig.json` lacked `jsx` and DOM lib settings, causing TSX and DOM-type compilation to fail. Added `"jsx": "react-jsx"` and `"lib": ["ES2022", "DOM", "DOM.Iterable"]`.
- `react` and `react-dom` were only listed as peerDependencies, not devDependencies, so `@testing-library/react` couldn't resolve them. Installed both as devDependencies.
- Vitest needed `esbuild.jsx: "automatic"` to transform TSX files without `@vitejs/plugin-react`.
