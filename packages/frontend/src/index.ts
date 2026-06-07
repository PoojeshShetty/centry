/**
 * @centry/frontend — log viewer UI package.
 *
 * Package barrel satisfying the `exports` entry. The real app runtime path is
 * `index.html` → `src/main.tsx`; this re-export keeps the package shape uniform
 * with the other monorepo packages.
 */
export { default as App } from './App'
