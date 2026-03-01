# Estimating Function UI Stabilization

**Status**: In Progress (Phase 6 active)  
**Created**: 2026-03-01  
**Scope**: Strictly limited to Estimating function surfaces (`PostBidAutopsyPage.tsx`, `DepartmentTrackingPage.tsx` / `EstimatingTracker.tsx`, and related estimating-specific logic only).

**Global UI Standards Reference**  
See `docs/specs/fluent-ui-v9-global-standards.md` for all token mappings, accessibility checklists, responsive strategies, dark-mode/high-contrast architecture, button theming, mutation UX, motion primitives, etc. This file contains **only** Estimating-specific polish, validation, scoring, and Phase 6 deliverables.

## Phase 3 Task 3: Inline Validation + Real-Time Scoring UI (Estimating-specific)

**Status**: Complete  
**Objective**: Live process score badge, field-level errors, and Finalize blocking on Post-Bid Autopsy form only.

**Validation Rules** (Estimating-specific)  
- All 13 process questions answered  
- Overall rating 1–10  
- At least 1 team member  

**UI Changes** (PostBidAutopsyPage.tsx only)  
- Gold left-border on unanswered rows after first Finalize attempt  
- Score badge with error count  
- MessageBar summary above action bar  
- Finalize button disabled + Tooltip until valid  

**Files Modified**  
- `src/webparts/hbcProjectControls/components/pages/project-hub/PostBidAutopsyPage.tsx`

## Phase 4 Task 1: Preconstruction Consolidation (Estimating surfaces only)

**Status**: Complete  
**Objective**: Audit and migrate Estimating-related shared infrastructure to `project-hub/shared/`.

**Estimating Inventory Excerpt**  
- `DepartmentTrackingPage.tsx` (complex tracker)  
- `PostBidAutopsyPage.tsx` (post-bid form)  
- `EstimatingDashboardPage.tsx` (dashboard)  

**Shared Infrastructure Migrated** (Estimating-only)  
- `useScoreTier.ts`  
- `useToolbarConfig.ts` (Estimating toolbar patterns only)  

**Files Modified**  
- `src/webparts/hbcProjectControls/components/pages/project-hub/shared/` (Estimating hooks)  
- `PostBidAutopsyPage.tsx` / `DepartmentTrackingPage.tsx` (import updates only)

## Phase 4 Task 2: Mutation UX Feedback (`useMutationWithToast`)

**Status**: Complete  
**Objective**: Estimating-specific mutation feedback standardization.

**Files Modified** (Estimating surfaces only)  
- `PostBidAutopsyPage.tsx`  
- `DepartmentTrackingPage.tsx`  
- `useMutationWithToast.ts` (in `project-hub/shared/` – Estimating usage)

## Phase 6 Task 2: Subtle micro-animations (Estimating-specific)

**Status**: Complete  
**Objective**: Fluent UI motion on badges, status pills, score tiers, and accordions in Estimating surfaces only.

**Files Modified**  
- `PostBidAutopsyPage.tsx`  
- `DepartmentTrackingPage.tsx` (Estimating badges/accordions only)

## Phase 6 Task 3: Comprehensive tests and accessibility audit (Estimating-specific)

**Status**: In Progress  
**Objective**: >90% coverage on Estimating surfaces + final Lighthouse audit.

**Success Criteria** (Estimating only)  
- Playwright tests for real-time scoring, validation blocking, motion  
- axe/WAVE zero violations on estimating pages  
- Lighthouse mobile ≥95 on estimating routes  

**End of Estimating-Specific Spec**