# Estimating Function UI Stabilization — Phase 3 Task 1

**Status**: In Progress
**Created**: 2026-03-01
**Scope**: `src/webparts/hbcProjectControls/components/pages/preconstruction/`

## Objective

Full Fluent UI v9 consistency and polish pass on all estimating pages to achieve:
- Zero accessibility violations (axe/WAVE — WCAG 2.2 AA)
- Design-token alignment (no hardcoded pixel values)
- Responsive tablet-optimized layouts (<768px vertical stacking, iPad portrait)
- Bundle-size target: <2.8 MB gzipped
- Lighthouse mobile score: >= 95

## Success Criteria

1. **Token Consistency**: All spacing, font sizes, border radii, and colors use Fluent UI v9 `tokens.*` or HBC `theme/tokens.ts` constants — zero hardcoded pixel values in `makeStyles`
2. **Accessibility**: Every interactive element has proper ARIA attributes; all charts have `ariaLabel`; forms have label associations; status indicators include text (not color-only)
3. **Data Fetching**: All components use TanStack Query (`useQuery`) — no `useEffect` for data fetching (CLAUDE.md rule #7)
4. **Performance**: All page components wrapped in `React.memo`; chart options memoized with `useMemo`; `staleTime >= 5 min` on all queries
5. **Responsive**: Three breakpoints (640px, 768px, 1024px) applied consistently; vertical stacking on <768px
6. **Keyboard Navigation**: All interactive elements reachable via Tab; Enter/Space activation

## Token Mapping (Hardcoded → Fluent)

| Hardcoded | Fluent Token | Context |
|-----------|-------------|---------|
| `'4px'` | `tokens.spacingVerticalXS` | Gap/padding |
| `'8px'` | `tokens.spacingVerticalS` | Gap/padding |
| `'12px'` | `tokens.spacingVerticalMNudge` | Gap/margin |
| `'16px'` | `tokens.spacingVerticalM` / `tokens.spacingHorizontalM` | Gap/padding |
| `'20px'` | `tokens.spacingVerticalL` | Padding |
| `'24px'` | `tokens.spacingVerticalL` / `tokens.spacingHorizontalL` | Gap |
| `'32px'` | `tokens.spacingVerticalXL` | Spacing |
| `'40px'` | `tokens.spacingVerticalXXL` | Padding |
| `'8px'` (radius) | `tokens.borderRadiusMedium` | Border-radius |
| `'12px'` (radius) | `tokens.borderRadiusLarge` | Border-radius |
| `'12px'` (font) | `tokens.fontSizeBase200` | Font-size |
| `'13px'` (font) | `tokens.fontSizeBase200` | Font-size |
| `'14px'` (font) | `tokens.fontSizeBase300` | Font-size |
| `'18px'` (font) | `tokens.fontSizeBase400` | Section title |
| `fontWeight: 500` | `tokens.fontWeightMedium` | Weight |
| `fontWeight: 600` | `tokens.fontWeightSemibold` | Weight |

## Accessibility Checklist

- [ ] All `HbcEChart` components have `ariaLabel` prop
- [ ] All `HbcDataTable` components have `ariaLabel` prop
- [ ] Chart sections wrapped in `role="region"` with `aria-label`
- [ ] Activity lists use `role="list"` / `role="listitem"` semantics
- [ ] Status indicators include visible text label (not color-only)
- [ ] Form fields have proper label-input associations via `HbcField`
- [ ] Required fields have `aria-required="true"`
- [ ] Validation errors linked via `aria-describedby`
- [ ] Error banners use `role="alert"` or `aria-live="assertive"`
- [ ] All focusable elements have visible focus indicators (`:focus-visible`)
- [ ] Touch targets minimum 44px (TOUCH_TARGET.min from tokens)

## Responsive Breakpoint Strategy

| Breakpoint | Name | Grid Behavior |
|-----------|------|---------------|
| >= 1024px | Desktop | Full multi-column grids |
| 768–1023px | Tablet | Reduced columns (2-3 KPIs per row) |
| < 768px | Mobile | Single column, stacked layout |

## Files Modified

| File | Changes |
|------|---------|
| `EstimatingDashboardPage.tsx` | Token alignment, inline→makeStyles, a11y, React.memo |
| `PreconDashboardPage.tsx` | Token alignment, a11y, React.memo |
| `DepartmentTrackingPage.tsx` | SPACING→tokens consistency, a11y attributes |
| `NewJobRequestsPage.tsx` | useEffect→useQuery, tokens, a11y, React.memo |
| `ProjectNumberRequestsPage.tsx` | A11y polish |
| `ProjectNumberRequestForm.tsx` | Form a11y, React.memo |
| `PipelinePage.tsx` | useEffect→useQuery, tokens, a11y, React.memo |
| `BDDashboardPage.tsx` | useEffect→useQuery, tokens, a11y, React.memo |
| `LeadManagementPage.tsx` | useEffect→useQuery, tokens, a11y, React.memo |
| `EstimatingProjectHubPage.tsx` | Tokens, React.memo |
| `useEstimatingDashboardData.ts` | staleTime check (useEffect remains — multi-call composition hook) |
| `usePreconDashboardData.ts` | staleTime check (useEffect remains — multi-call composition hook) |

---

## Phase 3 Task 2: Shared `useButtonStyles` Hook

**Status**: Complete
**Created**: 2026-03-01

### Objective

Centralize all button container and button variant styling into a single `useButtonStyles()` Griffel hook, eliminating duplicated `makeStyles` definitions across 6+ pages and ensuring zero hardcoded pixel values in button-related CSS.

### Hook API (`components/shared/useButtonStyles.ts`)

| Class | Purpose | Replaces |
|-------|---------|----------|
| `actionBar` | Full-width space-between bar (border-top, wrap) | PostBidAutopsyPage.actionBar, globalStyles.actionBar |
| `actionGroup` | Inline flex group within actionBar | PostBidAutopsyPage.actionGroup |
| `drawerFooter` | Right-aligned cancel/save footer (border-top) | DepartmentTrackingPage.drawerActions |
| `formActions` | Left-aligned submit row (no border) | ProjectNumberRequestForm.actions |
| `toolbar` | Space-between table toolbar | — (available for adoption) |
| `toolbarActions` | Compact icon-button row (right side) | DepartmentTrackingPage.toolbarActions |
| `exportBar` | Compact export-button container | ExportButtons.container |
| `exportLabel` | "Export:" label text | ExportButtons.label |
| `compact` | Small toolbar/export buttons (base200 font) | ExportButtons.btn |
| `toolbarEmphasis` | Semibold toolbar toggle button | DepartmentTrackingPage.meetingToolbarBtn |
| `iconOnly` | WCAG 2.2 SC 2.5.8 — 44px touch target | New (gap filled) |
| `iconOnlyPreferred` | 48px field-use touch target | New (gap filled) |

### Files Created

| File | Purpose |
|------|---------|
| `components/shared/useButtonStyles.ts` | Shared Griffel hook with 12 mergeable class names |

### Files Modified

| File | Changes |
|------|---------|
| `components/shared/index.ts` | Barrel export for `useButtonStyles` |
| `components/shared/ExportButtons.tsx` | Replaced 3 local hardcoded-px styles with hook classes |
| `components/shared/PageHeader.tsx` | Tokenized 6 hardcoded px values (margin, gap, fontSize, fontWeight) |
| `pages/preconstruction/DepartmentTrackingPage.tsx` | Replaced 4 local button container styles with hook classes |
| `pages/preconstruction/ProjectNumberRequestForm.tsx` | Replaced local `actions` style with `formActions` |
| `pages/project-hub/PostBidAutopsyPage.tsx` | Replaced `actionBar`/`actionGroup` hardcoded-px styles with hook classes |
| `theme/globalStyles.ts` | Tokenized actionBar, exportBar, exportLabel, paginationButton, paginationContainer, spinnerContainer |

### WCAG 2.2 AA Compliance

- `iconOnly`: enforces 44x44px minimum touch target (SC 2.5.8)
- `iconOnlyPreferred`: 48px target for construction job-site tablet use
- All focus-visible indicators inherited from Fluent UI v9 Button defaults

---

## Phase 3 Task 3: Inline Validation + Real-Time Scoring UI

**Status**: Complete
**Created**: 2026-03-01

### Objective

Add progressive-disclosure inline validation to the Post-Bid Autopsy form so that required-field errors are shown at the field level (not just as a transient toast), the process score badge includes error context, and the Finalize button is disabled until all required fields are valid.

### Validation Rules (3 Required Field Groups)

| Rule | Field | Error Message |
|------|-------|---------------|
| All process questions answered | `items[].answer !== null` | `N process question(s) not answered.` |
| Overall rating 1–10 | `overallRating >= 1 && <= 10` | `Overall rating must be between 1 and 10.` |
| At least 1 team member | `employees.length > 0` | `At least one team member is required.` |

### Progressive Disclosure Pattern

Errors are NOT shown on initial page load. They appear only after the user clicks "Finalize & Lock" for the first time (`hasAttemptedFinalize` state flag). This avoids error fatigue while ensuring clear feedback when the user attempts to lock the form.

### UI Changes

| Location | Change |
|----------|--------|
| Process table rows | Gold left-border (`3px solid warning`) on unanswered rows after first Finalize attempt |
| Process section badge | Score % + inline error count (e.g., "77% — 3 process question(s) not answered.") |
| Overall Rating label | Inline error text appended when rating is invalid |
| Employees section badge | Error message when no team members listed |
| Above action bar | `MessageBar intent="warning"` summary of all validation errors |
| Finalize button | Disabled after first attempt until valid; `Tooltip` explains why |

### Files Modified

| File | Changes |
|------|---------|
| `pages/project-hub/PostBidAutopsyPage.tsx` | +3 styles, +1 state, +2 memos, modified handleFinalize, +1 MessageBar, Tooltip-wrapped Finalize button, row indicators, 3 enhanced section badges |

### WCAG 2.2 AA Compliance

- Validation MessageBar uses `role="alert"` for screen reader announcements
- Disabled Finalize button uses `Tooltip` with `relationship="description"` for accessible error context
- Unanswered row indicator uses border (not color-only) — supplemented by section badge text
- All error messages are text-based, not color-only

---

## Phase 4 Task 1: Preconstruction Consolidation & Shared Infrastructure Migration

**Status**: Complete
**Created**: 2026-03-01

### Objective

Audit the full `preconstruction/` directory, extract reusable shared hooks and styling patterns into a new `project-hub/shared/` directory, and verify cross-directory import compatibility — all without functional changes to existing pages.

### Success Criteria

1. **Inventory**: All preconstruction/ pages listed and categorized in this spec
2. **Shared infrastructure**: `project-hub/shared/` barrel exports `useButtonStyles`, `useScoreTier`, `useToolbarConfig`
3. **Zero functional changes**: Import-path-only migration in consumer files
4. **Bundle size neutral**: Re-exports add no weight (tree-shaking)
5. **Cross-directory compatibility**: Both `PostBidAutopsyPage` (project-hub/) and `DepartmentTrackingPage` (preconstruction/) import from `project-hub/shared/`
6. **Traceability**: CHANGELOG.md updated with Phase 4 Task 1 entry

### Complete Preconstruction/ Inventory

| File | Lines | Category | Shared Patterns Used |
|------|-------|----------|---------------------|
| `BDDashboardPage.tsx` | 50 | Simple dashboard | PageHeader, KPICard, useQuery, makeStyles |
| `BDProjectHubPage.tsx` | 44 | Simple hub | PageHeader, HbcEmptyState |
| `BDDocumentsPage.tsx` | 6 | Placeholder | ComingSoonPage |
| `DepartmentTrackingPage.tsx` | 3,067 | Complex tracker | useButtonStyles, HbcDataTable, KickOffSection, SlideDrawer, RoleGate, ExportService, audit |
| `EstimatingDashboardPage.tsx` | 395 | Medium dashboard | useEstimatingDashboardData, KPICard, HbcEChart (3 charts) |
| `EstimatingDocumentsPage.tsx` | 6 | Placeholder | ComingSoonPage |
| `EstimatingProjectHubPage.tsx` | 46 | Simple hub | PageHeader, HbcEmptyState |
| `GoNoGoPage.tsx` | 6 | Delegator | GoNoGoScorecard (from project-hub) |
| `IDSDashboardPage.tsx` | 29 | Simple | PageHeader only |
| `IDSDocumentsPage.tsx` | 6 | Placeholder | ComingSoonPage |
| `IDSTrackingPage.tsx` | 6 | Placeholder | ComingSoonPage |
| `LeadManagementPage.tsx` | 55 | Simple table | PageHeader, HbcDataTable, useQuery |
| `NewJobRequestsPage.tsx` | 68 | Medium table | PageHeader, HbcDataTable, status pills |
| `PipelinePage.tsx` | 86 | Medium chart | PageHeader, HbcEChart, KPICard, useQuery |
| `PostBidAutopsiesPage.tsx` | 6 | Placeholder | ComingSoonPage |
| `PreconDashboardPage.tsx` | 422 | Medium dashboard | usePreconDashboardData, KPICard, HbcEChart (3 charts), navigation |
| `ProjectNumberRequestForm.tsx` | 581 | Complex form | useButtonStyles, HbcField, HbcCard, mutations |
| `ProjectNumberRequestsPage.tsx` | 271 | Medium table | KPICard, HbcDataTable, Badge, toast, navigation |

**Composition hooks** (preconstruction-local):

| File | Purpose |
|------|---------|
| `useEstimatingDashboardData.ts` | Multi-query composition for EstimatingDashboardPage KPIs + records |
| `usePreconDashboardData.ts` | Multi-query composition for PreconDashboardPage KPIs + cross-domain data |
| `index.ts` | Barrel re-exporting all 18 page components |

### Complexity Tier Summary

| Tier | Count | Files | Characteristics |
|------|-------|-------|----------------|
| Placeholder | 6 | BDDocs, EstDocs, IDSDocs, IDSTracking, PostBidAutopsies, GoNoGo | 6 lines each, ComingSoonPage or delegator |
| Simple | 5 | BDDashboard, BDProjectHub, EstProjectHub, IDSDashboard, LeadMgmt | 29–55 lines, PageHeader + 1 widget |
| Medium | 4 | Pipeline, NewJobRequests, PreconDashboard, ProjectNumberRequests | 68–422 lines, charts/tables + KPIs |
| Complex | 3 | EstimatingDashboard, ProjectNumberRequestForm, DepartmentTracking | 395–3,067 lines, multi-widget, mutations, audit |

### Shared Pattern Extraction Targets

| Pattern | Source(s) | Extracted To |
|---------|-----------|-------------|
| Button/container styles | components/shared/useButtonStyles.ts | Re-exported via project-hub/shared/ barrel |
| Score tier derivation | @hbc/sp-services scoreCalculator.ts | project-hub/shared/useScoreTier.ts (memoized hook) |
| Toolbar layout styles | DepartmentTrackingPage (36+ local classes) | project-hub/shared/useToolbarConfig.ts |

### Migration Strategy

1. **Re-export pattern**: `project-hub/shared/index.ts` re-exports `useButtonStyles` from `components/shared/` — single source of truth preserved
2. **New hooks**: `useScoreTier` and `useToolbarConfig` are created directly in `project-hub/shared/`
3. **Consumer updates**: PostBidAutopsyPage and DepartmentTrackingPage update import paths to use the new barrel
4. **Backward compatibility**: No pages break — imports resolve to the same underlying code
5. **Feature flags**: No flags created or modified

### Files Created

| File | Purpose |
|------|---------|
| `pages/project-hub/shared/index.ts` | Barrel export for hub-specific shared infrastructure |
| `pages/project-hub/shared/useScoreTier.ts` | Memoized React hook wrapping scoreCalculator utilities |
| `pages/project-hub/shared/useToolbarConfig.ts` | Griffel styles for toolbar layouts |

### Files Modified

| File | Changes |
|------|---------|
| `pages/project-hub/PostBidAutopsyPage.tsx` | `useButtonStyles` import path → `./shared` |
| `pages/preconstruction/DepartmentTrackingPage.tsx` | `useButtonStyles` import path → `../project-hub/shared` |
| `CHANGELOG.md` | Phase 4 Task 1 entry |
| `docs/specs/estimating-function-ui-stabilization.md` | This Phase 4 section |

---

## Phase 4 Task 2: Mutation UX Feedback — `useMutationWithToast`

**Objective**: Standardize mutation success/error toast feedback across all preconstruction and project-hub pages via a shared hook and utility, eliminating inconsistent inline `.then()/.catch()` toast chains.

### Preconstruction Audit

| Page | Mutations | Toasts | Action |
|------|-----------|--------|--------|
| DepartmentTrackingPage | 6 (4 silent kickoff ops) | 7 | **Migrated** — `useMutationWithToast` for `updateRecordMutation` |
| ProjectNumberRequestForm | 2 | 5 | **Migrated** — `withToastFeedback` for submit handler |
| ProjectNumberRequestsPage | 0 | 1 | No change — standalone `useEffect` notification |
| 15 other preconstruction pages | 0 | 0 | No change — read-only / display pages |
| PostBidAutopsyPage (project-hub) | 0 (via useEstimatingMutation) | 10 | **Migrated** — `withToastFeedback` for all mutation handlers |

### Two-Part API

`useEstimatingMutation` returns Promise-based callbacks (not `UseMutationResult`), so two complementary tools are provided:

**`withToastFeedback(fn, addToast, config)`** — Pure async utility wrapping any `Promise`-returning function. Used by PostBidAutopsyPage and ProjectNumberRequestForm where mutations return Promises via `mutateAsync()` or composition hooks.

**`useMutationWithToast(options)`** — Hook extending `useMutation` with automatic `onSuccess`/`onError` toast callbacks. Used by DepartmentTrackingPage for raw `useMutation` inline edits. Preserves full `UseMutationResult` including `isPending` for disabled-state logic.

### IToastConfig

| Property | Type | Default |
|----------|------|---------|
| `successMessage` | `string \| ((data, variables) => string)` | `undefined` (silent) |
| `errorMessage` | `string \| ((error, variables) => string)` | `'An error occurred.'` |
| `successDuration` | `number` | `4000` |
| `errorDuration` | `number` | `4000` |

### Files Created

| File | Purpose |
|------|---------|
| `pages/project-hub/shared/useMutationWithToast.ts` | `IToastConfig`, `withToastFeedback`, `useMutationWithToast` |

### Files Modified

| File | Changes |
|------|---------|
| `pages/project-hub/shared/index.ts` | Added barrel exports for mutation feedback utilities |
| `pages/project-hub/PostBidAutopsyPage.tsx` | 8 toast chains → `withToastFeedback`; 1 validation toast preserved |
| `pages/preconstruction/DepartmentTrackingPage.tsx` | `updateRecordMutation` → `useMutationWithToast`; manual toast calls removed from `handleInlineEdit` |
| `pages/preconstruction/ProjectNumberRequestForm.tsx` | Submit handler → `withToastFeedback` for create/update paths |
| `CHANGELOG.md` | Phase 4 Task 2 entry |
| `docs/specs/estimating-function-ui-stabilization.md` | This section |
