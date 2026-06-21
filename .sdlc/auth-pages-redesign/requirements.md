# Requirements: Auth Pages Redesign

## 1. Project

- Path: `.`

---

## 2. Purpose

Eliminate the bare centered-card that breaks visual identity at the first impression of centry. The current login and register pages are disconnected from the product's brand — replacing them with a polished split-panel layout (light form panel left, dark-navy dashboard skeleton right) ensures the auth entry point reflects the quality of the tool behind it.

---

## 3. User Stories

- As a new user, I want a polished register page that signals this is a professional tool, so that I feel confident creating an account.
- As a returning user, I want a clean login page that is fast to scan and submit, so that I can get to my logs without friction.
- As any auth-page visitor, I want to see a preview of the dashboard skeleton on the right panel, so that I understand what the product does before I have logged in.

---

## 4. Functional Requirements

- FR-01: The system SHALL provide an `AuthLayout` component — a shared full-viewport split-panel wrapper (left: white/off-white form panel; right: dark-navy preview panel) — used by both login and register pages.
- FR-02: The login page SHALL replace the current centered card with `AuthLayout`, preserving the email field, password field (with show/hide toggle), primary CTA button, and "Need an account?" link.
- FR-03: The register page SHALL replace the current centered card with `AuthLayout`, preserving the name, email, and password fields, primary CTA button, and "Already have an account?" link.
- FR-04: The right panel SHALL render three decorative dashboard card skeletons (error rate chart placeholder, log count stat card, log table rows) using Ant Design `Skeleton` components; no real data or API calls.
- FR-05: The left panel SHALL display the centry logo/wordmark and a short tagline above the form.
- FR-06: The left panel SHALL use a white/off-white background (`#ffffff` / `#f5f7fa`) with a dark-blue accent colour for the CTA button and links; dark text on light background.
- FR-07: `AuthLayout` SHALL NOT depend on or render the AppShell sidebar — auth pages are standalone full-viewport views.
- FR-08: On viewport widths ≤ 768px, the right panel SHOULD be hidden and the left panel SHALL fill the full width.
- FR-09: All existing form validation rules and auth API calls (`/api/auth/login`, `/api/auth/register`) SHALL be preserved without change.

---

## 5. Acceptance Criteria

### FR-01: AuthLayout split-panel layout

**Happy path:**
- GIVEN the user navigates to `/login` or `/register`
- WHEN the page renders
- THEN the viewport SHALL be split with a white/off-white left panel and a dark-navy right panel side by side
- AND no sidebar or AppShell navigation SHALL be visible

### FR-02: Login page — fields and auth flow

**Happy path:**
- GIVEN the redesigned login page
- WHEN the page renders
- THEN email field, password field with show/hide toggle, "Log in" CTA, and "Need an account?" link SHALL all be present

**Auth success path:**
- GIVEN valid credentials
- WHEN the user submits the login form
- THEN the auth API call SHALL succeed and the user SHALL be navigated to the home page

**Failure path:**
- GIVEN invalid credentials
- WHEN the user submits the login form
- THEN an inline error alert SHALL be displayed without page navigation

### FR-03: Register page — fields and auth flow

**Happy path:**
- GIVEN the redesigned register page
- WHEN the page renders
- THEN name, email, and password fields and a "Register" CTA SHALL be present

**Validation path:**
- GIVEN empty or invalid fields
- WHEN the user submits
- THEN Ant Design form validation errors SHALL display inline below the affected fields

**Registration success path:**
- GIVEN valid registration data
- WHEN the user submits
- THEN the auth API call SHALL succeed and the user SHALL be navigated to the home page

### FR-04: Right panel skeleton

**Happy path:**
- GIVEN the auth page loads
- WHEN the right panel renders
- THEN three skeleton cards SHALL be visible (chart placeholder, stat card, table rows)
- AND the skeletons SHALL animate (shimmer)
- AND no API calls SHALL be made to populate them

### FR-05: Left panel branding

**Happy path:**
- GIVEN any auth page
- WHEN the left panel renders
- THEN the centry logo/wordmark and a tagline SHALL appear above the form fields

### FR-06: Left panel colour palette

**Happy path:**
- GIVEN the left panel
- WHEN inspected
- THEN the background SHALL be white or off-white
- AND the primary CTA button and links SHALL use the dark-blue accent colour
- AND text SHALL be dark on the light background (not the app's dark-theme tokens)

### FR-07: Standalone — no AppShell on auth routes

**Happy path:**
- GIVEN the user is on `/login` or `/register`
- WHEN the page renders
- THEN the AppShell sidebar SHALL NOT be present in the DOM

### FR-08: Responsive — right panel hidden on mobile

**Edge case:**
- GIVEN a viewport width of 768px or narrower
- WHEN the auth page renders
- THEN the right panel SHALL NOT be visible
- AND the left panel SHALL occupy 100% of the viewport width

### FR-09: Existing tests pass

**Regression:**
- GIVEN the redesigned login and register pages
- WHEN the existing frontend test suite runs
- THEN all pre-existing tests for login and register SHALL continue to pass

---

## 6. Constraints

### In Scope
- `AuthLayout` shared component (split-panel wrapper)
- Redesigned `LoginPage` using `AuthLayout`
- Redesigned `RegisterPage` using `AuthLayout`
- Right-panel decorative skeleton (3 dashboard cards)
- Left-panel centry branding (logo + tagline)
- Light/off-white left panel with dark-blue accent colour scheme
- Responsive: right panel hidden at ≤768px

### Out of Scope
- Google OAuth / SSO — deferred; no backend OAuth support exists
- Real data in the right-panel skeleton — purely decorative, no API calls
- Changes to auth API endpoints (`/api/auth/login`, `/api/auth/register`) — backend untouched
- AppShell, sidebar, or any other page layout
- Forgot-password / password-reset flow — separate feature

### Prohibitions
- SHALL NOT break existing login and register tests
- SHALL NOT introduce new backend API endpoints or modify existing ones
- SHALL NOT apply AppShell dark-theme tokens (`theme.bg.app`, `theme.bg.surface`, etc.) to auth page backgrounds
- SHALL NOT make real API calls from the right-panel skeleton

### Testing Approach
- Selective TDD — write failing tests for `AuthLayout` split/responsive behaviour first, then implement; add render tests for the skeleton after implementation

### Branch
- Base branch: `feature/ui-ux-upgrade`
- Feature branch: `feature/auth-pages-redesign`
