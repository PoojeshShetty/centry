# Task 2: Create AuthRightPanel and AuthLayout components

## Trace
- **FR-IDs:** FR-01, FR-04, FR-05, FR-06, FR-07, FR-08
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/frontend/src/components/AuthLayout.tsx` — create
- `packages/frontend/src/components/AuthRightPanel.tsx` — create
- `packages/frontend/src/components/__tests__/AuthLayout.test.tsx` — create
- `packages/frontend/src/components/__tests__/AuthRightPanel.test.tsx` — create

## Design References
- design.md §Architecture (AuthLayout component)
- design.md §Architecture (AuthRightPanel component)
- design.md §Interface Contracts (AuthLayout, AuthRightPanel)
- design.md §Design Decisions (Right panel content: skeletons only)
- design.md §Design Decisions (Responsive hiding FR-08)

## Contracts (task-specific)

### Internal Interfaces
- `AuthLayoutProps`: `{ children: ReactNode; title: string; tagline: string }`
- `AuthLayout({ children, title, tagline }: AuthLayoutProps) -> JSX.Element`
  - Renders full-viewport flex row: left panel (white/off-white bg, logo wordmark + `title` + `tagline` above `children`) and right panel (`<AuthRightPanel />`)
  - Right panel hidden at `≤768px` via CSS media query; left panel takes full width at that breakpoint
  - Pre: must be rendered outside AppShell (standalone full-viewport page)
  - Post: no sidebar in DOM; no API calls made

- `AuthRightPanel() -> JSX.Element`
  - No props
  - Renders three `<Skeleton active>` cards:
    1. Chart placeholder — `paragraph={{ rows: 4 }}`
    2. Stat card — `paragraph={{ rows: 1 }}`
    3. Log table rows — `paragraph={{ rows: 5 }}`
  - Post: no API calls; skeleton `active` prop produces shimmer

## Acceptance Criteria

### FR-01: AuthLayout split-panel layout
- GIVEN the user navigates to a page using `AuthLayout`
- WHEN the page renders
- THEN the viewport SHALL be split with a white/off-white left panel and a dark-navy right panel side by side
- AND no sidebar or AppShell navigation SHALL be visible

### FR-04: Right panel skeleton
- GIVEN the auth page loads
- WHEN the right panel renders
- THEN three skeleton cards SHALL be visible (chart placeholder, stat card, table rows)
- AND the skeletons SHALL have the `active` prop (shimmer)
- AND no API calls SHALL be made to populate them

### FR-05: Left panel branding
- GIVEN any auth page using `AuthLayout`
- WHEN the left panel renders
- THEN the centry logo/wordmark and the `tagline` prop SHALL appear above the `children`

### FR-07: Standalone — no AppShell on auth routes
- GIVEN a component rendered with `AuthLayout`
- WHEN the DOM is inspected
- THEN the AppShell sidebar SHALL NOT be present

### FR-08: Responsive — right panel hidden on mobile
- GIVEN a viewport width of 768px or narrower
- WHEN the auth page renders
- THEN the right panel SHALL NOT be visible
- AND the left panel SHALL occupy 100% of the viewport width

## Done Criteria
- [ ] `AuthLayout.tsx` exists and exports `AuthLayout` as named and default export
- [ ] `AuthRightPanel.tsx` exists and exports `AuthRightPanel`
- [ ] `AuthLayout` renders a left panel with logo/wordmark, title, tagline, and children slot
- [ ] `AuthLayout` renders `<AuthRightPanel />` in the right panel
- [ ] Right panel container has `@media (max-width: 768px) { display: none }` CSS rule
- [ ] `AuthRightPanel` renders exactly 3 `Skeleton` components, all with `active` prop
- [ ] `AuthLayout.test.tsx` has failing tests written first (TDD): split-panel render, branding presence, responsive hidden right panel
- [ ] `AuthRightPanel.test.tsx` verifies 3 skeleton cards render with `active`
- [ ] All new tests pass after implementation
- [ ] `pnpm --filter @centry/frontend test` passes
