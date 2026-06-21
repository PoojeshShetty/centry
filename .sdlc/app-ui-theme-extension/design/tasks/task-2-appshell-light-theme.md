# Task 2: Update AppShell to light theme

## Trace
- **FR-IDs:** FR-02
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/frontend/src/components/AppShell.tsx` — modify
- `packages/frontend/src/components/__tests__/components.test.tsx` — update (interface change)

## Design References
- design.md §Architecture (AppShell.tsx component)
- design.md §Design Decisions (AppShell active nav highlight — antd Menu theme prop)

## Contracts (task-specific)

### Internal Interfaces
- `AppShell` rendered sidebar: background SHALL be `theme.app.bg` (`#ffffff`), border-right `theme.app.border`, text `theme.app.text`
- `Menu` selected item: `colorPrimary` set to `theme.auth.accent` (`#3730a3`) via antd theme prop

## Acceptance Criteria

### FR-02: AppShell light theme
- GIVEN the user navigates to any protected route
- WHEN `AppShell` renders
- THEN the sidebar background SHALL be white or off-white (not `#161616`)
- AND the sidebar text SHALL be dark (not light-grey on dark)
- AND the active navigation item SHALL use `theme.auth.accent` (`#3730a3`) as the highlight colour

## Done Criteria
- [ ] `AppLayout` background changed from `theme.bg.app` to `theme.app.bg`
- [ ] `AppSider` background changed from `theme.bg.surface` to `theme.app.bg`, border-right uses `theme.app.border`
- [ ] `AppContent` background changed from `theme.bg.app` to `theme.app.bg`
- [ ] `Menu` style prop background updated to `theme.app.bg`
- [ ] `Menu` receives antd theme prop with `colorPrimary: theme.auth.accent`
- [ ] No dark `theme.bg.*` or `theme.border.*` references remain in `AppShell.tsx`
- [ ] TypeScript compiles with no errors
