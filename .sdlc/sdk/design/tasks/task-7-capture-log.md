# Task 7: Implement captureLog pipeline

## Trace
- **FR-IDs:** FR-03, FR-04, FR-09
- **Depends on:** task-1, task-2, task-3, task-6
- **Design:** ../design.md

## Files
- `packages/sdk/src/captureLog.ts` — create
- `packages/sdk/src/captureLog.test.ts` — create

## Design References
- design.md §Architecture (captureLog.ts component)
- design.md §Data Models (LogItem — re-exported from @centry/shared)
- design.md §Interface Contracts (captureLog)

## Contracts (task-specific)

### Internal Interfaces
- `captureLog(level: string, severityNumber: number, template: string, params?: unknown[], attributes?: Record<string, unknown>) -> void`
  - Pipeline (in order):
    1. Read `enableLogs` from `getConfig()` — return early if `false`
    2. Interpolate `template + params` into `body` (replace `%s` placeholders sequentially with `params[i]`)
    3. If `severityNumber >= 17`: call `parseStack(new Error().stack)` and attach as `attributes["error.stack_frames"]` (JSON-stringified array)
    4. Read `traceId` / `spanId` from `traceStore.getStore()` (undefined-safe — may be undefined outside middleware)
    5. Build SDK default attributes: `sentry.sdk.name`, `sentry.sdk.version`, `server.address` (via `os.hostname()`), `sentry.environment`, `sentry.release`, `sentry.message.template`, `sentry.message.parameter.N` for each param
    6. Merge: `{ ...sdkAttrs, ...userAttrs }` (user-provided attributes win on key clash)
    7. Assemble `LogItem` with `timestamp: Date.now()`, `level`, `severity_number`, `body`, `trace_id`, `span_id`, `attributes`
    8. Pass `logItem` through `beforeSendLog` hook if configured — if hook returns `null`, drop silently
    9. Call `buffer.push(logItem)`

## Acceptance Criteria

### FR-03: captureLog pipeline

**enableLogs gate:**
- GIVEN `init({ dsn, enableLogs: false })`
- WHEN `captureLog('info', 9, 'msg')` is called
- THEN `buffer.push` SHALL NOT be called

**Template interpolation:**
- GIVEN `template = 'User %s logged in'`, `params = ['john']`
- WHEN `captureLog` runs
- THEN `logItem.body` SHALL be `'User john logged in'`

**beforeSendLog drop:**
- GIVEN `init({ dsn, beforeSendLog: () => null })`
- WHEN `captureLog` runs
- THEN `buffer.push` SHALL NOT be called

**Attribute merge (user wins):**
- GIVEN SDK would set `sentry.sdk.name = '@centry/sdk'` and user passes `{ 'sentry.sdk.name': 'my-override' }`
- WHEN `captureLog` runs
- THEN `logItem.attributes['sentry.sdk.name']` SHALL be `'my-override'`

**SDK default attributes:**
- GIVEN `captureLog` runs with no user attributes
- THEN `logItem.attributes` SHALL contain `sentry.sdk.name`, `sentry.sdk.version`, `server.address`, `sentry.message.template`

### FR-04: Stack trace capture

**error/fatal attach:**
- GIVEN `captureLog('error', 17, 'msg')` is called
- WHEN `captureLog` runs
- THEN `logItem.attributes["error.stack_frames"]` SHALL be a JSON-stringified `StackFrame[]`
- AND frames containing `@centry/sdk` SHALL be stripped

**info/warn no stack:**
- GIVEN `captureLog('info', 9, 'msg')` is called
- WHEN `captureLog` runs
- THEN `logItem.attributes["error.stack_frames"]` SHALL NOT be set

### FR-09: SDK never throws

- GIVEN any call to `captureLog`
- WHEN an internal error occurs
- THEN no exception SHALL propagate to the caller

## Done Criteria
- [ ] `captureLog` returns early (no buffer push) when `enableLogs` is `false`
- [ ] `%s` placeholders in template are replaced with corresponding `params` values
- [ ] `error.stack_frames` attribute is set (JSON-stringified) for severityNumber >= 17
- [ ] `error.stack_frames` is NOT set for severityNumber < 17
- [ ] `traceId` and `spanId` are included in `LogItem` when AsyncLocalStorage context is active
- [ ] SDK default attributes (`sentry.sdk.name`, `sentry.sdk.version`, `server.address`, `sentry.message.template`) are present
- [ ] User-provided attributes override SDK defaults on key clash
- [ ] `beforeSendLog` returning `null` prevents buffer push
- [ ] All `captureLog.test.ts` cases pass
