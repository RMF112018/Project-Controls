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

**Motion Infrastructure** (`HbcMotion.ts`)
New `useEstimatingMotionStyles` hook with 5 presets, all ≤150ms (`tokens.durationFast`):

| Preset | Animation | Duration | Easing | Targets |
|--------|-----------|----------|--------|---------|
| `scoreTransition` | CSS transition on `color, background-color` | `durationFast` (~150ms) | `curveEasyEase` | Process score badge tier changes |
| `pillAppear` | Keyframe: opacity 0→1 + scale 0.9→1 | `durationFast` | `curveDecelerateMid` | Error badges, status pills |
| `badgeScaleIn` | Keyframe: opacity 0→1 + scale 0.8→1 | `durationFast` | `curveDecelerateMid` | Reviewed badge |
| `chevronRotate` | CSS transition on `transform` | `durationFast` | `curveDecelerateMid` | CollapsibleSection chevron |
| `accordionContent` / `accordionContentExpanded` | CSS grid-template-rows 0fr↔1fr | `durationNormal` (~200ms) | `curveDecelerateMid` | CollapsibleSection body |

**Reduced-Motion Support**
All presets include `@media (prefers-reduced-motion: reduce) { animationDuration/transitionDuration: tokens.durationUltraFast }`.

**PostBidAutopsyPage.tsx Changes**
- Score badge (`scoreGood`/`scoreMedium`/`scoreLow`): Added `transitionProperty: 'color'` with `durationFast` + `curveEasyEase`
- Error badges (3 instances): Added `pillAppear` class via `mergeClasses`
- Score tier class applied to process score `<span>` via `scoreTransition`

**DepartmentTrackingPage.tsx Changes**
- `statusPill` base class: Added keyframe animation (scale 0.9→1 + fade)
- `reviewedBadge` class: Added keyframe animation (scale 0.8→1 + fade)

**CollapsibleSection.tsx Changes**
- Replaced `max-height: 5000px` hack with CSS grid `grid-template-rows: 0fr↔1fr` transition
- Migrated inline styles to Griffel `makeStyles` with Fluent UI tokens
- Replaced `#fff` with `tokens.colorNeutralBackground1` (dark-mode compatible)
- Chevron rotation uses `chevronRotate` preset instead of inline `transition: transform 0.2s ease`

**Performance** — All animated properties are compositor-friendly (`opacity`, `transform`) or simple repaint (`color`, `background-color`, `grid-template-rows`). No layout thrashing. Zero new npm dependencies.

**Files Modified**
- `src/.../components/shared/HbcMotion.ts` (new `useEstimatingMotionStyles`)
- `src/.../components/shared/CollapsibleSection.tsx` (CSS grid accordion, token migration)
- `src/.../pages/project-hub/PostBidAutopsyPage.tsx` (score + error badge motion)
- `src/.../pages/preconstruction/DepartmentTrackingPage.tsx` (status pill + reviewed badge motion)

## Phase 6 Task 3: Comprehensive tests and accessibility audit (Estimating-specific)

**Status**: In Progress  
**Objective**: >90% coverage on Estimating surfaces + final Lighthouse audit.

**Success Criteria** (Estimating only)  
- Playwright tests for real-time scoring, validation blocking, motion  
- axe/WAVE zero violations on estimating pages  
- Lighthouse mobile ≥95 on estimating routes  

**End of Estimating-Specific Spec**