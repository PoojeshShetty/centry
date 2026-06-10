# Requirements: Authentication & Onboarding

## 1. Project

- Path: `.` (the current `centry` monorepo — backend `packages/backend`, frontend `packages/frontend`)
- Base branch: `dev`
- Feature branch: `feature/auth-onboarding`

---

## 2. Purpose

Enable self-service authentication and onboarding for centry: users can register with
name/email/password, log in, view their account, and log out. A protected home screen greets the
signed-in user by name and is reachable only when authenticated. This adds the human-facing
authentication layer that `plan.md` previously deferred, distinct from the existing machine/admin
auth schemes (ingest key / read token / admin token).

---

## 3. User Stories

- As a new user, I want to register with my name, email, and password, so that I can create an account on centry.
- As a new user, I want to be told if my email is already registered, so that I know to log in instead of signing up again.
- As a returning user, I want to log in with my email and password, so that I can access my account.
- As a returning user, I want to be told when my credentials are wrong, so that I can correct them and try again.
- As a logged-in user, I want to land on a home screen that greets me by name ("Hello \<username>"), so that I know I'm signed in to my own account.
- As a logged-in user, I want to view my own account information, so that I can confirm the details associated with my account.
- As a logged-in user, I want to log out, so that I can end my session securely.
- As a logged-in user, I want the home screen to be accessible only when I'm signed in (and be sent to login otherwise), so that my account stays protected.

---

## 4. Functional Requirements

### Backend (Express + Sequelize)

- FR-01: The system SHALL provide a registration endpoint that accepts a name, email, and password, and creates an account whose password is stored only as a secure cryptographic hash.
- FR-02: The system SHALL reject registration with a clear "email already registered" response when the submitted email already belongs to an account, and SHALL NOT create a second account.
- FR-03: The system SHALL validate registration input — name SHALL be non-empty, email SHALL be well-formed, and password SHALL be at least 8 characters — and reject invalid input without persisting anything.
- FR-04: The system SHALL provide a login endpoint that accepts an email and password and, on a correct match, returns a signed JWT.
- FR-05: The system SHALL respond to any login failure (unknown email or wrong password) with the same generic "invalid email or password" message and SHALL NOT disclose which field was wrong.
- FR-06: The system SHALL provide an authenticated "current account" endpoint that returns the signed-in account's name, email, and creation date.
- FR-07: The system SHALL protect authenticated routes with JWT verification middleware that rejects missing, invalid, or expired tokens with HTTP 401.
- FR-08: The system SHALL NOT store passwords in plaintext, SHALL NOT include the password hash in any API response, and SHALL NOT write passwords or tokens to logs.

### Frontend (React + Vite)

- FR-09: The user SHALL be able to register via a registration page collecting name, email, and password; on success the user becomes authenticated and lands on the home screen.
- FR-10: The user SHALL be able to log in via a login page collecting email and password; on success the JWT is persisted and the user lands on the home screen.
- FR-11: The frontend SHALL display the duplicate-email error (registration) and the invalid-credentials error (login) inline on the relevant form.
- FR-12: The home screen SHALL greet the signed-in user with "Hello \<name>".
- FR-13: The frontend SHALL provide an account-information view showing the user's name, email, and member-since date.
- FR-14: The user SHALL be able to log out via a control that discards the stored token and returns the user to the login page.
- FR-15: The home and account routes SHALL be reachable only when authenticated; an unauthenticated visit SHALL redirect to the login page.

---

## 5. Acceptance Criteria

### FR-01: Register a new account

**Happy path:**
- GIVEN no account exists for "alice@example.com"
- WHEN a registration request is made with name "Alice", email "alice@example.com", password "hunter2!" (≥8 chars)
- THEN the system SHALL create exactly one account (SHALL)
- AND the stored record SHALL contain a password hash, not the plaintext password
- AND the user SHALL be authenticated (a usable session/token is established)

### FR-02: Duplicate email at registration

**Failure path:**
- GIVEN an account already exists for "alice@example.com"
- WHEN a registration request is made with email "alice@example.com"
- THEN the system SHALL reject the request with a clear "email already registered" response (SHALL)
- AND the system SHALL NOT create a second account
- AND no JWT/session SHALL be issued

### FR-03: Registration input validation

**Failure paths:**
- GIVEN a registration request with an empty name
- WHEN it is submitted
- THEN the system SHALL reject it with a validation error and persist nothing (SHALL)

- GIVEN a registration request with a malformed email "alice@"
- WHEN it is submitted
- THEN the system SHALL reject it with a validation error and persist nothing (SHALL)

**Boundary:**
- GIVEN a registration request with a 7-character password
- WHEN it is submitted
- THEN the system SHALL reject it for failing the 8-character minimum (SHALL)
- AND a request with an 8-character password SHALL be accepted

### FR-04: Log in with valid credentials

**Happy path:**
- GIVEN a registered account with email "alice@example.com" and password "hunter2!"
- WHEN a login request is made with those exact credentials
- THEN the system SHALL respond with success and a signed JWT (SHALL)

**Edge case (case-insensitive email):**
- GIVEN a registered account stored under "alice@example.com"
- WHEN a login request uses "Alice@Example.com" with the correct password
- THEN the system SHALL match the account and issue a JWT (SHALL)

### FR-05: Log in with invalid credentials

**Failure paths:**
- GIVEN a registered account with email "alice@example.com"
- WHEN a login request is made with the wrong password
- THEN the system SHALL respond with HTTP 401 and the generic message "invalid email or password" (SHALL)
- AND the response SHALL NOT indicate that the email was valid

- GIVEN no account exists for "ghost@example.com"
- WHEN a login request is made for that email
- THEN the system SHALL respond with HTTP 401 and the identical generic message "invalid email or password" (SHALL)

### FR-06: View current account information

**Happy path:**
- GIVEN a logged-in user with a valid JWT
- WHEN they request the current-account endpoint
- THEN the system SHALL return the account's name, email, and creation date (SHALL)
- AND the response SHALL NOT include the password hash

### FR-07: Protected routes require a valid token

**Failure paths:**
- GIVEN a request to an authenticated endpoint with no Authorization header
- WHEN it is received
- THEN the system SHALL respond with HTTP 401 (SHALL)

- GIVEN a request with a malformed or tampered JWT
- WHEN it is received
- THEN the system SHALL respond with HTTP 401 (SHALL)

**Edge case (expiry):**
- GIVEN a JWT whose expiry has passed
- WHEN it is presented to an authenticated endpoint
- THEN the system SHALL respond with HTTP 401 (SHALL)

### FR-08: Credential safety

**Security checks:**
- GIVEN an account created via registration
- WHEN its database record is inspected
- THEN the password column SHALL contain a hash and never the plaintext password (SHALL)
- AND no registration or login API response SHALL contain the password hash
- AND no log line emitted during registration or login SHALL contain the password or the JWT

### FR-09: Register from the UI

**Happy path:**
- GIVEN a user on the registration page
- WHEN they submit a valid name, email, and password
- THEN the app SHALL authenticate them and navigate to the home screen (SHALL)

### FR-10: Log in from the UI

**Happy path:**
- GIVEN a user on the login page with valid credentials
- WHEN they submit the form
- THEN the app SHALL persist the returned JWT and navigate to the home screen (SHALL)

### FR-11: Inline error display

**Failure paths:**
- GIVEN a user submitting the registration form with an already-registered email
- WHEN the backend rejects it
- THEN the form SHALL display an inline "email already registered" message (SHALL)

- GIVEN a user submitting the login form with wrong credentials
- WHEN the backend rejects it
- THEN the form SHALL display an inline "invalid email or password" message (SHALL)

### FR-12: Personalised home greeting

**Happy path:**
- GIVEN a logged-in user named "Alice"
- WHEN the home screen renders
- THEN it SHALL display "Hello Alice" (SHALL)

### FR-13: Account-information view

**Happy path:**
- GIVEN a logged-in user
- WHEN they open the account-information view
- THEN it SHALL display their name, email, and member-since date (SHALL)
- AND it SHALL NOT display any password information

### FR-14: Log out

**Happy path:**
- GIVEN a logged-in user
- WHEN they activate the logout control
- THEN the app SHALL discard the stored token and navigate to the login page (SHALL)

**Edge case:**
- GIVEN a user who has just logged out
- WHEN they use the browser back button or revisit a protected route
- THEN the app SHALL NOT restore the session and SHALL redirect to login (SHALL)

### FR-15: Route protection

**Failure path:**
- GIVEN an unauthenticated visitor
- WHEN they navigate directly to the home or account route
- THEN the app SHALL redirect them to the login page (SHALL)

**Happy path:**
- GIVEN that same visitor then logs in successfully
- WHEN authentication completes
- THEN the app SHALL allow access to the home screen (SHALL)

---

## 6. Constraints

### In Scope
- Extend the existing `accounts` model/table with `email` and `password_hash` columns (an account is the login identity).
- Backend: registration endpoint, login endpoint, current-account ("me") endpoint, and JWT verification middleware.
- Password hashing on registration and verification on login.
- Frontend: registration page, login page, protected home screen with "Hello \<name>", account-information view, and logout control.
- Frontend auth state (zustand store) with the JWT persisted in `localStorage` and sent as `Authorization: Bearer <token>`.

### Out of Scope
- Password reset / forgot-password flow — deferred; not covered by the user stories.
- Email verification / confirmation emails — deferred; no mail infrastructure in the project.
- "Remember me" and refresh tokens — deferred; a single short-lived JWT is sufficient for the MVP.
- OAuth / social login — deferred; out of scope for the initial auth layer.
- Linking authenticated users to the Project/tenancy model (Account → Project → Key) — deferred; this feature delivers identity/auth only and leaves the existing tenancy relationships untouched beyond adding auth columns.
- Account edit/delete and change-password — deferred; FR-06/FR-13 are read-only.
- Rate-limiting of auth endpoints — deferred; Redis is not yet wired up in the backend.

### Prohibitions
- SHALL NOT store passwords in plaintext — credentials must always be hashed.
- SHALL NOT return the password hash in any API response — prevents credential leakage.
- SHALL NOT log passwords or JWTs — prevents secret leakage via logs.
- SHALL NOT reveal which field was wrong on login failure — prevents account enumeration.
- SHALL NOT modify or weaken the existing ingest-key, read-token, or admin-token machine-auth schemes — this feature is additive and must not regress machine auth.

### Testing Approach
- TDD — write failing tests first, then implement to pass. Backend tests use **Vitest** (`packages/backend`), frontend tests use **Jest** (`packages/frontend`), per CLAUDE.md. Applies to backend auth logic (hashing, login, JWT middleware, validation) and frontend pages/routing/auth state.
