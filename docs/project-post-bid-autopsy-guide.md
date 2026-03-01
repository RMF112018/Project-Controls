# Stage 21 — Post-Bid Autopsy Guide

## Overview

The Post-Bid Autopsy page replaces the Excel workbook "Estimating - Post Bid Autopsy.xlsx" with a fully digital, persistent, collaborative form within the HBC Project Controls application.

**Route**: `/project-hub/precon/post-bid`
**Permission**: `ESTIMATING_READ` (view), `ESTIMATING_EDIT` (edit)
**Source of Truth**: `reference/Estimating - Post Bid Autopsy.xlsx`, sheet "Bid Project Analysis _Feedback"

## Architecture

### Data Model

**`IPostBidAutopsy`** (`packages/hbc-sp-services/src/models/IPostBidAutopsy.ts`)

Hybrid design:
- **`items[]` array** — 13 estimating process questions (config-driven, supports custom additions)
- **16 flat text fields** — SWOC open-discussion prompts (type-safe, fixed structure)
- **Flat fields** — closing (rating, percentage, notes, SOP), team (employees), status (finalized)

### Service Layer

**`PostBidAutopsyService`** (`packages/hbc-sp-services/src/services/PostBidAutopsyService.ts`)

Static helper methods:
- `createDefaultItems(autopsyId)` — generates 13 default question items from `POST_BID_PROCESS_QUESTIONS`
- `createBlankAutopsy(id, projectCode, createdBy, leadId?)` — creates a full blank record
- `computeProcessScore(items)` — `(yesCount / totalItems) * 100`
- `computeCompletion(items)` — `(answeredCount / totalItems) * 100`
- `validateForFinalization(autopsy)` — returns validation error messages

### IDataService Methods

| Method | Description |
|--------|-------------|
| `getPostBidAutopsy(projectCode)` | Get autopsy by project code |
| `getPostBidAutopsyByLeadId(leadId)` | Get autopsy by lead ID |
| `createPostBidAutopsy(data)` | Create new autopsy with default items |
| `savePostBidAutopsy(data)` | Update existing autopsy (optimistic) |
| `finalizePostBidAutopsy(projectCode, data)` | Lock autopsy for archive |

### Query Layer

**Keys** (`qk.postBidAutopsy`):
- `base(scope)` — invalidation root
- `byProject(scope, projectCode)` — primary fetch key
- `byLeadId(scope, leadId)` — alternate lookup

**Options** (`postBidAutopsyQueryOptions.ts`):
- `postBidAutopsyByProjectOptions(scope, projectCode, dataService)`
- `postBidAutopsyByLeadIdOptions(scope, leadId, dataService)`

## Page Structure

```
PostBidAutopsyPage
├── PageHeader + Breadcrumb
├── KPI Cards (Process Score, Overall Rating, Status, Completion)
├── Estimating Process Review (CollapsibleSection)
│   ├── Table: # | Question | Yes/No | Weakness Notes
│   ├── 13 default rows + custom additions
│   └── Conditional notes (disabled when Yes)
├── Strengths (CollapsibleSection — 3 textareas)
├── Weaknesses (CollapsibleSection — 4 textareas)
├── Opportunities (CollapsibleSection — 4 textareas)
├── Challenges (CollapsibleSection — 5 textareas + confidential banner)
├── Summary & Closing (CollapsibleSection)
│   ├── Overall Rating (1-10 slider)
│   ├── Overall Percentage (0-100)
│   ├── General Notes, SOP Change Requests
│   └── Analysis Date
├── Employees in Project (AzureADPeoplePicker)
└── Action Bar (Export, Finalize & Lock)
```

## Excel Field Mapping

### Estimating Process Questions (13 items)

| # | Excel Row | Question | Criteria |
|---|-----------|----------|----------|
| 1 | 5 | Bid Expectation Timeline Realistic? | Y/N + Describe Issue |
| 2 | 6 | Scopes written before subs proposals? | >=15 days = Yes |
| 3 | 7 | Ensured 3 bids per major trade? | Y/N |
| 4 | 8 | ITB sent with reasonable time? | Y/N |
| 5 | 9 | All bids saved/submitted properly? | Y/N |
| 6 | 10 | Subs communicated multiple times? | Y/N |
| 7 | 11 | All proposals vetted & Compass Qualified? | Y/N |
| 8 | 12 | Reasonable spread between bidders? | <=5% = Yes |
| 9 | 13 | Prices per SF match historical data? | Y/N |
| 10 | 14 | VE options offered? | Y/N |
| 11 | 15 | Deliverables ready on time & latest templates? | Y/N |
| 12 | 16 | Estimate 90% ready for Resubmission Review? | Y/N |
| 13 | 17 | Met client's deadline? | Y/N |

### SWOC Sections (16 flat fields)

**Strengths**: `strengths_advantages`, `strengths_bestTurnout`, `strengths_shareWithTeam`
**Weaknesses**: `weaknesses_resourcesLacking`, `weaknesses_areasToImprove`, `weaknesses_mostChallenging`, `weaknesses_missedScopes`
**Opportunities**: `opportunities_lessonsLearned`, `opportunities_actionPlan`, `opportunities_sopSuggestions`, `opportunities_priceTrends`
**Challenges**: `challenges_obstacles`, `challenges_scopeKnowledge`, `challenges_communication`, `challenges_priceImpact`, `challenges_focusArea`

## User Workflow

1. Navigate to a project, then Preconstruction > Post-Bid Analysis
2. Click "Initialize from Template" to create the autopsy from default 13 questions
3. Answer each process question (Yes/No toggle)
4. When answering No, enter the weakness/issue description in the notes column
5. Complete each SWOC discussion section
6. Set the overall rating (1-10) and project percentage
7. Add team members via the people picker
8. Click "Finalize & Lock" when complete (requires all questions answered, rating 1-10, at least one employee)

## Development Notes

- **Process Score**: Auto-calculated from Yes/No answers. Updates in real-time via `useMemo`.
- **Optimistic Updates**: All saves use TanStack Query's `onMutate` for instant UI feedback.
- **Custom Questions**: Users can add custom questions via "+ Add custom question" button.
- **Finalization**: Irreversible lock. All fields become read-only. Date and user recorded.
- **Conditional Notes**: Notes column is always visible. Disabled (dimmed) when answer is Yes. Preserves text when toggling.

## Files Modified

| File | Change |
|------|--------|
| `packages/hbc-sp-services/src/models/IPostBidAutopsy.ts` | **New** — Model, types, configs |
| `packages/hbc-sp-services/src/services/PostBidAutopsyService.ts` | **Replaced** — Template factory, scoring |
| `packages/hbc-sp-services/src/services/IDataService.ts` | +5 methods |
| `packages/hbc-sp-services/src/services/MockDataService.ts` | +5 implementations |
| `packages/hbc-sp-services/src/services/SharePointDataService.ts` | +5 SP implementations |
| `packages/hbc-sp-services/src/models/index.ts` | +1 export |
| `packages/hbc-sp-services/src/services/index.ts` | +1 export |
| `src/.../pages/project-hub/PostBidAutopsyPage.tsx` | **Replaced** — Full page |
| `src/.../tanstack/query/queryKeys.ts` | +postBidAutopsy keys |
| `src/.../tanstack/query/queryOptions/postBidAutopsyQueryOptions.ts` | **New** — Query options |
| `src/.../tanstack/router/workspaces/routes.projecthub.tsx` | Swapped route component |
| `packages/hbc-sp-services/src/models/IEstimatingTracker.ts` | Removed completed TODO |
| `CHANGELOG.md` | Stage 21 entry |
