# Go/No-Go Scorecard Specification

**Document ID**: HBC-PC-GNG-001  
**Version**: 1.1 (aligned with Excel Version 1.1 – Updated Estimated Project $ scale and Self-Perform scoring)  
**Status**: Authoritative single source of truth  
**Last Updated**: 2026-03-01  
**Governing Instruction**: All development of `GoNoGoPage.tsx`, `@hbc/sp-services` Go/No-Go hooks, and any related components MUST retrieve this document first via MCP (`find_relevant_context`) before any implementation. No hard-coded values, labels, points, or logic allowed outside this spec.

## 1. Project Header Information (Auto-populated where possible)

Fields sourced from the Opportunity / Project entity (via TanStack Query from `@hbc/sp-services`):

- Date of Evaluation (Date)
- Originator (Person – defaults to current user)
- Department of Lead Origination (Choice: Business Development, Estimating, etc.)
- Project Name
- Client Name
- A/E
- City Location
- Region (Choice: West Palm, Orlando, Melbourne, S Florida, etc.)
- Sector
- Sub Sector
- Proposal/Bid Due
- Award Date
- Project Value (Currency)
- Delivery Method (Choice)
- Project Start Date
- Project Duration in Months
- Preconstruction Duration in Months
- Anticipated Fee %
- Anticipated Gross Margin
- Estimated Pursuit Cost
- Estimated Precon Budget
- Square Feet

## 2. Core Scoring Criteria (Exactly 19 – fixed order)

Both Originator (BD Lead) and GNG Committee score each criterion independently using a dropdown (Low / Average / High). Points and definitions are immutable.

| # | Criteria                                      | High (Points & Definition)                                      | Average (Points & Definition)                              | Low (Points & Definition)                                      |
|---|-----------------------------------------------|-----------------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------|
| 1 | Client Importance                             | **6** – Very Important                                          | **4** – Important                                          | **2** – Less Important                                         |
| 2 | Competition (short list)                      | **4** – 1-3 or weak                                             | **2** – 4-6 or average                                     | **0** – 7+ or strong                                           |
| 3 | Estimated Project $                           | **4** – $50M+                                                   | **2** – $10M–$49M                                          | **1** – Less than $10M                                         |
| 4 | Location/Environment                          | **5** – Local, favorable (no perdiems on staff, commute)       | **3** – Close, Average                                     | **1** – Distant, Severe                                        |
| 5 | Commercially Viable                           | **6** – Highest Probability to Break Ground                     | **4** – Average Risk                                       | **2** – High risk to start                                     |
| 6 | Preferred by the Decision Maker               | **6** – Yes                                                     | **3** – Neutral                                            | **0** – No or decision maker prefers other                     |
| 7 | A & E Experience                              | **5** – Successful previous experience                          | **4** – Mediocre previous experience                       | **1** – None or poor previous experience                       |
| 8 | Staff Availability                            | **4** – On Bench                                                | **2** – Available                                          | **1** – Must Hire                                              |
| 9 | Staff Experience In Project Type              | **5** – Extensive                                               | **3** – Average                                            | **0** – None                                                   |
|10 | Staff Experience in Geography                 | **5** – Extensive                                               | **3** – Some                                               | **0** – None                                                   |
|11 | Schedule                                      | **3** – Liberal                                                 | **2** – Manageable                                         | **1** – Difficult                                              |
|12 | Contract Terms/Conditions                     | **4** – Favorable                                               | **3** – Average                                            | **0** – Poor or Unknown                                        |
|13 | Type of Contract                              | **5** – Sole Source Neg.                                        | **4** – GMP/CM at Risk                                     | **1** – Bid                                                    |
|14 | Client Financing                              | **5** – Secure                                                  | **3** – Available                                          | **1** – Unknown                                                |
|15 | Supports sector diversification               | **7** – COE Sector                                              | **5** – Diverse Sector                                     | **2** – Neither                                                |
|16 | Investment Front End/Time Budgeting, Estimating, Mktg. | **5** – Small                                              | **2** – Average                                            | **1** – Significant                                            |
|17 | Profit Potential                              | **5** – > 4.5%                                                  | **3** – 4–4.5%                                             | **2** – < 4%                                                   |
|18 | Fee Enhancement (Subguard, Billable Rates, Savings Split or all) | **5** – All                                       | **3** – 2 out of 3                                         | **2** – 1 out of 3                                             |
|19 | Self Perform Potential                        | **3** – 2 or more scopes                                        | **2** – One scope                                          | **1** – None                                                   |

**Maximum Possible Scores** (for reference only – calculated dynamically from the criteria table above):
- All High selections: **92 points** (6+4+4+5+6+6+5+4+5+5+3+4+5+5+7+5+5+5+3)
- All Average selections: **57 points** (4+2+2+3+4+3+4+2+3+3+2+3+4+3+5+2+3+3+2)
- All Low selections: **19 points** (2+0+1+1+2+0+1+1+0+0+1+0+1+1+2+1+2+2+1)

> **Note**: Score thresholds are percentage-based: HIGH = 75% of 92 = **69**, MID = 60% of 92 = **55**. See `SCORE_THRESHOLDS` in `@hbc/sp-services/utils/constants.ts`.

## 3. Calculation Rules (must be implemented exactly)

```ts
// Pseudo-code – must match this logic in GoNoGoPage.tsx and services
const originatorTotal = sum of all 19 Originator points;
const committeeTotal = sum of all 19 Committee points;
const difference = committeeTotal - originatorTotal;

const getScoreColor = (score: number) => {
  if (score >= 75) return "green";     // Focus All Efforts
  if (score >= 60) return "amber";     // Pursue / Prioritize
  return "red";                        // Drop
};

## 4. SharePoint List Schema — Provisioning Notes

### Primary List: `GoNoGo_Scorecard` (constant: `HUB_LISTS.GONOGO_SCORECARD`)

#### Identity & Lookup Columns

| Column (Internal Name) | SP Type | Notes |
|-------------------------|---------|-------|
| `LeadID` | Number (Lookup to Leads_Master) | Foreign key to opportunity/lead |
| `ProjectCode` | Single line of text | Populated on Go decision when project is created |

#### Scoring Columns (38 total: 19 criteria × 2 scorers)

Each criterion has two Choice columns — one for the Originator (BD Lead) and one for the GNG Committee. Choice values are `High`, `Average`, `Low`. Point resolution happens client-side via the `SCORECARD_CRITERIA` lookup in `IGoNoGoScorecard.ts` — raw point values are never stored in SharePoint.

| Column Pattern | SP Type | Choices |
|----------------|---------|---------|
| `Criterion_01_Orig` through `Criterion_19_Orig` | Choice | High, Average, Low |
| `Criterion_01_Cmte` through `Criterion_19_Cmte` | Choice | High, Average, Low |

Full criterion-to-column mapping:

| # | Criterion Label | Originator Column | Committee Column |
|---|-----------------|-------------------|------------------|
| 1 | Client Importance | `Criterion_01_Orig` | `Criterion_01_Cmte` |
| 2 | Competition (short list) | `Criterion_02_Orig` | `Criterion_02_Cmte` |
| 3 | Estimated Project $ | `Criterion_03_Orig` | `Criterion_03_Cmte` |
| 4 | Location/Environment | `Criterion_04_Orig` | `Criterion_04_Cmte` |
| 5 | Commercially Viable | `Criterion_05_Orig` | `Criterion_05_Cmte` |
| 6 | Preferred by Decision Maker | `Criterion_06_Orig` | `Criterion_06_Cmte` |
| 7 | A&E Experience | `Criterion_07_Orig` | `Criterion_07_Cmte` |
| 8 | Staff Availability | `Criterion_08_Orig` | `Criterion_08_Cmte` |
| 9 | Staff Experience in Project Type | `Criterion_09_Orig` | `Criterion_09_Cmte` |
| 10 | Staff Experience in Geography | `Criterion_10_Orig` | `Criterion_10_Cmte` |
| 11 | Schedule | `Criterion_11_Orig` | `Criterion_11_Cmte` |
| 12 | Contract Terms/Conditions | `Criterion_12_Orig` | `Criterion_12_Cmte` |
| 13 | Type of Contract | `Criterion_13_Orig` | `Criterion_13_Cmte` |
| 14 | Client Financing | `Criterion_14_Orig` | `Criterion_14_Cmte` |
| 15 | Supports Sector Diversification | `Criterion_15_Orig` | `Criterion_15_Cmte` |
| 16 | Investment Front End/Time Budgeting | `Criterion_16_Orig` | `Criterion_16_Cmte` |
| 17 | Profit Potential | `Criterion_17_Orig` | `Criterion_17_Cmte` |
| 18 | Fee Enhancement | `Criterion_18_Orig` | `Criterion_18_Cmte` |
| 19 | Self Perform Potential | `Criterion_19_Orig` | `Criterion_19_Cmte` |

#### Calculated Total Columns

| Column | SP Type | Notes |
|--------|---------|-------|
| `TotalScore_Orig` | Number | Computed client-side via `calculateTotalScore(scores, 'originator')`, persisted on save |
| `TotalScore_Cmte` | Number | Computed client-side via `calculateTotalScore(scores, 'committee')`, persisted on save |

#### Scorer Metadata

| Column | SP Type | Notes |
|--------|---------|-------|
| `ScoredBy_Orig` | Person | Originator who entered scores |
| `ScoredBy_Cmte` | Person (multi-value) | Committee members who scored |
| `CommitteeScoresEnteredBy` | Single line of text | Email of person who entered committee scores |
| `CommitteeScoresEnteredDate` | DateTime | When committee scores were entered |
| `CommitteeMeetingDate` | DateTime | Scheduled GNG committee meeting date |

#### Decision & Strategy Fields

| Column | SP Type | Notes |
|--------|---------|-------|
| `Decision` | Choice | `Go`, `NoGo`, `ConditionalGo` (maps to `GoNoGoDecision` enum) |
| `DecisionDate` | DateTime | When final decision was recorded |
| `RecommendedDecision` | Choice | System-calculated recommendation |
| `FinalDecision` | Choice | Authoritative decision (may differ from recommended) |
| `FinalDecisionBy` | Single line of text | Email of decision maker |
| `FinalDecisionDate` | DateTime | When final decision was made |
| `ConditionalGoConditions` | Multi-line text (Plain) | Conditions for Conditional Go decisions |
| `DecisionMakerAdvocate` | Single line of text | Name of advocate for the project |
| `DecisionMakingProcess` | Multi-line text (Plain) | Notes on decision-making process |
| `HBDifferentiators` | Multi-line text (Plain) | HBC competitive differentiators |
| `WinStrategy` | Multi-line text (Plain) | Strategy for winning the pursuit |
| `StrategicPursuit` | Multi-line text (Plain) | Strategic pursuit rationale |

#### Commentary & Resource Fields

| Column | SP Type | Notes |
|--------|---------|-------|
| `OriginatorComments` | Multi-line text (Plain) | BD Lead general comments |
| `CommitteeComments` | Multi-line text (Plain) | GNG Committee general comments |
| `ProposalMarketingComments` | Multi-line text (Plain) | Marketing team input |
| `ProposalMarketingResources` | Single line of text | Assigned marketing resources |
| `ProposalMarketingHours` | Number | Estimated marketing hours |
| `EstimatingComments` | Multi-line text (Plain) | Estimating team input |
| `EstimatingResources` | Single line of text | Assigned estimating resources |
| `EstimatingHours` | Number | Estimated hours for estimating effort |

#### Workflow & Audit Fields

| Column | SP Type | Notes |
|--------|---------|-------|
| `ScorecardStatus` | Choice | 10 values from `ScorecardStatus` enum: BDDraft, AwaitingDirectorReview, DirectorReturnedForRevision, AwaitingCommitteeScoring, CommitteeReturnedForRevision, Rejected, NoGo, Go, Locked, Unlocked |
| `CurrentApprovalStep` | Number | Index of current step in active approval cycle |
| `IsLocked` | Yes/No | Whether scorecard is locked after final decision |
| `CurrentVersion` | Number | Incremented on unlock/relock cycles |
| `UnlockedBy` | Single line of text | Email of person who unlocked |
| `UnlockedDate` | DateTime | When scorecard was unlocked |
| `UnlockReason` | Multi-line text (Plain) | Reason for unlocking |
| `UnlockedSections` | Single line of text | JSON array of unlocked section keys, e.g. `["bd"]` |
| `IsArchived` | Yes/No | Whether scorecard is archived (immutable) |
| `ArchivedDate` | DateTime | When scorecard was archived |
| `ArchivedBy` | Single line of text | Email of person who archived |

### Related Lists

| List (Internal Name) | Constant | Purpose |
|----------------------|----------|---------|
| `GNG_Committee` | `HUB_LISTS.GNG_COMMITTEE` | Committee membership roster |
| `Scorecard_Approval_Cycles` | `HUB_LISTS.SCORECARD_APPROVAL_CYCLES` | Tracks approval cycle instances per scorecard |
| `Scorecard_Approval_Steps` | `HUB_LISTS.SCORECARD_APPROVAL_STEPS` | Individual approval steps within each cycle |
| `Scorecard_Versions` | `HUB_LISTS.SCORECARD_VERSIONS` | Historical snapshots of scores/decisions at each version |

## 5. Phase 3: Collaboration & Workflow

### 5.1 Per-Criterion Comments

Each of the 19 scoring criteria supports inline threaded comments via `IScorecardCriterionComment`:

```ts
interface IScorecardCriterionComment {
  id: number;
  scorecardId: number;
  criterionId: number;       // 1–19
  authorEmail: string;
  authorName: string;
  text: string;
  createdDate: string;       // ISO 8601
  editedDate?: string;
}
```

- Comments are append-only for conflict safety (no conflict detection needed)
- Users can edit/delete their own comments; editing stamps `editedDate`
- Rendered via `CriterionCommentPopover` in the 7th column of `ScoringTable`
- Badge count shows number of comments per criterion

### 5.2 Global Discussion Notes with @Mentions

Scorecard-level notes with Graph API @mention support via `IScorecardNote`:

```ts
interface IScorecardNote {
  id: number;
  scorecardId: number;
  authorEmail: string;
  authorName: string;
  text: string;
  mentions: string[];         // emails of @mentioned users
  createdDate: string;
  editedDate?: string;
}
```

- Notes are append-only (no edit/delete)
- @mentions resolved via `AzureADPeoplePicker` (multiSelect)
- Mentioned users receive `ScorecardNoteMentioned` notifications
- Rendered via `ScorecardNotePanel` in a `CollapsibleSection`

### 5.3 Per-Criterion Attribution

`IScorecardCriterionMeta` tracks last-edited attribution per criterion per scorer:

```ts
interface IScorecardCriterionMeta {
  [criterionId: number]: {
    lastEditedBy_orig?: string;  // email
    lastEditedAt_orig?: string;  // ISO
    lastEditedBy_cmte?: string;
    lastEditedAt_cmte?: string;
  };
}
```

- Rendered as 20px `LastEditedAvatar` inline in point cells of `ScoringTable`
- Tooltip shows "Last edited by {name} at {time}"

### 5.4 Concurrent Edit Detection

Timestamp-based last-writer-wins with user confirmation via `useConflictDetection` hook:

1. On mount/refetch, stores `scorecard.lastModifiedDate` as client baseline
2. Before each score mutation, compares server's `lastModifiedDate` against baseline
3. If server is newer, pauses mutation and shows `ConflictDialog` with three options:
   - **Overwrite**: Proceeds with mutation, updates baseline
   - **Reload**: Invalidates query, re-fetches fresh data
   - **Cancel**: Dismisses dialog, discards pending mutation
4. Only applies to score/field updates — comments and notes are append-only (no conflict)

### 5.5 Audit Trail UI

`ScorecardAuditLog` renders change history in a `CollapsibleSection` with two tabs:

- **Timeline**: Chronological audit entries grouped by date, each showing user, action badge, timestamp, and details
- **Versions**: Table of `IScorecardVersion` snapshots with version number, date, author, reason, originator/committee totals, and decision

### 5.6 New IDataService Methods (Phase 3)

| Method | Returns | Purpose |
|--------|---------|---------|
| `getScorecardComments(scorecardId)` | `IScorecardCriterionComment[]` | Load all comments for a scorecard |
| `addScorecardComment(scorecardId, criterionId, text, email, name)` | `IScorecardCriterionComment` | Add comment to a criterion |
| `updateScorecardComment(commentId, text)` | `IScorecardCriterionComment` | Edit own comment |
| `deleteScorecardComment(commentId)` | `void` | Delete own comment |
| `getScorecardNotes(scorecardId)` | `IScorecardNote[]` | Load all notes for a scorecard |
| `addScorecardNote(scorecardId, text, email, name, mentions)` | `IScorecardNote` | Add note with @mentions |
| `getScorecardAuditLog(scorecardId)` | `IAuditEntry[]` | Load filtered audit entries |

## 6. Phase 4: Polish, Export & Integration

### 6.1 Lead Data Auto-Fill

- `useGoNoGoLeadData(leadId)` fetches `ILead` via `dataService.getLeadById(leadId)` using `qk.leads.byId` query key
- `ProjectHeaderInfo` renders all 24 Section 1 header fields in responsive 2-column grid
- `clientName` passed to `ScoreSummaryHeader` from `lead.ClientName`
- Stale time: `QUERY_STALE_TIMES.leads` (60s)

### 6.2 Export

- `ExportButtons` with `pdfElementId="gonogo-print-area"` for html2canvas+jsPDF PDF export
- Excel/CSV/JSON export available when tabular data is passed
- `data-print-hide` attribute hides navigation and workflow controls in print/PDF output
- AppShell `@media print` rule hides `[data-print-hide]` elements globally

### 6.3 Loading & Error States

- `HbcSkeleton variant="form"` replaces raw Skeleton/SkeletonItem in loading state
- `RouteErrorBoundary` added as `errorComponent` on both GoNoGo detail routes
- Telemetry: chunk load errors tracked via `route:lazy:load:failure` event

### 6.4 Responsive Layout

- `ProjectHeaderInfo` grid collapses from 2 columns to 1 at 768px breakpoint
- All existing responsive behavior preserved (ScoringTable mobile cards, formGrid collapse)