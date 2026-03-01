# Estimating → Post-Bid Autopsy Workflow Specification
**Live at commit:** current HEAD on `feature/hbc-suite-stabilization`
**Phase 2, Task 3 — March 2026**

## Purpose
Defines the end-to-end workflow from Estimating Tracker through Post-Bid Autopsy finalization,
including status transitions, audit trail, notifications, and Excel export.

## Lifecycle Position

```
Lead Discovery → Go/No-Go → Estimating Kickoff → Bid Submission → Win/Loss
                                                                       ↓
                                                              Post-Bid Autopsy
                                                                       ↓
                                                              Finalize & Archive
```

The Post-Bid Autopsy is the terminal Preconstruction step — a structured review of the
estimating process after bid outcome (win or loss). It captures 13 process questions,
SWOC analysis (Strengths, Weaknesses, Opportunities, Challenges), and closing metrics.

## Key Entities & File Paths

| Entity | Interface | File |
|--------|-----------|------|
| Estimating Tracker | `IEstimatingTracker` | `packages/hbc-sp-services/src/models/IEstimatingTracker.ts` |
| Post-Bid Autopsy | `IPostBidAutopsy` | `packages/hbc-sp-services/src/models/IPostBidAutopsy.ts` |
| Process Questions | `IPostBidAutopsyItem` | `packages/hbc-sp-services/src/models/IPostBidAutopsy.ts` |
| Question Config | `POST_BID_PROCESS_QUESTIONS` | `packages/hbc-sp-services/src/models/IPostBidAutopsy.ts` |
| SWOC Config | `SWOC_SECTIONS` | `packages/hbc-sp-services/src/models/IPostBidAutopsy.ts` |
| Service Helpers | `PostBidAutopsyService` | `packages/hbc-sp-services/src/services/PostBidAutopsyService.ts` |
| Mutation Hook | `useEstimatingMutation` | `src/.../tanstack/query/mutations/useEstimatingMutation.ts` |
| Page Component | `PostBidAutopsyPage` | `src/.../components/pages/project-hub/PostBidAutopsyPage.tsx` |

## Status Transitions

### IEstimatingTracker.PostBidStatus

| Status | Trigger | Description |
|--------|---------|-------------|
| `undefined` | Default | No autopsy exists for this tracker record |
| `'InProgress'` | `createAutopsy()` | Autopsy initialized from template |
| `'Completed'` | `finalizeAutopsy()` | Autopsy finalized and locked |

Status is synced automatically by `useEstimatingMutation` — the mutation hook
looks up the tracker record by `ProjectCode` and patches `PostBidStatus` + `PostBidAutopsyId`.

### IPostBidAutopsy.isFinalized

| State | Meaning |
|-------|---------|
| `false` | Autopsy is editable |
| `true` | Autopsy is locked — all fields read-only, finalization metadata populated |

## Audit Trail

All audit entries use the existing `AuditService` (debounced 2-second queue, fire-and-forget).

| Action | EntityType | When |
|--------|-----------|------|
| `Autopsy.Created` | `PostBidAutopsy` | `createAutopsy()` completes |
| `Autopsy.Updated` | `PostBidAutopsy` | `saveAutopsy()` completes |
| `Autopsy.Completed` | `PostBidAutopsy` | `finalizeAutopsy()` completes |

Wired in `useEstimatingMutation.ts` `onSettledEffects` callbacks.

## Notifications

| Event | Recipients | Trigger |
|-------|-----------|---------|
| `PostBidAutopsyCreated` | Estimator, Precon Manager | `createAutopsy()` |
| `AutopsyFinalized` | BD Manager, Leadership, Estimator, Precon Manager | `finalizeAutopsy()` |

Both use `NotificationService.notify()` in fire-and-forget mode.

## Excel Export

Multi-sheet Excel export via `PostBidAutopsyService.buildExcelExportData()`:

- **Sheet 1 "Process Review"**: 13+ rows — #, Question, Answer (Yes/No), Criteria, Weakness Notes
- **Sheet 2 "SWOC Analysis"**: 16 rows — Section, Prompt, Response
- **Sheet 3 "Summary"**: Process Score, Overall Rating, Overall %, Status, Team, Created/Finalized dates

Uses `ExportService.exportToExcelMultiSheet()` (lazy-loads xlsx via `LazyExportUtils`).

## Permissions

| Permission Key | Required For |
|---------------|-------------|
| `AUTOPSY_VIEW` | Viewing the Post-Bid Autopsy page (route-level guard) |
| `ESTIMATING_EDIT` | Creating, editing, and finalizing autopsies |

Both enforced at the TanStack Router `beforeLoad` level (no leaf-component checks needed).

## Business Rules & Invariants

1. One autopsy per project — uniquely keyed by `ProjectCode`.
2. All 13 process questions must be answered before finalization.
3. Overall rating must be 1–10.
4. At least one team member must be listed.
5. Finalization is irreversible — sets `isFinalized: true`, populates `finalizedBy` + `finalizedDate`.
6. SWOC "Challenges Found" section is confidential for hard-bid scenarios.
7. Custom questions can be added but not removed after creation.
8. Process score = (yes answers / total items) * 100, auto-calculated.

## Correctness Criteria

- PostBidStatus on tracker must always reflect the actual autopsy state.
- Audit entries must include projectCode for cross-entity traceability.
- Notification fire-and-forget — failures must not block UI or mutation flow.
- Excel export must produce valid .xlsx readable by Excel and Google Sheets.

## Failure Modes & Prevention

| Failure | Prevention |
|---------|-----------|
| Tracker status out of sync | Fire-and-forget catch block — non-critical |
| Notification delivery failure | `NotificationService.notify()` returns undefined silently |
| Excel export with empty data | `buildExcelExportData()` handles empty items/SWOC gracefully |
| Double finalization | `isFinalized` check in `validateForFinalization()` + UI button disabled |

Agent instruction: When touching PostBidAutopsyPage or useEstimatingMutation autopsy flows,
always reference this spec and the Phase 1 Task 1 mutation hook architecture.
