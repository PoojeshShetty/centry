# Task 3: Implement AsyncLocalStorage context and traceMiddleware

## Trace
- **FR-IDs:** FR-08
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/sdk/src/context.ts` — create
- `packages/sdk/src/context.test.ts` — create

## Design References
- design.md §Architecture (context.ts component)
- design.md §Data Models (TraceContext)
- design.md §Interface Contracts (traceStore, traceMiddleware)
- design.md §Design Decisions (AsyncLocalStorage: single exported singleton)

## Contracts (task-specific)

### Internal Interfaces
- `traceStore: AsyncLocalStorage<TraceContext>` — singleton exported from `context.ts`

- `traceMiddleware(req: Request, res: Response, next: NextFunction) -> void`
  - Reads incoming `sentry-trace` header (`<traceId>-<spanId>-<sampled>`)
  - If present: reuse `traceId`, generate fresh 16-hex `spanId`
  - If absent: generate fresh 32-hex `traceId` and 16-hex `spanId`
  - Runs `next()` inside `traceStore.run({ traceId, spanId }, next)`
  - Sets outgoing response header `sentry-trace: <traceId>-<spanId>-1`

## Acceptance Criteria

### FR-08: traceMiddleware

**Incoming sentry-trace header:**
- GIVEN an incoming request with header `sentry-trace: abc123def456-00f067aa0ba902fc-1`
- WHEN the middleware runs
- THEN `traceStore.getStore().traceId` SHALL be `"abc123def456"`
- AND a new `spanId` SHALL be generated (SHALL NOT be `"00f067aa0ba902fc"`)

**No incoming header:**
- GIVEN an incoming request with no `sentry-trace` header
- WHEN the middleware runs
- THEN a fresh 32-hex `traceId` and 16-hex `spanId` SHALL be generated
- AND the outgoing response SHALL have a `sentry-trace` header set

**Context propagation:**
- GIVEN `traceMiddleware` has run
- WHEN `traceStore.getStore()` is called inside the request handler
- THEN it SHALL return `{ traceId, spanId }`

## Done Criteria
- [ ] `traceStore` is an `AsyncLocalStorage<TraceContext>` singleton exported from `context.ts`
- [ ] `traceMiddleware` reuses `traceId` from incoming header and generates new `spanId`
- [ ] `traceMiddleware` generates fresh 32-hex `traceId` and 16-hex `spanId` when no header present
- [ ] Outgoing `sentry-trace` response header is set in both cases
- [ ] Context is accessible via `traceStore.getStore()` inside the `next()` call chain
- [ ] All `context.test.ts` cases pass
