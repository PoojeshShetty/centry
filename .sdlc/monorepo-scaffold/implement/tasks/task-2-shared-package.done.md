# Task 2 Completion: Create packages/shared with canonical types and parseEnvelope

## Summary
Created the `@centry/shared` package: `package.json` (exports `.` → `./src/index.ts`, `build`/`dev` scripts), `tsconfig.json` (extends `tsconfig.base.json`, `outDir: dist`, `rootDir: src`), and `src/index.ts` exporting all 7 items — `SeverityLevel` enum, `Attribute`, `LogItem`, `EnvelopeHeader`, `Envelope`, `EnvelopeParseError`, and the `parseEnvelope` stub. `tsc --build packages/shared` completes with zero errors.

## Commits
- `7ffc15b` feat(monorepo-scaffold): add @centry/shared types and parseEnvelope stub (FR-04, FR-05, FR-08, FR-09)

## Deviations
- **Rule 2: Missing Critical** — `package.json` includes `"type": "module"`, `"version": "0.0.0"`, and `"private": true` (not in spec). `type: module` aligns with the base config's `module: ESNext`; `version`/`private` silence pnpm warnings on a workspace package, matching the root precedent from Task 1.
- **No dependency added via `pnpm add`** — Done-criterion "Dependency added via pnpm add" was N/A: the package needs only `typescript` to build, which is hoisted from the workspace root. No package-level deps were required, so none were hand-written either (prohibition satisfied). `pnpm-lock.yaml` updated by `pnpm install` registering the new workspace project.

## Difficulties
None.

## Notes
- `EnvelopeParseError` sets `this.name = 'EnvelopeParseError'` so caught errors identify correctly.
- FR-04 cross-package import resolution (sdk/backend/frontend → `@centry/shared`) can only be fully exercised once those stubs exist in Task 3; the export surface and `moduleResolution: bundler` mapping are in place to support it.
