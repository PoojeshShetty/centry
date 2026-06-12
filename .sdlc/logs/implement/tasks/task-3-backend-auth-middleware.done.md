# Task 3 Completion: Backend — requireIngestKey and requireProjectOwner middleware

## Summary
Created `requireIngestKey` (parses `X-Sentry-Auth`, looks up `ProjectKey`, validates project match) and `requireProjectOwner` (fetches `Project` by id, checks `account_id === req.accountId`). Extended `express.d.ts` with `project?: Project` on the Request interface. 8 tests covering all 401/403/404/success paths.

## Commits
- `e27329c` test(logs): add failing tests for requireIngestKey and requireProjectOwner (FR-05, FR-06)
- `3d13585` feat(logs): implement requireIngestKey and requireProjectOwner middleware (FR-05, FR-06)

## Deviations
None

## Difficulties
None

## Notes
`requireIngestKey` uses `(projectKey as { project: Project }).project` for the eager-loaded association — Sequelize's TypeScript types don't model `include` results on the model class, so an explicit cast is necessary.
