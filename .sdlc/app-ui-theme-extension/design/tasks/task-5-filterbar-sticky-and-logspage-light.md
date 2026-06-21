# Task 5: Fix FilterBar sticky positioning and update FilterBar + LogsPage to light theme

## Trace
- **FR-IDs:** FR-08, FR-09
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/logs/FilterBar.tsx` — modify
- `packages/frontend/src/pages/logs/index.tsx` — modify
- `packages/frontend/src/pages/logs/__tests__/FilterBar.test.tsx` — update (position: sticky assertion replaces fixed-position assertion)
- `packages/frontend/src/pages/logs/__tests__/LogsPage.test.tsx` — update if it asserts background or layout

## Design References
- design.md §Architecture (FilterBar.tsx, LogsPage)
- design.md §Interface Contracts (FilterBar CSS contract, LogsPage CSS contract)

## Acceptance Criteria

### FR-08: FilterBar — sticky within content, does not cover sidebar
- GIVEN the user is on any page that renders `FilterBar`
- WHEN the user scrolls the log list
- THEN `FilterBar` SHALL remain visible at the top of the content column
- AND the sidebar SHALL remain fully visible and clickable at all times

- GIVEN `FilterBar` after this change
- WHEN rendered
- THEN its CSS `position` SHALL be `sticky` (not `fixed`)
- AND its `top` SHALL be `0` relative to the scrollable content column, not the viewport
- AND `left` and `right` fixed offsets SHALL be removed

### FR-09: FilterBar and LogsPage light theme
- GIVEN the user is viewing the log stream
- WHEN `FilterBar` renders
- THEN its background SHALL use `theme.app.surface` (light) not `theme.bg.surface` (dark `#161616`)
- AND pill/button text SHALL be dark and legible against the light background

## Done Criteria
- [ ] `FilterBar` `Bar` styled-component: `position: sticky; top: 0` — `left: 0; right: 0` removed
- [ ] `FilterBar` `Bar` background changed from `theme.bg.surface` to `theme.app.surface`
- [ ] `FilterBar` `Bar` border-bottom changed from `theme.border.subtle` to `theme.app.border`
- [ ] `FilterBar` `Pill` active/inactive colors updated to use `theme.app.*` and `theme.auth.accent` for active
- [ ] `FilterBar` `SearchInput` border uses `theme.app.border`; focus uses `theme.auth.accent`
- [ ] `FilterBar` `PresetBtn` border and hover use `theme.app.border` and `theme.auth.accent`
- [ ] `LogsPage` outer `Page` wrapper: `overflow-y: auto` added
- [ ] `LogsPage` background uses `theme.app.bg`
- [ ] `FilterBar.test.tsx` asserts `position: sticky` (not `fixed`)
- [ ] All pre-existing FilterBar and LogsPage tests pass
- [ ] TypeScript compiles with no errors
