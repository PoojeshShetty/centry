# Task 2 Completion: Update AppShell to light theme

## Summary
Updated `AppShell.tsx` to use `theme.app.*` tokens throughout, replacing all dark `theme.bg.*` and `theme.border.*` references. Wrapped `Menu` in a `ConfigProvider` to apply `colorPrimary: theme.auth.accent` (`#3730a3`) as the active nav highlight via antd v5's design token API.

## Commits
- `ce3a063` feat(app-ui-theme-extension): update AppShell to light theme with indigo accent (FR-02)

## Deviations
- **Rule 1: Bug** — The design spec referred to "antd `<Menu theme>` prop" but antd v5 `Menu`'s `theme` prop only accepts `'light' | 'dark'`. Used `ConfigProvider` with `theme={{ token: { colorPrimary: ... } }}` instead — this is the correct antd v5 token API for overriding `colorPrimary` on a subtree.

## Difficulties
None.

## Notes
The `act()` warnings in the test output come from antd Menu's internal `useKeyRecords` hook; they are pre-existing and unrelated to this change.
