# Task 1: Extend theme.ts with app light token group

## Trace
- **FR-IDs:** FR-01
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/frontend/src/theme.ts` — modify

## Design References
- design.md §Design Decisions (theme.app token values — duplicate from auth palette)

## Acceptance Criteria

### FR-01: Light theme tokens in theme.ts
- GIVEN `theme.ts` after this change
- WHEN a component imports `theme.app.bg`
- THEN it SHALL resolve to `#ffffff`
- AND `theme.app.surface` SHALL resolve to `#f5f7fa`
- AND `theme.app.elevated` SHALL resolve to `#e5e7eb`
- AND `theme.app.border` SHALL resolve to `#d1d5db`
- AND `theme.app.text` SHALL resolve to `#111827`
- AND `theme.app.textSecondary` SHALL resolve to `#6b7280`
- AND the existing `theme.bg`, `theme.border`, `theme.text`, `theme.accent`, `theme.severity`, `theme.status`, and `theme.auth` token groups SHALL remain unchanged

## Done Criteria
- [ ] `theme.app` object exists in `theme.ts` with all 6 tokens: `bg`, `surface`, `elevated`, `border`, `text`, `textSecondary`
- [ ] Hex values match exactly: `#ffffff`, `#f5f7fa`, `#e5e7eb`, `#d1d5db`, `#111827`, `#6b7280`
- [ ] All existing token groups (`bg`, `border`, `text`, `accent`, `severity`, `status`, `auth`) are unchanged
- [ ] TypeScript compiles with no errors (`pnpm build`)
