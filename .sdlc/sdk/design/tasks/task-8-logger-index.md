# Task 8: Implement logger methods and wire public API in index.ts

## Trace
- **FR-IDs:** FR-02, FR-09
- **Depends on:** task-7
- **Design:** ../design.md

## Files
- `packages/sdk/src/logger.ts` — create
- `packages/sdk/src/logger.test.ts` — create
- `packages/sdk/src/index.ts` — modify (replace stub export with public API re-exports)

## Design References
- design.md §Architecture (logger.ts, index.ts components)
- design.md §Interface Contracts (logger methods, Public API)

## Contracts (task-specific)

### Internal Interfaces
- `logger.trace(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void` — calls `captureLog('trace', 1, ...)`
- `logger.debug(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void` — calls `captureLog('debug', 5, ...)`
- `logger.info(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void` — calls `captureLog('info', 9, ...)`
- `logger.warn(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void` — calls `captureLog('warn', 13, ...)`
- `logger.error(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void` — calls `captureLog('error', 17, ...)`
- `logger.fatal(template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void` — calls `captureLog('fatal', 21, ...)`

### Public API (index.ts exports)
- `init` — from `./init`
- `logger` — from `./logger`
- `traceMiddleware` — from `./context`
- `SdkConfig` — type, from `./init`
- `LogItem` — type, re-exported from `@centry/shared`

## Acceptance Criteria

### FR-02: Logger methods

**All levels:**
- GIVEN the SDK is initialised
- WHEN each of `trace/debug/info/warn/error/fatal` is called
- THEN `captureLog` SHALL be called with severity numbers `1/5/9/13/17/21` respectively

**Correct forwarding:**
- GIVEN `logger.error('Payment failed for %s', ['ORD-99'], { 'payment.code': 'declined' })` is called
- THEN `captureLog` SHALL be called with `level: 'error'`, `severityNumber: 17`, `template: 'Payment failed for %s'`, `params: ['ORD-99']`, `attributes: { 'payment.code': 'declined' }`

**Public API shape:**
- GIVEN `import { init, logger, traceMiddleware } from '@centry/sdk'`
- THEN all three SHALL be importable and callable without TypeScript errors

### FR-09: SDK never throws

- GIVEN any `logger.*` call
- WHEN an internal error occurs
- THEN no exception SHALL propagate to the caller

## Done Criteria
- [ ] `logger` object has exactly six methods: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- [ ] Each method calls `captureLog` with the correct level string and severity number
- [ ] `index.ts` exports `init`, `logger`, `traceMiddleware`, `SdkConfig` (type), `LogItem` (type)
- [ ] `import { init, logger, traceMiddleware } from '@centry/sdk'` resolves without TypeScript errors
- [ ] `pnpm build` succeeds for the `@centry/sdk` package
- [ ] All `logger.test.ts` cases pass
