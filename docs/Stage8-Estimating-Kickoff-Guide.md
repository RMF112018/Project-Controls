# Stage 8 -- Estimating Kickoff Template 100% Fidelity Guide

## Overview

Stage 8 delivers a config-driven Estimating Kickoff form that achieves 100% row and column fidelity with `reference/Estimating Kickoff Template.xlsx`. The same data renders identically on both:

1. **EstimatingKickoffPage** (`pages/precon/EstimatingKickoffPage.tsx`) -- full standalone page
2. **DepartmentTrackingPage** (`pages/preconstruction/DepartmentTrackingPage.tsx`) -- Project Details drawer (compact mode)

Both surfaces import from a **single source of truth**: `kickoffSectionConfigs.ts` in `@hbc/sp-services`.

---

## Field-by-Field Mapping: Excel to Code

### Section 1: PROJECT INFORMATION (11 rows)

| Excel Row | Model Field (`parentField`) | Config Column Key | Editor Type |
|-----------|----------------------------|-------------------|-------------|
| Job Name | `Title` (ILead) | `task` (readonly) + `value` (text) | text |
| Job Number | `ProjectCode` | `task` + `value` | text |
| Architect | `Architect` | `task` + `value` | text |
| Proposal Due Date and Time | `ProposalDueDateTime` | `task` + `value` | text |
| Proposal Delivery Method | `ProposalDeliveryMethod` | `task` + `value` | text |
| Copies if Hand Delivered | `CopiesIfHandDelivered` | `task` + `value` | text |
| Type of Proposal | `ProposalType` | `task` + `value` | text |
| RFI Format (Excel or Procore) | `RFIFormat` | `task` + `value` | text |
| Project Executive | `keyPersonnel:PX` | `task` + `value` | text |
| Primary Contact Person for Owner | `PrimaryOwnerContact` | `task` + `value` | text |
| Estimator(s) Assigned | `keyPersonnel:Lead Estimator` | `task` + `value` | text |

### Section 2: MANAGING INFORMATION (26 rows)

| Excel Column | Config Column Key | Editor Type |
|-------------|-------------------|-------------|
| Task | `task` | readonly |
| YES / NO | `status` | yes-no-na |
| Responsible | `responsibleParty` | text |
| Deadline/Frequency | `deadline` | text |
| Notes | `notes` | text |

**Rows (26)**: Finalize Sub Bid List in BC, Send ITB, Phone Calls for Sub coverage, Send Mass Messages in BC, Complete Bid Packages, Complete Scope Sheets, RFI Management (Point Person), Invite Project Team to Procore, Request Bid Bond from CFO, Request CCIP from CFO, Request financials from CFO, AIA Contract Review by Legal, Bid forms check, Builders Risk Insurance Quote, Review ITB Requirements, Warranty line item, Milestone Schedule, Detailed Precon Schedule, Detailed Project Schedule, Site Logistics Plan, BIM Modeling or Scanning, VDC Coordination, VDC Clash Detection, Request Revit Files, Assemble Closure Document Books, Submit Permit and NOC

### Section 3: ESTIMATING PREPARATION -- KEY DATES (6 rows)

| Excel Column | Config Column Key | Editor Type |
|-------------|-------------------|-------------|
| Task / Label | `task` | readonly |
| Responsible | `responsibleParty` | text |
| Deadline | `deadline` | date |
| Notes | `notes` | text |

| Excel Row | Parent Field |
|-----------|-------------|
| HB's Proposal Due | `HBProposalDue` |
| Subcontractor Proposals Due | `SubcontractorProposalsDue` |
| Pre-Submission Estimate Review | `PreSubmissionReview` |
| Win Strategy Meeting | `WinStrategyMeeting` |
| Subcontractor Site Walk-Thru | `SubcontractorSiteWalkThru` |
| Owner Estimate Review | `OwnerEstimateReview` |

### Section 4: FINAL DELIVERABLES -- STANDARD SECTIONS (16 rows)

| Excel Column | Config Column Key | Editor Type |
|-------------|-------------------|-------------|
| Tab Req'd? | `tabRequired` | checkbox |
| Deliverable | `task` | readonly |
| YES / NO | `status` | yes-no-na |
| Responsible | `responsibleParty` | text |
| Deadline | `deadline` | date |
| Notes | `notes` | text |

**Rows**: Front Cover (tab req'd), Executive Summary (tab req'd), Cost Summary (tab req'd), GC/GC Breakdown (optional), COW Breakdown (optional), List of Allowances (tab req'd), Clarifications and Assumptions (tab req'd), Value Analysis log (tab req'd), Schedule (tab req'd), Logistics Plan (tab req'd), List of Documents (tab req'd), Team Org Chart and Resumes, Previous Experience, BIM Proposal Required, By Who List, Back Cover (tab req'd)

### Section 5: FINAL DELIVERABLES -- NON-STANDARD SECTIONS (9 rows)

| Excel Column | Config Column Key | Editor Type |
|-------------|-------------------|-------------|
| Section | `task` | text (editable) |
| YES / NO | `status` | yes-no-na |
| Responsible | `responsibleParty` | text |
| Deadline | `deadline` | date |
| Notes | `notes` | text |

**Rows**: Financials, GC License, BIM, Contract, Bid Bond, Business Terms, Other (x3 custom)

---

## Architecture

### Single Source of Truth

```
@hbc/sp-services
  src/utils/kickoffSectionConfigs.ts    <-- ALL section/column definitions
  src/utils/estimatingKickoffTemplate.ts <-- Row templates (68 items)
  src/models/IEstimatingKickoff.ts      <-- Data model
  src/models/IKickoffConfig.ts          <-- Config interfaces
```

### Component Hierarchy

```
EstimatingKickoffPage
  -> KickOffSection (x5, one per config)
       -> CollapsibleSection
       -> <table> with inline-editable cells
            -> EditableTextCell / EditableDateCell / EditableYesNoNaCell / etc.

DepartmentTrackingPage (Project Details drawer)
  -> KickOffSection (x5, compact mode)
       -> Same rendering as above
```

### Data Flow

```
TanStack Query (kickoffByProjectOptions)
  -> useQuery fetches IEstimatingKickoff
  -> kickoff.items filtered by section
  -> KickOffSection renders each section
  -> Inline edit triggers useMutation
  -> Optimistic cache update + server persist
```

---

## Alignment Verification Checklist

- [ ] Both pages import `ALL_KICKOFF_SECTION_CONFIGS` from `@hbc/sp-services`
- [ ] No section/column definitions exist outside `kickoffSectionConfigs.ts`
- [ ] All 5 section headers match Excel exactly
- [ ] Column counts per section match: 2, 5, 4, 6, 5
- [ ] Row counts per section match: 11, 26, 6, 16, 9
- [ ] YES/NO/N/A tri-state renders for managing + deliverable sections
- [ ] Tab Required checkbox renders for standard deliverables only
- [ ] Date picker renders for key_dates deadline and deliverable deadlines
- [ ] "+ Add custom row" button appears in managing, standard, and non-standard sections
- [ ] Custom row removal (delete icon) appears only on custom rows
- [ ] Project Information reads from parent IEstimatingKickoff fields via parentField
- [ ] Key Dates read/write parent fields (HBProposalDue, etc.)
- [ ] DepartmentTrackingPage drawer renders sections in compact mode
- [ ] Edit controls hidden when user lacks PERMISSIONS.ESTIMATING_EDIT

---

## Setup and Development

### Prerequisites
- Node 22.14.0 (via volta)
- `@hbc/sp-services` package compiled: `cd packages/hbc-sp-services && npx tsc -p tsconfig.json`

### Running locally
```bash
npm run dev
# Navigate to Estimating Kickoff page via preconstruction routes
```

### Running tests
```bash
# Package tests (configs + template)
cd packages/hbc-sp-services && npx jest --testPathPattern="kickoffSectionConfigs|estimatingKickoffTemplate"

# Full package suite
cd packages/hbc-sp-services && npx jest

# Root type check
npx tsc --noEmit
```

---

## Maintenance: Adding New Rows or Columns

### Adding a new row
1. Edit `packages/hbc-sp-services/src/utils/estimatingKickoffTemplate.ts`
2. Add a new `TemplateEntry` in the appropriate section
3. If it maps to a parent field, add `parentField` and update `IEstimatingKickoff` if needed
4. Update the template test to reflect the new count

### Adding a new column
1. Edit `packages/hbc-sp-services/src/utils/kickoffSectionConfigs.ts`
2. Add a new `IKickoffColumnConfig` entry to the section's `columns` array
3. Ensure `IEstimatingKickoffItem` has the matching field (or add it)
4. Update the config test column counts

**Zero component changes required** -- the KickOffSection renderer is fully config-driven.

---

## Rollback

Revert to the commit prior to Stage 8 changes. All Stage 8 additions are additive:
- New files can be deleted
- Model extensions are backward-compatible (union type additions)
- DepartmentTrackingPage changes are isolated to import additions + drawer section

---

## Files Modified/Created

### New Files
| File | Purpose |
|------|---------|
| `packages/.../models/IKickoffConfig.ts` | Config interfaces |
| `packages/.../utils/kickoffSectionConfigs.ts` | Single source of truth |
| `src/.../tanstack/query/queryOptions/kickoffQueryOptions.ts` | Query-options factory |
| `src/.../shared/editableCells/*.tsx` | 7 editable cell components + barrel |
| `src/.../shared/KickOffSection.tsx` | Config-driven section renderer |
| `src/.../pages/precon/EstimatingKickoffPage.tsx` | Full kickoff page |
| `packages/.../__tests__/kickoffSectionConfigs.test.ts` | Config tests |
| `packages/.../__tests__/estimatingKickoffTemplate.test.ts` | Template tests |
| `docs/Stage8-Estimating-Kickoff-Guide.md` | This guide |

### Modified Files
| File | Change |
|------|--------|
| `packages/.../models/IEstimatingKickoff.ts` | Added `project_info`, `key_dates` sections + `WinStrategyMeeting` + `parentField` |
| `packages/.../models/index.ts` | Added IKickoffConfig export |
| `packages/.../index.ts` | Added kickoffSectionConfigs export |
| `packages/.../utils/estimatingKickoffTemplate.ts` | Added missing rows, parentField support |
| `packages/.../mock/estimatingKickoffs.json` | Added WinStrategyMeeting |
| `packages/.../services/MockDataService.ts` | Added WinStrategyMeeting + parentField passthrough |
| `packages/.../services/columnMappings.ts` | Added WinStrategyMeeting + parentField columns |
| `src/.../shared/index.ts` | Added KickOffSection + editableCells exports |
| `src/.../pages/preconstruction/DepartmentTrackingPage.tsx` | KickOffSection in drawer, TODO removed |
