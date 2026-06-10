# Task 3 Completion: Implement AuthService and requireAuth middleware

## Summary
Added `AuthService` (`register`/`login`) with zod validation, bcryptjs hashing, case-insensitive
email normalization, and HS256 JWT signing (1h, payload `{ sub }`); plus the `requireAuth` Express
middleware that verifies the Bearer JWT, sets `req.accountId`, and 401s otherwise. Installed
`bcryptjs`, `jsonwebtoken`, `zod` (+ `@types/*`) and exported `AuthService` from `services/index.ts`.

## Commits
- `eafde60` test(auth-onboarding): add failing tests for AuthService and requireAuth (FR-01, FR-02, FR-03, FR-04, FR-05, FR-07, FR-08)
- `e06dd8a` feat(auth-onboarding): add AuthService and requireAuth middleware (FR-01, FR-02, FR-03, FR-04, FR-05, FR-07, FR-08)

## Deviations
- **Rule 2: Missing Critical** — `requireAuth` also 401s when a verified JWT has no `sub` claim (not
  just on verify-throw), closing a gap where a malformed-but-valid token could leave `accountId`
  undefined. Covered implicitly by the validation flow.
- Exported typed error classes `DuplicateEmailError` (409) and `InvalidCredentialsError` (401) from
  `auth.ts` so the task-4 router can map errors to status codes without string matching. Not named in
  the task spec but implied by the design's 409/401 contract.

## Difficulties
- `@types/bcryptjs@3.0.0` is a deprecated stub (bcryptjs v3 ships its own types). Installed per the
  Done Criteria; harmless — build and lint are clean with both present.
- zod v4 deprecates `z.string().email()` in favor of top-level `z.email()`; used `z.email()` for the
  register schema to avoid the deprecation. Login email uses `z.string().min(1)` (presence only) so a
  malformed login email yields a generic 401, not a 400 (no field disclosure, FR-05).

## Notes
- `JWT_SECRET` is read at call time from `process.env` with a `'dev-secret'` fallback; production must
  set it. Tests mock `jsonwebtoken`, so the secret value is not exercised.
- Express `Request.accountId?: string` augmentation lives in `src/types/express.d.ts` (picked up via
  tsconfig `include: ["src"]`).
- Task-4 (auth router) consumes `AuthService` + the exported error classes and mounts `requireAuth`
  on `GET /api/auth/me`.
- All 30 backend tests pass (14 new); `pnpm --filter @centry/backend build` and `pnpm lint` clean.
