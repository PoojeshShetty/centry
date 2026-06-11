# Requirements: Project Management

## 1. Project

- Path: `.`
- Branch: `feature/project-management` (from `dev`)

---

## 2. Purpose

Enable authenticated accounts to create and manage projects so they can obtain DSNs and credentials needed to start shipping logs from their applications to centry.

---

## 3. User Stories

- As an account holder, I want to see all my projects in a card grid so I can quickly navigate to any project.
- As an account holder, I want to create a project with a name, URL, description, and environment so I can start logging from a new application.
- As an account holder, I want to view a project's DSN so I can configure my SDK.
- As an account holder, I want to rotate a project's DSN key so I can recover from a credential leak.
- As an account holder, I want to archive a project so I can retire it without permanently losing its logs.

---

## 4. Functional Requirements

- FR-01: `GET /api/projects` SHALL return all non-archived projects belonging to the authenticated account.
- FR-02: `POST /api/projects` SHALL create a project with name, application_url, description, and environment; SHALL auto-mint a `public_key`; SHALL return the project with its DSN.
- FR-03: `PATCH /api/projects/:id` SHALL update one or more of: name, application_url, description, environment. SHALL reject updates to projects belonging to another account (403).
- FR-04: `DELETE /api/projects/:id` SHALL soft-delete the project by setting `archived_at`; logs and keys SHALL be retained.
- FR-05: `POST /api/projects/:id/rotate-key` SHALL regenerate the project's `public_key`; the old key SHALL be immediately invalidated.
- FR-06: Archived projects SHALL NOT appear in the `GET /api/projects` list response.
- FR-07: Archived projects SHALL NOT accept new ingest (envelope POST SHALL return 403).
- FR-08: The frontend SHALL display a card grid of projects, each showing name, application URL, environment tag, and created date.
- FR-09: The frontend SHALL provide a project detail panel showing the DSN (masked by default, reveal on click), with a rotation control.
- FR-10: The frontend delete action SHALL display a confirmation dialog before issuing the archive request.

---

## 5. Acceptance Criteria

### FR-01: List projects

**Happy path:**
- GIVEN an authenticated account with 3 non-archived projects
- WHEN they call `GET /api/projects`
- THEN the response SHALL contain exactly those 3 projects
- AND each project SHALL include: id, name, application_url, description, environment, created_at

**Archived excluded:**
- GIVEN an account has 2 active and 1 archived project
- WHEN they call `GET /api/projects`
- THEN the response SHALL contain only the 2 active projects

**Unauthenticated:**
- GIVEN no auth header
- WHEN they call `GET /api/projects`
- THEN the response SHALL return 401

---

### FR-02: Create project

**Happy path:**
- GIVEN an authenticated account
- WHEN they POST `{ name: "payments-service", application_url: "https://pay.myapp.com", description: "Payment service logs", environment: "production" }`
- THEN the response SHALL contain the new project with a `dsn` field formatted as `https://<publicKey>@<host>/<projectId>`
- AND a `project_keys` row SHALL be created with the new `public_key`

**Missing required field:**
- GIVEN an authenticated account
- WHEN they POST without `name`
- THEN the response SHALL return 400 with a validation error

---

### FR-03: Update project

**Happy path:**
- GIVEN an authenticated account and an existing project they own
- WHEN they PATCH `{ name: "payments-v2" }`
- THEN the response SHALL return the updated project
- AND only the patched field SHALL change

**Cross-account:**
- GIVEN account A and account B each own a project
- WHEN account A attempts to PATCH account B's project
- THEN the response SHALL return 403

---

### FR-04: Archive project

**Happy path:**
- GIVEN an authenticated account with a project
- WHEN they call `DELETE /api/projects/:id`
- THEN `archived_at` SHALL be set to the current timestamp
- AND the project's logs and keys SHALL remain in the database
- AND subsequent `GET /api/projects` SHALL not include the archived project

---

### FR-05: Rotate ingest key

**Happy path:**
- GIVEN an authenticated account and an existing project
- WHEN they POST `/api/projects/:id/rotate-key`
- THEN a new `public_key` SHALL be minted and saved in `project_keys`
- AND the old `public_key` row SHALL be deleted or deactivated
- AND the response SHALL contain the new DSN

**Old key rejected after rotation:**
- GIVEN the old `public_key`
- WHEN an envelope is POSTed using that key
- THEN the ingest endpoint SHALL return 401

---

### FR-06 / FR-07: Archived project behaviour

**Ingest blocked:**
- GIVEN a project with `archived_at` set
- WHEN an SDK POSTs an envelope to that project
- THEN the ingest endpoint SHALL return 403

---

### FR-08: Project card grid (UI)

**Happy path:**
- GIVEN a logged-in user with 3 projects
- WHEN the projects page loads
- THEN 3 cards SHALL render, each showing name, application_url, environment badge, and created date
- AND clicking a card SHALL open the project detail panel

**Empty state:**
- GIVEN a logged-in user with no projects
- WHEN the projects page loads
- THEN an empty state message SHALL render with a "Create project" call to action

---

### FR-09: Project detail panel — DSN

**Masked by default:**
- GIVEN the project detail panel is open
- THEN the DSN SHALL be masked (e.g. `https://••••••••@host/projectId`)
- AND a "reveal" control SHALL be present

**Reveal:**
- WHEN the user clicks "reveal"
- THEN the full DSN value SHALL be shown

**Copy DSN:**
- WHEN the user clicks the copy icon next to the DSN
- THEN the DSN string SHALL be copied to the clipboard

---

### FR-10: Delete confirmation dialog

**Confirmed:**
- GIVEN the user clicks "Archive" on a project card
- WHEN the confirmation dialog appears and the user confirms
- THEN `DELETE /api/projects/:id` SHALL be called and the card SHALL disappear from the grid

**Cancelled:**
- WHEN the user dismisses the confirmation dialog
- THEN no API call SHALL be made and the project SHALL remain in the grid

---

## 6. Constraints

### In Scope
- Project CRUD REST API (`GET`, `POST`, `PATCH`, `DELETE /api/projects`)
- Key rotation endpoint (`rotate-key`)
- Sequelize models: `Project` (with `archived_at`, `application_url`, `description`, `environment`) and `ProjectKey`
- Frontend: card grid, create form, detail panel with DSN, archive confirmation
- Auth: all endpoints require a valid account session (existing `requireAuth` middleware)

### Out of Scope
- Hard delete / permanent data purge — deferred
- Project restore / unarchive UI — deferred
- Project member / team sharing — no multi-user model yet
- Ingest rate-limit configuration per project — deferred
- Logs explorer UI — separate feature
- Read tokens — logs are accessed via account session auth; no per-project read credential needed

### Prohibitions
- SHALL NOT expose `public_key` in list (`GET /api/projects`) responses — detail panel only
- SHALL NOT allow cross-account project access — every write/read endpoint SHALL verify ownership
- SHALL NOT delete logs or project_keys rows on archive — soft delete only
- SHALL NOT skip the confirmation dialog before archiving from the UI

### Testing Approach
- TDD — write failing tests first for all backend endpoints and frontend components, then implement to pass
