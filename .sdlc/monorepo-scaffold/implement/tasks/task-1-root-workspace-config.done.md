# Task 1 Completion: Create root workspace config

## Summary
Created the pnpm monorepo root: `pnpm-workspace.yaml` (lists `packages/*`), root `package.json` (name `centry`, private, 5 workspace scripts), `tsconfig.base.json` (strict + composite + `moduleResolution: bundler`), and `.gitignore`. TypeScript added via `pnpm add -w -D` so no versions are hand-authored. `pnpm install` runs clean.

## Commits
- `63b229c` chore(monorepo-scaffold): create root workspace config (FR-01, FR-02, FR-03, FR-09)

## Deviations
- **Rule 2: Missing Critical** — added `*.tsbuildinfo` to `.gitignore` (beyond spec's node_modules/dist/.env); `tsc --build` emits these incremental-build files and they should not be tracked.
- Added `version: "0.0.0"` to root `package.json` to silence pnpm's missing-version warning on a private workspace root.

## Difficulties
- pnpm was not visible on the Bash tool's PATH; confirmed by user it runs in their shell — used it directly.
- Commit message picked up a stray `@` line: PowerShell here-string syntax (`-m @'...'@`) was passed through the Bash tool, which does not interpret it. The commit content/files are correct; only the message has a leading/trailing `@`. Left as-is per `--no-commit` (no amend). Fix later with `git commit --amend` if a clean message is wanted.

## Notes
- Installed `typescript` resolved to `6.0.3` (latest), written by pnpm.
- `tsconfig.base.json` intentionally omits `outDir` — per the design decision, compiled output is per-package `dist/`.
- `eslint`/`prettier` are referenced in the `lint`/`format` scripts but their deps are deferred to Task 4 (infra-and-tooling); scripts only fail if invoked before then, which does not affect `pnpm install`.
- Future bash commits in this repo: use a heredoc (`git commit -F-  <<'EOF'`) or a temp file, not PowerShell `@'...'@`.
