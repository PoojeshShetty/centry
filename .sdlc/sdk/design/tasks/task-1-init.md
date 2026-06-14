# Task 1: Setup Vitest and implement DSN parser + config singleton

## Trace
- **FR-IDs:** FR-01, FR-10
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/sdk/package.json` — modify (add vitest devDependency + test script)
- `packages/sdk/vitest.config.ts` — create
- `packages/sdk/src/init.ts` — create
- `packages/sdk/src/init.test.ts` — create

## Design References
- design.md §Architecture (init.ts component)
- design.md §Data Models (ParsedDsn, SdkConfig, ResolvedConfig)
- design.md §Interface Contracts (parseDsn, init, getConfig)
- design.md §Design Decisions (Config singleton: module-level variable + getConfig())

## Contracts (task-specific)

### Internal Interfaces
- `parseDsn(dsn: string) -> ParsedDsn`
  - Pre: DSN is a URL string
  - Post: returns `{ publicKey, host, projectId }`; throws with descriptive message if username/publicKey is empty or URL is malformed

- `init(options: SdkConfig) -> void`
  - Pre: none
  - Post: if already initialised, calls `console.warn` and returns; otherwise parses DSN and stores `ResolvedConfig` singleton

- `getConfig() -> ResolvedConfig`
  - Pre: none
  - Post: returns singleton if initialised; throws `"call init() before using logger"` if not

## Acceptance Criteria

### FR-01: DSN parsing and config singleton

**Happy path:**
- GIVEN a valid DSN `https://abc123@localhost:3000/proj-uuid`
- WHEN `init({ dsn })` is called
- THEN `getConfig()` SHALL return an object containing `{ publicKey: "abc123", host: "localhost:3000", projectId: "proj-uuid" }`

**Failure path:**
- GIVEN a DSN missing the username segment
- WHEN `init({ dsn })` is called
- THEN the SDK SHALL throw at init time with a descriptive error message

**Pre-init guard:**
- GIVEN `getConfig()` is called before `init()`
- THEN it SHALL throw `"call init() before using logger"`

### FR-10: Init idempotency

- GIVEN `init(optionsA)` has been called
- WHEN `init(optionsB)` is called a second time
- THEN the config SHALL remain unchanged (optionsA still active)
- AND `console.warn` SHALL be called

## Done Criteria
- [ ] `pnpm --filter @centry/sdk test` runs without error (Vitest wired up)
- [ ] `parseDsn('https://abc123@localhost:3000/proj-uuid')` returns `{ publicKey: 'abc123', host: 'localhost:3000', projectId: 'proj-uuid' }`
- [ ] `parseDsn` throws on missing publicKey
- [ ] `getConfig()` before `init()` throws `"call init() before using logger"`
- [ ] Second `init()` call is a no-op and emits `console.warn`
- [ ] All `init.test.ts` cases pass
