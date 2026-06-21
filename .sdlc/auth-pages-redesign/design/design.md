# Design: auth-pages-redesign

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09
- **Requirements:** ../requirements.md

## Architecture

### Components
- `AuthLayout` (`src/components/AuthLayout.tsx`): full-viewport split-panel wrapper; renders left form panel and right skeleton panel side by side — **new**
- `AuthRightPanel` (`src/components/AuthRightPanel.tsx`): dark-navy right panel with three decorative Ant Design Skeleton cards; no props, no API calls — **new**
- `LoginPage` (`src/pages/login/index.tsx`): removes `PageWrapper`/`Card` styled wrappers; renders form body as `AuthLayout` children — **modified**
- `RegisterPage` (`src/pages/register/index.tsx`): same treatment as LoginPage — **modified**
- `theme.ts`: gains a `theme.auth` namespace with light-panel colour tokens — **modified**

### Data Flow
`/login` route → `LoginPage` → `AuthLayout` (left: form body, right: `AuthRightPanel`) → Ant Design Skeleton (decorative only)
`/register` route → `RegisterPage` → `AuthLayout` (left: form body, right: `AuthRightPanel`)
Form submit → existing `apiClient.request()` → `/api/auth/login` or `/api/auth/register` → `useAuthStore.setAuth()` → navigate

Auth routes are already outside the `AppShell`/`ProtectedRoute` subtree in `routes.tsx` — no routing changes needed (FR-07).

## Interface Contracts

### Internal Interfaces (shared)

- `AuthLayout({ children, title, tagline }: AuthLayoutProps) -> JSX.Element`
  - Props: `children` (ReactNode) — form body rendered in left panel; `title` (string) — heading above form; `tagline` (string) — sub-text below heading
  - Left panel: white/off-white background using `theme.auth` tokens, logo/wordmark + `title` + `tagline` above `children`
  - Right panel: renders `<AuthRightPanel />`, hidden at ≤768px via CSS media query
  - Pre: must be used only on standalone full-viewport pages (not inside AppShell)
  - Post: viewport-filling flex row; no sidebar in DOM

- `AuthRightPanel() -> JSX.Element`
  - No props; self-contained
  - Renders three skeleton cards:
    1. **Chart placeholder** — `Skeleton` with `paragraph={{ rows: 4 }}` and `active` (simulates a chart)
    2. **Stat card** — `Skeleton` with `paragraph={{ rows: 1 }}` and `active` (simulates a number stat)
    3. **Log table rows** — `Skeleton` with `paragraph={{ rows: 5 }}` and `active` (simulates log entries)
  - Pre: none
  - Post: no API calls made; skeleton `active` prop produces shimmer animation

## Design Decisions

### Right panel content: skeletons only
- **Chosen:** Three Ant Design `Skeleton` cards with `active` shimmer — no illustration
- **Rationale:** Requirements explicitly specify skeleton components (FR-04); keeps the right panel product-accurate rather than decorative-only; no additional asset dependencies
- **Rejected:** Geometric illustration — would require SVG assets and diverges from the FR-04 spec; illustration-only approach provides no product preview signal

### Light palette: theme.auth namespace in theme.ts
- **Chosen:** Extend `theme.ts` with `theme.auth = { bg, bgAlt, accent, accentHover, text, textSecondary }` tokens; `AuthLayout` imports from `theme`
- **Rationale:** A full theme makeover is planned; centralising auth light-mode tokens in `theme.ts` now makes them available to future redesign passes without hunting for inline constants; keeps `AuthLayout` consistent with how every other component accesses colours
- **Rejected:** Inline `authPalette` constant in `AuthLayout.tsx` — fine for isolation but creates a dead-end that must be migrated during the full theme makeover anyway

### Token values for theme.auth
- `bg: '#ffffff'`, `bgAlt: '#f5f7fa'` — white / light grey per FR-06
- `accent: '#3730a3'`, `accentHover: '#4338ca'` — indigo-700/600 (dark-blue per FR-06; distinct from app accent `#1677ff`)
- `text: '#111827'`, `textSecondary: '#6b7280'` — near-black / mid-grey; readable on light backgrounds (FR-06 prohibition on dark-theme tokens)
- **Rejected:** Reusing `theme.accent.primary` (`#1677ff`) for auth accent — would look out of place on a white background and conflicts with the brand direction seen in the reference image

### Responsive hiding (FR-08)
- **Chosen:** CSS `@media (max-width: 768px)` on `AuthRightPanel` container sets `display: none`; left panel takes `flex: 1`
- **Rationale:** Pure CSS — no JS resize listener, no layout state, no hydration issues
- **Rejected:** Conditional render via `useWindowSize` hook — adds runtime state and a hook dependency to a layout component that should have zero logic
