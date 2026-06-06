# Task 2: Create packages/shared with canonical types and parseEnvelope

## Trace
- **FR-IDs:** FR-04, FR-05, FR-08, FR-09
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/shared/package.json` — create
- `packages/shared/tsconfig.json` — create
- `packages/shared/src/index.ts` — create

## Design References
- design.md §Data Models (SeverityLevel, Attribute, LogItem, EnvelopeHeader, Envelope, EnvelopeParseError, parseEnvelope)
- design.md §Architecture (packages/shared component)
- design.md §Interface Contracts (Internal Interfaces — @centry/shared export surface)
- design.md §Design Decisions (parseEnvelope error behavior, TypeScript compiled output location, Package naming scope)

## Contracts (task-specific)

### Internal Interfaces
- `@centry/shared` export surface:
  - `SeverityLevel` enum: `DEBUG | INFO | WARN | ERROR | FATAL` (string values)
  - `Attribute` type: `Record<string, string | number | boolean>`
  - `LogItem` interface: `{ timestamp: string; severity: SeverityLevel; message: string; attributes?: Attribute }`
  - `EnvelopeHeader` interface: `{ sdk_version: string; sent_at: string; source: string }`
  - `Envelope` interface: `{ header: EnvelopeHeader; items: LogItem[] }`
  - `EnvelopeParseError` class: extends `Error`
  - `parseEnvelope(raw: unknown): Envelope` — stub; throws `EnvelopeParseError('Not implemented')`
- `packages/shared/package.json`: `name: "@centry/shared"`, `exports: { ".": "./src/index.ts" }`, `scripts: { build, dev }`
- `packages/shared/tsconfig.json`: extends `../../tsconfig.base.json`, `outDir: dist`, `rootDir: src`

## Acceptance Criteria

### FR-04: Shared types resolution
- GIVEN `packages/shared` exports `LogItem`, `parseEnvelope`, and `SeverityLevel`
- WHEN any of `packages/sdk`, `packages/backend`, or `packages/frontend` imports from `@centry/shared`
- THEN TypeScript resolves the types without errors
- AND no `any` types are introduced by the import

### FR-08: Stubs only
- GIVEN `packages/shared/src/index.ts`
- WHEN read
- THEN `parseEnvelope` contains no real parsing logic — only throws `EnvelopeParseError('Not implemented')`

## Done Criteria
- [ ] `packages/shared/src/index.ts` exports all 7 items: `SeverityLevel`, `Attribute`, `LogItem`, `EnvelopeHeader`, `Envelope`, `EnvelopeParseError`, `parseEnvelope`
- [ ] `SeverityLevel` is an enum with string values `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`
- [ ] `parseEnvelope` throws `EnvelopeParseError('Not implemented')` and has return type `Envelope`
- [ ] `packages/shared/package.json` has `name: "@centry/shared"` and `exports` pointing to `./src/index.ts`
- [ ] `packages/shared/tsconfig.json` extends `../../tsconfig.base.json` and sets `outDir: "dist"`
- [ ] `tsc --build packages/shared` completes with zero type errors
- [ ] Dependency added via `pnpm add` (no hand-written version strings)
