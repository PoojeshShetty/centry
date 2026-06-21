# Requirements: App UI Theme Extension

## 1. Project

- Path: `.`

---

## 2. Purpose

The auth pages redesign introduced a polished light-background colour system (`theme.auth.*`). The rest of the authenticated app — projects list, project detail, logs — still renders on a near-black background (`#0d0d0d`) that reduces readability and breaks visual cohesion. This feature extends the light theme across the main app shell and pages, replaces the project detail drawer with a proper detail page that embeds logs, and fixes a layout bug where the logs FilterBar (currently `position: fixed`) overlaps the sidebar navigation.

---

## 3. User Stories

- As a logged-in user, I want the projects page, project detail, and logs to use a light readable background consistent with the login/register pages, so that the app feels visually unified.
- As a user browsing projects, I want clicking a project card to navigate to a dedicated project detail page rather than opening a drawer, so that I have more space to read project information and logs in context.
- As a user viewing logs, I want the filter bar to stay within the main content area and never obscure the sidebar, so that navigation remains fully accessible at all times.

---

## 4. Functional Requirements

- **FR-01**: `theme.ts` SHALL be extended with an `app` token group (`bg`, `surface`, `elevated`, `border`, `text`) using light values derived from the `auth` palette (`#ffffff`, `#f5f7fa`, `#e5e7eb`, `#d1d5db`, `#111827`, `#6b7280`) so all main-app components can reference unified light tokens.
- **FR-02**: `AppShell` SHALL be updated to use `theme.app.*` tokens — white/off-white sidebar background, subtle light border, and dark text — replacing the current dark `theme.bg.*` and `theme.border.*` references.
- **FR-03**: `ProjectsPage` SHALL be updated to use `theme.app.*` tokens for page background, header text, and empty-state text.
- **FR-04**: `ProjectCard` SHALL be updated to use `theme.app.*` tokens for card background, border, text, and environment badge.
- **FR-05**: A new `ProjectDetailPage` SHALL be created at route `/projects/:projectId`. The top section SHALL display the project name, environment badge, application URL, and creation date. Below that it SHALL display the DSN block (masked by default with copy/reveal/rotate-key controls identical to the current `ProjectDetailPanel`). Below the DSN block the project's log stream SHALL be embedded (reusing `FilterBar` + `LogStream` + `LogDetailDrawer`).
- **FR-06**: `ProjectsPage` SHALL be updated so clicking a `ProjectCard` navigates to `/projects/:projectId` instead of calling `selectProject` to open the drawer. The `ProjectDetailPanel` drawer component SHALL be removed from `ProjectsPage`.
- **FR-07**: The router SHALL add `/projects/:projectId` mapped to `ProjectDetailPage`, nested inside the `ProtectedRoute`/`AppShell` wrapper. The existing `/projects/:projectId/logs` route SHALL be removed (its functionality is absorbed into FR-05).
- **FR-08**: `FilterBar` SHALL change from `position: fixed; top: 0; left: 0; right: 0` to `position: sticky; top: 0` so it sticks within the scrollable content column and never overlays the sidebar. The `LogsPage` outer wrapper SHALL set `overflow-y: auto` so the sticky positioning works correctly.
- **FR-09**: `FilterBar` and `LogsPage` SHALL be updated to use `theme.app.*` tokens (light backgrounds and dark text) consistent with the rest of the redesigned app.
- **FR-10**: `ProjectDetailPage` SHALL include a back-navigation affordance (e.g., a "← Projects" breadcrumb link) that returns the user to `/projects`.
- **FR-11**: `ProjectDetailPage` SHALL apply `theme.app.*` tokens for all surfaces, text, and borders.

---

## 5. Acceptance Criteria

### FR-01: Light theme tokens in theme.ts

**Happy path:**
- GIVEN `theme.ts` after this change
- WHEN a component imports `theme.app.bg`
- THEN it SHALL resolve to `#ffffff` (or `#f5f7fa` for surface)
- AND the existing `theme.bg`, `theme.border`, `theme.text`, `theme.accent`, `theme.severity`, `theme.status`, and `theme.auth` token groups SHALL remain unchanged

### FR-02: AppShell light theme

**Happy path:**
- GIVEN the user navigates to any protected route
- WHEN `AppShell` renders
- THEN the sidebar background SHALL be white or off-white (not `#161616`)
- AND the sidebar text SHALL be dark (not light-grey on dark)
- AND the active navigation item SHALL use `theme.auth.accent` (`#3730a3`) as the highlight colour

### FR-03 & FR-04: ProjectsPage and ProjectCard light theme

**Happy path:**
- GIVEN the user navigates to `/projects`
- WHEN the page renders
- THEN the page background SHALL be white or off-white
- AND each project card SHALL have a white/light-surface background with a light border and dark text

### FR-05: ProjectDetailPage — project info + embedded logs

**Happy path:**
- GIVEN the user is on `/projects/:projectId`
- WHEN the page renders
- THEN a top section SHALL show the project name, environment, application URL, and created date
- AND a DSN block SHALL appear below showing the masked DSN with Copy, Reveal/Hide, and Rotate key buttons
- AND the full logs section (FilterBar + log stream) SHALL appear below the DSN block for the same project

**DSN reveal path:**
- GIVEN the ProjectDetailPage
- WHEN the user clicks "Reveal"
- THEN the full DSN value SHALL be displayed in plaintext
- WHEN the user clicks "Hide"
- THEN the DSN SHALL be masked again

**Rotate key path:**
- GIVEN the ProjectDetailPage
- WHEN the user clicks "Rotate key"
- THEN the key SHALL be rotated (via existing `rotateKey` store action) and the DSN SHALL revert to masked state

### FR-06: ProjectCard click navigates to detail page

**Happy path:**
- GIVEN the projects list page
- WHEN the user clicks a project card
- THEN the browser SHALL navigate to `/projects/:projectId`
- AND no drawer SHALL appear

**Regression — no drawer:**
- GIVEN `ProjectsPage` after this change
- WHEN rendered
- THEN `ProjectDetailPanel` SHALL NOT be present in the component tree

### FR-07: Route changes

**Happy path:**
- GIVEN the application router
- WHEN the user navigates to `/projects/abc123`
- THEN `ProjectDetailPage` SHALL render with `projectId = "abc123"`

**Removed route:**
- GIVEN the application router
- WHEN the user navigates to `/projects/abc123/logs`
- THEN the route SHALL either redirect to `/projects/abc123` or render the 404 page (no broken render)

### FR-08: FilterBar — sticky within content, does not cover sidebar

**Happy path:**
- GIVEN the user is on any page that renders `FilterBar`
- WHEN the user scrolls the log list
- THEN `FilterBar` SHALL remain visible at the top of the content column
- AND the sidebar SHALL remain fully visible and clickable at all times

**Regression — no viewport overlay:**
- GIVEN `FilterBar` after this change
- WHEN rendered
- THEN its CSS `position` SHALL be `sticky` (not `fixed`)
- AND its `top`, `left`, `right` offsets SHALL be relative to the content column, not the viewport

### FR-09: FilterBar and LogsPage light theme

**Happy path:**
- GIVEN the user is viewing the log stream
- WHEN `FilterBar` renders
- THEN its background SHALL use `theme.app.surface` (light) not `theme.bg.surface` (dark `#161616`)
- AND pill/button text SHALL be dark and legible against the light background

### FR-10: Back navigation on ProjectDetailPage

**Happy path:**
- GIVEN the user is on `/projects/:projectId`
- WHEN the user clicks "← Projects"
- THEN the browser SHALL navigate to `/projects`

### FR-11: ProjectDetailPage light theme

**Happy path:**
- GIVEN `/projects/:projectId`
- WHEN the page renders
- THEN all surfaces SHALL use `theme.app.*` light tokens, consistent with FR-03/FR-04

---

## 6. Constraints

### In Scope
- `theme.ts` — add `app` token group
- `AppShell.tsx` — light theme, update accent for active nav
- `ProjectsPage/index.tsx` — light theme, click → navigate (no drawer)
- `ProjectCard.tsx` — light theme
- New `ProjectDetailPage` at `packages/frontend/src/pages/projects/ProjectDetailPage.tsx`
- `FilterBar.tsx` — `position: sticky` fix + light theme
- `LogsPage/index.tsx` — light theme + overflow fix for sticky FilterBar
- `routes/routes.tsx` — add `/projects/:projectId`, remove `/projects/:projectId/logs`

### Out of Scope
- Backend API changes — all data is fetched via existing store actions
- `ProjectDetailPanel.tsx` file itself can be deleted (it is no longer rendered)
- Auth pages (`AuthLayout`, `AuthRightPanel`, `LoginPage`, `RegisterPage`) — already redesigned, no changes
- `AccountPage` theme update — deferred to a separate task
- Pagination or infinite scroll changes in log stream — existing behaviour preserved
- Dark-mode toggle — not planned

### Prohibitions
- SHALL NOT break any existing passing tests
- SHALL NOT change the auth token group in `theme.ts`
- SHALL NOT introduce new backend endpoints
- SHALL NOT remove `selectProject` from `useProjectStore` if it is used in tests (adjust carefully)

### Testing Approach
- Update existing `projects.test.tsx` expectations: click on card → navigation call (not `selectProject` for drawer)
- Update `FilterBar.test.tsx` to assert `position: sticky` (or remove the fixed-position assertion)
- Add a render test for `ProjectDetailPage` (project info section + back link visible)
- All pre-existing passing tests must continue to pass

### Branch
- Base branch: `feature/ui-ux-upgrade`
- Feature branch: `feature/app-ui-theme-extension`
