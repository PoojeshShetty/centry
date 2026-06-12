# Task 7: Frontend — LogStream, LogRow, LogDetailDrawer, LogsPage wiring, empty/error states, and ProjectDetailPanel link

## Trace
- **FR-IDs:** FR-14, FR-15, FR-16, FR-18, FR-12
- **Depends on:** task-6
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/logs/LogStream.tsx` — create
- `packages/frontend/src/pages/logs/LogRow.tsx` — create
- `packages/frontend/src/pages/logs/LogDetailDrawer.tsx` — create
- `packages/frontend/src/pages/logs/index.tsx` — modify
- `packages/frontend/src/pages/projects/ProjectDetailPanel.tsx` — modify
- `packages/frontend/src/pages/logs/__tests__/LogRow.test.tsx` — create
- `packages/frontend/src/pages/logs/__tests__/LogStream.test.tsx` — create
- `packages/frontend/src/pages/logs/__tests__/LogDetailDrawer.test.tsx` — create
- `packages/frontend/src/pages/logs/__tests__/LogsPage.test.tsx` — create
- `packages/frontend/src/pages/projects/__tests__/ProjectDetailPanel.test.tsx` — update (interface change)

## Design References
- design.md §Architecture (LogStream, LogRow, LogDetailDrawer components)
- design.md §Design Decisions (Virtualisation library: @tanstack/react-virtual)
- design.md §Data Flow (Frontend render path)

## Contracts (task-specific)

### Internal Interfaces
- `LogRow({ log: LogItem, onClick: (log: LogItem) => void })`
  - Pre: `log` is a valid `LogItem`
  - Post: renders relative timestamp, colour-coded level badge, and body; calls `onClick` on click

- `LogDetailDrawer({ log: LogItem | null, onClose: () => void })`
  - Pre: `log` is the selected log or `null` (closed)
  - Post: shows body, attributes table, trace_id/span_id with copy; closes on Esc or outside-click

- `LogStream({ logs: LogItem[], hasMore: boolean, onLoadMore: () => void, onRowClick: (log: LogItem) => void })`
  - Pre: `logs` is the current page accumulation
  - Post: renders virtualised list; triggers `onLoadMore` when scroll approaches bottom

## Acceptance Criteria

### FR-14: LogStream virtualisation
- GIVEN 200 log records are returned
- WHEN the page renders
- THEN only the visible rows SHALL be in the DOM (virtualised via `@tanstack/react-virtual`)
- AND scrolling to the bottom SHALL trigger loading the next page

### FR-15: LogRow level colours
- GIVEN a log with `level = "error"`
- WHEN it is rendered as a `LogRow`
- THEN the level badge SHALL be red
- AND level colour mapping: trace=gray, debug=purple, info=blue, warn=amber, error=red, fatal=dark-red

### FR-16: LogDetailDrawer
- GIVEN a `LogRow` is clicked
- WHEN the drawer opens
- THEN it SHALL display the body, attributes key/value table, and `trace_id`/`span_id` with copy-to-clipboard
- AND pressing Esc SHALL close the drawer
- AND clicking outside the drawer SHALL close it

### FR-18: Empty state
- GIVEN no logs match the current filters
- THEN the page SHALL show "No logs found"

### FR-18: Error state
- GIVEN the API call fails
- THEN the page SHALL show "Failed to load — retry" with a retry button

### FR-12: ProjectDetailPanel link
- GIVEN the user is on the ProjectDetailPanel
- WHEN they click "View Logs"
- THEN they are navigated to `/projects/:projectId/logs`

## Done Criteria
- [ ] `LogStream` uses `useVirtualizer` from `@tanstack/react-virtual` to render only visible rows
- [ ] `LogStream` fires `onLoadMore` when scroll position is within ~200px of the bottom and `hasMore` is true
- [ ] `LogRow` displays: relative timestamp (ISO 8601 on hover), level badge with correct colour, log body truncated to one line
- [ ] Level badge colours match spec: trace=gray, debug=purple, info=blue, warn=amber, error=red, fatal=dark-red
- [ ] `LogDetailDrawer` is a right-side drawer showing full body, attributes table, trace_id + span_id copy buttons, raw-JSON toggle
- [ ] `LogDetailDrawer` closes on Esc keypress and on outside-click
- [ ] `LogsPage` renders `FilterBar` + `LogStream` together; passes selected log to `LogDetailDrawer`
- [ ] `LogsPage` shows "No logs found" when `logs.length === 0` and not loading
- [ ] `LogsPage` shows "Failed to load — retry" with retry button when `error` is set in store
- [ ] `ProjectDetailPanel` includes a "View Logs" button/link that navigates to `paths.projectLogs(project.id)`
- [ ] `@tanstack/react-virtual` installed via `pnpm --filter @centry/frontend add @tanstack/react-virtual`
- [ ] All component tests pass: LogRow colours, LogDetailDrawer open/close/Esc, LogsPage empty+error states
