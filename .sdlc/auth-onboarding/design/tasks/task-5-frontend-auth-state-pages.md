# Task 5: Implement frontend auth state, API client, and auth pages

## Trace
- **FR-IDs:** FR-09, FR-10, FR-11, FR-14
- **Depends on:** task-4
- **Design:** ../design.md

## Files
- `packages/frontend/src/store/useAuthStore.ts` — create
- `packages/frontend/src/utils/apiClient.ts` — create
- `packages/frontend/src/pages/register/index.tsx` — create
- `packages/frontend/src/pages/login/index.tsx` — create
- `packages/frontend/src/store/__tests__/useAuthStore.test.ts` — create
- `packages/frontend/src/utils/__tests__/apiClient.test.ts` — create
- `packages/frontend/src/pages/register/__tests__/register.test.tsx` — create
- `packages/frontend/src/pages/login/__tests__/login.test.tsx` — create

## Design References
- design.md §Architecture (useAuthStore, apiClient, RegisterPage, LoginPage)
- design.md §Interface Contracts (Internal Interfaces — useAuthStore shape, apiClient.request)
- design.md §Design Decisions (Frontend token storage: localStorage)

## Contracts (task-specific)

### Internal Interfaces
- `useAuthStore`: zustand store shape `{ token: string | null, user: { id, name, email, created_at } | null, isAuthenticated: boolean, setAuth(token, user): void, logout(): void }`
  - `setAuth` persists `token` and `user` to `localStorage` and updates store state
  - `logout` clears `localStorage` entries and resets store to unauthenticated state
  - Store initialises from `localStorage` on first load (survives page refresh)
- `apiClient.request(path: string, opts?: RequestInit) -> Promise<data>`:
  - Attaches `Authorization: Bearer <token>` when `useAuthStore` has a token
  - On non-2xx: throws a typed error `{ message: string, status: number }` carrying the backend `{ error }` field
- `RegisterPage`: antd Form with fields `name`, `email`, `password`; on submit calls `POST /api/auth/register`; on success calls `setAuth` then navigates to `/`; on 409 displays inline "email already registered"; on 400 displays inline validation message
- `LoginPage`: antd Form with fields `email`, `password`; on submit calls `POST /api/auth/login`; on success calls `setAuth` then navigates to `/`; on 401 displays inline "invalid email or password"

## Acceptance Criteria

### FR-09: Register from UI
- GIVEN a user on `/register` submitting a valid name, email, and password
- WHEN the backend responds 201
- THEN the app SHALL call `setAuth(token, user)` and navigate to `/`

### FR-10: Login from UI
- GIVEN a user on `/login` submitting valid credentials
- WHEN the backend responds 200
- THEN the app SHALL persist the JWT via `setAuth` and navigate to `/`

### FR-11: Inline error display
- GIVEN the register form submitted with an already-registered email (backend 409)
- WHEN the response arrives
- THEN the form SHALL render the text "email already registered" inline (no full-page error)

- GIVEN the login form submitted with wrong credentials (backend 401)
- WHEN the response arrives
- THEN the form SHALL render "invalid email or password" inline

### FR-14: Logout (store-level)
- GIVEN `useAuthStore` has `{ token, user }` set
- WHEN `logout()` is called
- THEN `isAuthenticated` SHALL be false, `token` and `user` SHALL be null, and `localStorage` SHALL not contain the token key

## Done Criteria
- [ ] `useAuthStore` initialises from `localStorage`; `setAuth` persists to `localStorage`; `logout` clears `localStorage`
- [ ] `apiClient.request` attaches `Authorization: Bearer <token>` when authenticated
- [ ] `apiClient.request` throws a typed error with `message` and `status` on non-2xx
- [ ] `RegisterPage` renders name/email/password form; submits to `/api/auth/register`; shows inline errors
- [ ] `LoginPage` renders email/password form; submits to `/api/auth/login`; shows inline errors
- [ ] Jest tests cover useAuthStore (setAuth, logout, localStorage persistence), apiClient (auth header, error throwing), RegisterPage (success navigate, inline 409 error), LoginPage (success navigate, inline 401 error)
- [ ] `pnpm --filter @centry/frontend test` passes
- [ ] `zustand` installed if not already present (`pnpm --filter @centry/frontend add zustand`)
