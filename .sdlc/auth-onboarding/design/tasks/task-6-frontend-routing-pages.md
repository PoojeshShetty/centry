# Task 6: Implement frontend protected routing, HomePage greeting, and AccountPage

## Trace
- **FR-IDs:** FR-12, FR-13, FR-14, FR-15
- **Depends on:** task-5
- **Design:** ../design.md

## Files
- `packages/frontend/src/components/ProtectedRoute.tsx` — create
- `packages/frontend/src/routes/index.tsx` — modify (add `/login`, `/register`, protected `/`, `/account`)
- `packages/frontend/src/pages/home/index.tsx` — modify (greet "Hello \<name>", require auth)
- `packages/frontend/src/pages/account/index.tsx` — create
- `packages/frontend/src/components/__tests__/ProtectedRoute.test.tsx` — create
- `packages/frontend/src/pages/account/__tests__/account.test.tsx` — create
- `packages/frontend/src/routes/__tests__/routes.test.tsx` — update (interface change)
- `packages/frontend/src/pages/home/__tests__/home.test.tsx` — update (interface change)

## Design References
- design.md §Architecture (ProtectedRoute, Router modifications, HomePage, AccountPage)
- design.md §Interface Contracts (Internal Interfaces — ProtectedRoute, useAuthStore)

## Contracts (task-specific)

### Internal Interfaces
- `ProtectedRoute`: React component that reads `useAuthStore.isAuthenticated`; renders `<Outlet />` (or `children`) when authenticated; renders `<Navigate to="/login" replace />` when not
- Router routes added:
  - `/login` → `LoginPage` (public)
  - `/register` → `RegisterPage` (public)
  - `/` → `ProtectedRoute` wrapping `HomePage`
  - `/account` → `ProtectedRoute` wrapping `AccountPage`
- `HomePage`: reads `useAuthStore.user.name` and renders `"Hello <name>"` heading
- `AccountPage`: calls `GET /api/auth/me` on mount; renders name, email, member-since date; includes a logout control that calls `useAuthStore.logout()` then navigates to `/login`

## Acceptance Criteria

### FR-12: Personalised home greeting
- GIVEN a logged-in user with name "Alice" (store has `user.name = "Alice"`)
- WHEN `HomePage` renders
- THEN it SHALL display the text "Hello Alice"

### FR-13: Account-information view
- GIVEN a logged-in user
- WHEN `AccountPage` renders and `GET /api/auth/me` resolves
- THEN it SHALL display the user's name, email, and member-since date
- AND it SHALL NOT display any password information

### FR-14: Logout navigation
- GIVEN a logged-in user on any protected page
- WHEN they activate the logout control
- THEN `useAuthStore.logout()` SHALL be called and the user SHALL be navigated to `/login`

### FR-15: Route protection
- GIVEN `useAuthStore.isAuthenticated` is false
- WHEN `ProtectedRoute` renders (wrapping `/` or `/account`)
- THEN it SHALL render `<Navigate to="/login" replace />` — NOT the protected page

- GIVEN `useAuthStore.isAuthenticated` is true
- WHEN `ProtectedRoute` renders
- THEN it SHALL render the protected child component

## Done Criteria
- [ ] `ProtectedRoute` redirects to `/login` when unauthenticated; renders children when authenticated
- [ ] Router declares `/login`, `/register` (public) and `/`, `/account` (protected via `ProtectedRoute`)
- [ ] `HomePage` renders `"Hello <name>"` using `useAuthStore.user.name`
- [ ] `AccountPage` fetches `/api/auth/me`, displays name/email/member-since, no password shown, has logout control
- [ ] Jest tests cover: ProtectedRoute redirects when not authenticated; ProtectedRoute renders children when authenticated; HomePage shows greeting; AccountPage renders user fields; routes include all four new paths
- [ ] Existing `routes.test.tsx` and `home.test.tsx` updated to pass with new router structure and protected HomePage
- [ ] `pnpm --filter @centry/frontend test` passes
