# Task 6: Implement log buffer with flush triggers, hard cap, and signal handlers

## Trace
- **FR-IDs:** FR-05, FR-09
- **Depends on:** task-4, task-5
- **Design:** ../design.md

## Files
- `packages/sdk/src/buffer.ts` — create
- `packages/sdk/src/buffer.test.ts` — create

## Design References
- design.md §Architecture (buffer.ts component)
- design.md §Interface Contracts (buffer.push, buffer.flush)
- design.md §Design Decisions (Signal handling: process.once + async flush + process.exit(0))

## Contracts (task-specific)

### Internal Interfaces
- `push(item: LogItem) -> void`
  - If buffer length >= 1000: drop item, increment `dropped` counter, return
  - Otherwise: push to internal array; if length reaches 100, call `flush()` immediately

- `flush() -> Promise<void>`
  - Drains current buffer (swap to empty), calls `transport.send(batch)` with the drained batch
  - No-op if buffer is empty

- Timer: `setInterval(flush, 5000)` started once, `.unref()`'d so it never keeps the process alive

- Signal handlers: `process.once('SIGTERM', ...)` and `process.once('SIGINT', ...)` registered once; each awaits `flush()` then calls `process.exit(0)`

## Acceptance Criteria

### FR-05: Buffer flush and cap

**Size trigger (flush at 100):**
- GIVEN 99 items are in the buffer
- WHEN the 100th item is pushed via `push()`
- THEN `flush()` SHALL be called immediately (transport.send receives a batch of 100)

**Hard cap (drop at 1001):**
- GIVEN 1000 items are already in the buffer
- WHEN a 1001st item is pushed
- THEN the item SHALL be dropped
- AND the internal `dropped` counter SHALL increment by 1

**SIGTERM flush:**
- GIVEN items are in the buffer
- WHEN `process.emit('SIGTERM')` is triggered
- THEN `flush()` SHALL be called (transport.send receives remaining items)

**Timer unref:**
- GIVEN the buffer is initialised
- THEN the flush timer SHALL be `.unref()`'d (process can exit naturally without waiting for it)

### FR-09: SDK never throws

- GIVEN `push()` or `flush()` is called
- WHEN an internal error occurs (e.g. transport fails)
- THEN no exception SHALL propagate to the caller

## Done Criteria
- [ ] `push()` triggers `flush()` when buffer reaches 100 items
- [ ] `push()` drops items silently and increments `dropped` counter at 1000-item cap
- [ ] `flush()` drains the buffer atomically (swap-before-send pattern)
- [ ] Flush timer is created with `setInterval` and `.unref()` is called on it
- [ ] `process.once('SIGTERM', ...)` and `process.once('SIGINT', ...)` handlers are registered
- [ ] Signal handlers await `flush()` before calling `process.exit(0)`
- [ ] All `buffer.test.ts` cases pass
