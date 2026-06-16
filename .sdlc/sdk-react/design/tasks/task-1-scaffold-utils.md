# Task 1: Scaffold package and utilities

## Trace
- **FR-IDs:** FR-01, FR-02
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/sdk-react/package.json` — create
- `packages/sdk-react/tsconfig.json` — create
- `packages/sdk-react/vitest.config.ts` — create
- `packages/sdk-react/src/types.ts` — create
- `packages/sdk-react/src/utils/constants.ts` — create
- `packages/sdk-react/src/utils/parseDsn.ts` — create
- `packages/sdk-react/src/utils/stackTrace.ts` — create
- `packages/sdk-react/src/transport/urls.ts` — create
- `packages/sdk-react/src/utils/tests/parseDsn.test.ts` — create
- `packages/sdk-react/src/utils/tests/stackTrace.test.ts` — create
- `tsconfig.json` (root) — modify (add sdk-react to project references)

## Design References
- design.md §Architecture (`packages/sdk-react` component, `utils/parseDsn.ts`, `utils/stackTrace.ts`, `utils/constants.ts`, `transport/urls.ts`, `types.ts`)
- design.md §Data Models (`SdkReactConfig`, `ParsedDsn`, `ResolvedConfig`, `StackFrame`)
- design.md §Design Decisions (Copy utils vs import from @centry/sdk)

## Contracts (task-specific)

### Internal Interfaces
- `parseDsn(dsn: string): ParsedDsn`
  - Pre: valid DSN URL with username segment (e.g. `http://key@host/42`)
  - Post: returns `{ publicKey, host, projectId }`
  - Errors: throws `Error` with descriptive message on malformed DSN (caught by `init()`)

- `envelopeUrl(config: ResolvedConfig): string`
  - Returns: `http(s)://<host>/api/<projectId>/envelope/`

- `parseStack(stack: string): StackFrame[]`
  - Post: frames from `@centry/sdk-react` internal files filtered out; returns `[]` on falsy input

## Acceptance Criteria

### FR-01: Workspace package
- GIVEN the monorepo root
- WHEN `pnpm install` runs
- THEN `@centry/sdk-react` resolves as a workspace package with `packages/sdk-react` as its root

### FR-02: DSN parsing — happy path
- GIVEN a valid DSN `'http://key@host/42'`
- WHEN `parseDsn()` is called
- THEN `publicKey` equals `'key'`, `host` equals `'host'`, `projectId` equals `'42'`
- AND `envelopeUrl(config)` returns `'http://host/api/42/envelope/'`

### FR-02: DSN parsing — failure path
- GIVEN a malformed DSN (e.g. `'not-a-dsn'`)
- WHEN `parseDsn()` is called
- THEN it throws an `Error` with a descriptive message

## Done Criteria
- [ ] `packages/sdk-react/package.json` exists with name `@centry/sdk-react`, `"type": "module"`, `peerDependencies` for `react`, workspace dep on `@centry/shared`
- [ ] `packages/sdk-react/tsconfig.json` extends `../../tsconfig.base.json` with `composite: true`
- [ ] Root `tsconfig.json` references `packages/sdk-react`
- [ ] `vitest.config.ts` sets `environment: 'jsdom'`
- [ ] `parseDsn('http://key@host/42')` returns `{ publicKey: 'key', host: 'host', projectId: '42' }`
- [ ] `parseDsn('not-a-dsn')` throws
- [ ] `parseStack` filters out frames containing `@centry/sdk-react`
- [ ] `envelopeUrl` returns correct URL
- [ ] All `parseDsn` and `parseStack` unit tests pass (`pnpm --filter @centry/sdk-react test`)
