# Task 3: Migrate LoginPage and RegisterPage to AuthLayout

## Trace
- **FR-IDs:** FR-02, FR-03, FR-09
- **Depends on:** task-2
- **Design:** ../design.md

## Files
- `packages/frontend/src/pages/login/index.tsx` — modify
- `packages/frontend/src/pages/register/index.tsx` — modify
- `packages/frontend/src/pages/login/__tests__/login.test.tsx` — update (interface change)
- `packages/frontend/src/pages/register/__tests__/register.test.tsx` — update (interface change)

## Design References
- design.md §Architecture (LoginPage, RegisterPage components)
- design.md §Architecture (Data Flow)

## Contracts (task-specific)

### Internal Interfaces
- `LoginPage()`: Remove `PageWrapper` and `Card` styled components; wrap form body with `<AuthLayout title="Log in" tagline="...">`. All form fields, submit handler, error state, and auth API call remain unchanged.
- `RegisterPage()`: Same treatment — remove `PageWrapper`/`Card`, wrap with `<AuthLayout title="Register" tagline="...">`. All form fields, submit handler, and auth API call remain unchanged.

## Acceptance Criteria

### FR-02: Login page — fields and auth flow
- GIVEN the redesigned login page
- WHEN the page renders
- THEN email field, password field with show/hide toggle, "Log in" CTA, and "Need an account?" link SHALL all be present

- GIVEN valid credentials
- WHEN the user submits the login form
- THEN the auth API call SHALL succeed and the user SHALL be navigated to the home page

- GIVEN invalid credentials
- WHEN the user submits the login form
- THEN an inline error alert SHALL be displayed without page navigation

### FR-03: Register page — fields and auth flow
- GIVEN the redesigned register page
- WHEN the page renders
- THEN name, email, and password fields and a "Register" CTA SHALL be present

- GIVEN empty or invalid fields
- WHEN the user submits
- THEN Ant Design form validation errors SHALL display inline below the affected fields

- GIVEN valid registration data
- WHEN the user submits
- THEN the auth API call SHALL succeed and the user SHALL be navigated to the home page

### FR-09: Existing tests pass
- GIVEN the redesigned login and register pages
- WHEN the existing frontend test suite runs
- THEN all pre-existing tests for login and register SHALL continue to pass

## Done Criteria
- [ ] `LoginPage` no longer renders `PageWrapper` or `Card` styled components
- [ ] `LoginPage` wraps its form body in `<AuthLayout>` with a title and tagline
- [ ] `LoginPage` still calls `/api/auth/login` on submit and navigates on success
- [ ] `LoginPage` still shows inline error alert on failure
- [ ] `RegisterPage` no longer renders `PageWrapper` or `Card` styled components
- [ ] `RegisterPage` wraps its form body in `<AuthLayout>` with a title and tagline
- [ ] `RegisterPage` still calls `/api/auth/register` on submit and navigates on success
- [ ] No changes to form validation rules in either page
- [ ] `login.test.tsx` passes: JWT persisted + navigate on 200; inline error on 401
- [ ] `register.test.tsx` passes: setAuth + navigate on 201; inline error on 409
- [ ] `pnpm --filter @centry/frontend test` passes with zero failures
