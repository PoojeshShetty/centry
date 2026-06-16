# Task 4: React layer and public API

## Trace
- **FR-IDs:** FR-08, FR-09
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/sdk-react/src/react/ErrorBoundary.tsx` — create
- `packages/sdk-react/src/react/useLogger.ts` — create
- `packages/sdk-react/src/index.ts` — create
- `packages/sdk-react/src/react/tests/ErrorBoundary.test.tsx` — create
- `packages/sdk-react/src/react/tests/useLogger.test.ts` — create

## Design References
- design.md §Architecture (`react/ErrorBoundary.tsx`, `react/useLogger.ts`)
- design.md §Interface Contracts (Public API: `ErrorBoundary`, `useLogger`)
- design.md §Design Decisions (Test runner: Vitest + jsdom; `@testing-library/react` for component tests)

## Contracts (task-specific)

### Internal Interfaces
- `ErrorBoundary` React class component
  - Props: `fallback?: ReactNode; children: ReactNode`
  - Post: on child render error → calls `logger.fatal(error.message, [], { 'error.component_stack': componentStack })`; renders `fallback` if provided, else `<p>Something went wrong.</p>`

- `useLogger(componentName: string): typeof logger`
  - Post: returns a logger-shaped object where every method call auto-merges `{ 'component.name': componentName }` into the attributes argument
  - Stable ref: memoised via `useMemo` on `componentName` — same reference returned across re-renders when `componentName` is unchanged

### Public exports from `index.ts`
- `init`
- `logger`
- `ErrorBoundary`
- `useLogger`
- `SdkReactConfig` (type)

## Acceptance Criteria

### FR-08: ErrorBoundary catches render errors
- GIVEN a child component throws an error during render
- WHEN it is wrapped in `<ErrorBoundary fallback={<p>Oops</p>}>`
- THEN `logger.fatal` is called with the error message and `{ 'error.component_stack': componentStack }`
- AND the fallback UI (`<p>Oops</p>`) is rendered instead of crashing

### FR-08: ErrorBoundary default fallback
- GIVEN no `fallback` prop is provided
- WHEN a child throws
- THEN `<p>Something went wrong.</p>` is rendered

### FR-09: useLogger auto-tags component name
- GIVEN `const log = useLogger('PaymentForm')`
- WHEN `log.info('msg')` is called
- THEN the resulting `LogItem.attributes` includes `component.name='PaymentForm'`

### FR-09: useLogger stable reference
- GIVEN the parent component re-renders with the same `componentName`
- THEN `useLogger` returns the same object reference (no unnecessary re-creation)

## Done Criteria
- [ ] `ErrorBoundary` renders `fallback` on child error
- [ ] `ErrorBoundary` renders `<p>Something went wrong.</p>` when no `fallback` prop
- [ ] `ErrorBoundary` calls `logger.fatal` with error message and `error.component_stack` attribute
- [ ] `useLogger('PaymentForm').info('msg')` results in a `LogItem` with `component.name: 'PaymentForm'` in attributes
- [ ] `useLogger` returns same object reference across re-renders with same `componentName`
- [ ] `packages/sdk-react/src/index.ts` exports `init`, `logger`, `ErrorBoundary`, `useLogger`, and `SdkReactConfig` type
- [ ] All React layer tests pass (`pnpm --filter @centry/sdk-react test`)
- [ ] `pnpm build` succeeds with sdk-react included in project references
