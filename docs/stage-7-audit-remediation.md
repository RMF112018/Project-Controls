# Stage 7: P0-P2 Audit Remediation — Core Dashboard Pages

## Context

Two core dashboard pages — **ProjectHubDashboardPage** (163 lines, presentational) and **DepartmentTrackingPage** (2,600 lines, complex) — were flagged during the comprehensive audit performed at commit `2e69a44cb1806796c944dae81fe4cf3a3a38b453`. This document records all remediation work.

## Remediation Summary

| # | Priority | Item | Status | Files Modified |
|---|----------|------|--------|----------------|
| 1 | P0.1 | Eliminate inline style objects | Complete | DepartmentTrackingPage.tsx |
| 2 | P0.2 | Add React.Suspense + ErrorBoundary wrappers | Complete | ProjectHubDashboardPage.tsx, DepartmentTrackingPage.tsx |
| 3 | P1.1 | Wire useQueries for ProjectHubDashboardPage KPIs | Complete | ProjectHubDashboardPage.tsx, operations.ts |
| 4 | P1.2 | Tune virtualization config on department table | Complete | DepartmentTrackingPage.tsx |
| 5 | P1.3 | Verify useDeferredValue coverage | Complete (verified) | DepartmentTrackingPage.tsx |
| 6 | P2.1 | Extract DashboardKpiGrid.tsx reusable component | Complete | DashboardKpiGrid.tsx (new), KPICard.tsx, ProjectHubDashboardPage.tsx, DepartmentTrackingPage.tsx |
| 7 | P2.2 | Accessibility improvements | Complete | KPICard.tsx, DepartmentTrackingPage.tsx, DashboardKpiGrid.tsx |
| 8 | P2.3 | Resizable columns with localStorage persistence | Complete | HbcDataTable.tsx |

## Files Modified (9)

| File | Changes |
|------|---------|
| `src/.../pages/project-hub/ProjectHubDashboardPage.tsx` | P0.2 (Suspense/ErrorBoundary), P1.1 (useQueries for 5 KPIs from 3 queries), P2.1 (DashboardKpiGrid migration) |
| `src/.../pages/preconstruction/DepartmentTrackingPage.tsx` | P0.1 (13 inline styles eliminated), P0.2 (Suspense/ErrorBoundary), P1.2 (DEPT_VIRTUALIZATION constant), P1.3 (verified), P2.1 (DashboardKpiGrid migration, removed 6 unused styles), P2.2 (aria-live row count, title tooltips) |
| `src/.../components/common/DashboardKpiGrid.tsx` | **New file** — Reusable KPI grid with aria-live, loading skeleton |
| `src/.../components/shared/KPICard.tsx` | P2.1 (badge prop), P2.2 (role="group", aria-label, focus outline via createFocusOutlineStyle, keyboard Enter/Space handler, tabIndex) |
| `src/.../components/shared/HbcDataTable.tsx` | P2.3 (columnSizing in IStoredTableSettings, persistence read/write, internal state management) |
| `src/.../tanstack/query/queryOptions/operations.ts` | P1.1 (scheduleMetricsOptions, deliverablesOptions factories) |

## Detail: P0.1 — Inline Style Elimination

- 14 inline `style={}` occurrences identified in DepartmentTrackingPage
- 13 replaced with makeStyles classes: `statusPillPending`, `statusPillNeutral`, `statusPillSuccess`, `statusPillDanger`, `dashText`, `meetingNotesTextareaWrap`, `progressBarRow`, `progressBarTrackConstrained`, `exitMeetingBtn`, `searchInputConstrained`, `checklistGrid`, `sectionBannerEstimate/Pursuits/Precon`
- 1 retained (data-driven progress bar `width: ${percent}%`)

## Detail: P1.1 — KPI Query Architecture

Three parallel queries derive five KPI cards:
- `activeProjectsOptions` → Contract Value, % Complete, Cost Variance
- `scheduleMetricsOptions` → Schedule Variance (from earned value SV/SPI)
- `deliverablesOptions` → Open Deliverables (filtered by status !== Complete)

Loading state shows `SkeletonLoader`, error state shows retry button via `HbcEmptyState.actions`.

## Detail: P1.2 — Virtualization Tuning

Shared constant `DEPT_VIRTUALIZATION` applied to all 3 HbcDataTable instances:
- `estimateRowHeight: 44` (Fluent compact 40px + 4px buffer)
- `overscan: 5` (pre-render 5 rows above/below viewport)
- `adaptiveOverscan: true` (reduce at >500 rows)

## Detail: P2.3 — Column Sizing Persistence

- `IStoredTableSettings.columnSizing` added to HbcDataTable
- Internal `internalColumnSizing` state initialized from localStorage
- Resolved sizing written to localStorage on change
- Pattern mirrors existing `columnVisibility` persistence

## Verification

- TypeScript: `npx tsc --noEmit` — zero errors
- Tests: 62/66 suites pass, 1152/1192 tests pass (10 pre-existing failures in ProvisioningService.defaults.test.ts, unrelated to changes)
- DepartmentTrackingPage: Only 1 inline style remains (data-driven width)
- useDeferredValue: Confirmed at line 1692 feeding into filteredItems useMemo
