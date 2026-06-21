# Task 1: Extend theme.ts with auth colour tokens

## Trace
- **FR-IDs:** FR-06
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/frontend/src/theme.ts` — modify

## Design References
- design.md §Design Decisions (Light palette: theme.auth namespace in theme.ts)
- design.md §Design Decisions (Token values for theme.auth)

## Contracts (task-specific)

### Internal Interfaces
- `theme.auth` namespace added to existing `theme` object
  - Shape: `{ bg: string; bgAlt: string; accent: string; accentHover: string; text: string; textSecondary: string }`
  - Values: `bg: '#ffffff'`, `bgAlt: '#f5f7fa'`, `accent: '#3730a3'`, `accentHover: '#4338ca'`, `text: '#111827'`, `textSecondary: '#6b7280'`
  - Post: `theme.auth` is accessible to any component that imports `{ theme }` from `../../theme`

## Acceptance Criteria

### FR-06: Left panel colour palette
- GIVEN the left panel
- WHEN inspected
- THEN the background SHALL be white or off-white (`#ffffff` / `#f5f7fa`)
- AND the primary CTA button and links SHALL use the dark-blue accent colour (`#3730a3`)
- AND text SHALL be dark on the light background (not the app's dark-theme tokens)

## Done Criteria
- [ ] `theme.auth` namespace exists on the exported `theme` object with all 6 token keys
- [ ] `Theme` type (derived via `typeof theme`) is updated automatically — no manual type changes needed
- [ ] No existing references to `theme.bg`, `theme.text`, `theme.accent`, etc. are modified
- [ ] `pnpm build` passes (TypeScript compilation succeeds)
