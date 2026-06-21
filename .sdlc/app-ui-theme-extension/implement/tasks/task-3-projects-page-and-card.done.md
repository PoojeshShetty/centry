# Task 3 Completion: Update ProjectsPage, ProjectCard, and fix rotateKey in store

## Summary
Updated `ProjectCard` and `ProjectsPage` to use `theme.app.*` light tokens, wired card clicks to navigate to `/projects/:id` (removing `ProjectDetailPanel` from the page), and fixed `rotateKey` in `useProjectStore` to update `state.projects[]` in addition to `selectedProject`.

## Commits
- `3693f3a` feat(app-ui-theme-extension): fix rotateKey to update projects array (FR-06)
- `56e6f1c` feat(app-ui-theme-extension): update ProjectsPage, ProjectCard to light theme and navigate on click (FR-03, FR-04, FR-06)

## Deviations
None

## Difficulties
- The new FR-06 navigation test needed a custom minimal route tree (`[projects route, placeholder detail route]`) rather than the full `appRoutes`, because the `/projects/:projectId` route doesn't exist yet (added in a later task). Using the full appRoutes would render NotFoundPage on navigation, making the assertion fragile.
