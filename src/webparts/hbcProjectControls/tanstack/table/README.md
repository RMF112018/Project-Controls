# TanStack Table Integration (Phase 4 Wave 2)

## Purpose
`HbcTanStackTable` is the standard table wrapper for Phase 4 migration from legacy `DataTable`.
It preserves existing table contracts while using `@tanstack/react-table` for row models and state.

## Key Rules
- Keep table usage strictly typed with `IHbcTanStackTableColumn<TData>`.
- Preserve accessibility: sortable headers must be keyboard operable and expose `aria-sort`.
- Preserve dual-mode behavior: table layer must not couple to data source mode.
- Runtime migration is complete; legacy `DataTable` has been removed.
- Any attempt to import `shared/DataTable` is blocked by ESLint `no-restricted-imports`.

## Current Wave Coverage
- `ActiveProjectsDashboard` table blocks migrated.
- `DashboardPage` summary tables migrated.
- `PipelinePage` (Pipeline + Go/No-Go tables) migrated.
- `EstimatingDashboard` (Current Pursuits + Precon + Estimate Log tables) migrated.

## Virtualization Policy
- Use threshold-based virtualization only.
- Default config:
  - `enabled: true`
  - `threshold: 200`
- For row counts below threshold, render standard rows for simpler UX/a11y.

## API
- Component: `HbcTanStackTable<TData>`
- Props type: `IHbcTanStackTableProps<TData>`
- Column type: `IHbcTanStackTableColumn<TData>`
- Virtualization config: `IHbcVirtualizationConfig`

## Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npx jest -c jest.config.components.js --runInBand`
- `npx playwright test playwright/dashboard.spec.ts`
- `npx playwright test playwright/pipeline-estimating-table-wave2.spec.ts`
