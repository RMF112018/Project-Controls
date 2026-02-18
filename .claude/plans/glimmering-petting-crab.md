# Scalability Enhancements for SharePointDataService — Chunk 2

## Context

Chunk 1 added SP-INDEX annotations, LOAD-TEST comments, `performanceService` marks, `.select()` optimizations, batch parallelization, and `.top()` safety limits to 13 Active Projects Portfolio + Data Mart methods. All verification passed (TS, ESLint, 324 tests).

Chunk 2 applies the **same pattern** to the **Buyout, Commitments & Compliance** domain — 11 methods in lines ~2466–2901 of SharePointDataService.ts. These methods currently have NO try/catch error handling, NO performance instrumentation, and missing `.top()` safety limits.

---

## Files to Modify

| File | Change |
|---|---|
| `packages/hbc-sp-services/src/services/SharePointDataService.ts` | Add SP-INDEX + LOAD-TEST comments, perf marks, try/catch + handleError, `.top()` safety on 11 methods |

Single file change only. `performanceService` import already exists from Chunk 1.

---

## Step 1: `getBuyoutEntries` (line 2466)

- **Add**: SP-INDEX comment (`Buyout_Log → ProjectCode`), LOAD-TEST comment
- **Add**: `.top(500)` safety limit
- **Add**: `performanceService.startMark/endMark`
- **Wrap**: try/catch + `this.handleError('getBuyoutEntries', err, { entityType: 'BuyoutEntry', entityId: projectCode })`

## Step 2: `initializeBuyoutLog` (line 2475)

- **Add**: LOAD-TEST comment (14 standard divisions via batch, fixed count)
- **Add**: perf marks (with `endMark` on early return path `if (existing.length > 0)`)
- **Wrap**: try/catch + handleError

## Step 3: `addBuyoutEntry` (line 2501)

- **Add**: perf marks
- **Wrap**: try/catch + handleError

## Step 4: `updateBuyoutEntry` (line 2533)

- **Add**: LOAD-TEST comment (3 round trips: read → update → re-read)
- **Add**: perf marks
- **Wrap**: try/catch + handleError

## Step 5: `removeBuyoutEntry` (line 2588)

- **Add**: perf marks
- **Wrap**: try/catch + handleError

## Step 6: `submitCommitmentForApproval` (line 2707)

- **Add**: LOAD-TEST comment (re-fetches entire buyout list for single entry lookup)
- **Add**: perf marks
- **Wrap**: try/catch + handleError
- **Replace**: `throw new Error(...)` → `throw new DataServiceError(...)` for consistency

## Step 7: `respondToCommitmentApproval` (line 2743)

- **Add**: SP-INDEX comment (`Commitment_Approvals → ProjectCode, BuyoutEntryId, Status`), LOAD-TEST comment
- **Add**: perf marks
- **Wrap**: try/catch + handleError
- **Replace**: `throw new Error(...)` → `throw new DataServiceError(...)` (2 instances)

## Step 8: `getCommitmentApprovalHistory` (line 2797)

- **Add**: SP-INDEX comment (`Commitment_Approvals → ProjectCode, BuyoutEntryId`), LOAD-TEST comment
- **Add**: `.top(100)` safety limit
- **Add**: perf marks
- **Wrap**: try/catch + handleError

## Step 9: `uploadCommitmentDocument` (line 2819)

- **Add**: perf marks (outer try/catch wrapping AROUND existing inner try/catch for folder creation)
- **Wrap**: outer try/catch + handleError (preserve inner try/catch)

## Step 10: `getComplianceLog` (line 2852)

- **Add**: SP-INDEX comment (`Buyout_Log → SubcontractorName, ProjectCode, CommitmentStatus, EVerifyStatus`), LOAD-TEST comment
- **Add**: perf marks
- **Wrap**: try/catch + handleError
- Keep existing `.top(500)` as-is

## Step 11: `getComplianceSummary` (line 2890)

- **Add**: LOAD-TEST comment (inherits 500-item limit from getComplianceLog)
- **Add**: perf marks
- **Wrap**: try/catch + handleError

---

## Summary Table

| # | Method | SP-INDEX | LOAD-TEST | perf marks | .top() | try/catch |
|---|--------|----------|-----------|------------|--------|-----------|
| 1 | getBuyoutEntries | Yes | Yes | Yes | Add .top(500) | Yes |
| 2 | initializeBuyoutLog | — | Yes | Yes | — | Yes |
| 3 | addBuyoutEntry | — | — | Yes | — | Yes |
| 4 | updateBuyoutEntry | — | Yes | Yes | — | Yes |
| 5 | removeBuyoutEntry | — | — | Yes | — | Yes |
| 6 | submitCommitmentForApproval | — | Yes | Yes | — | Yes |
| 7 | respondToCommitmentApproval | Yes | Yes | Yes | — | Yes |
| 8 | getCommitmentApprovalHistory | Yes | Yes | Yes | Add .top(100) | Yes |
| 9 | uploadCommitmentDocument | — | — | Yes | — | Yes |
| 10 | getComplianceLog | Yes | Yes | Yes | Keep .top(500) | Yes |
| 11 | getComplianceSummary | — | Yes | Yes | — | Yes |

---

## Verification

```bash
volta run --node 22.14.0 npx tsc --noEmit
volta run --node 22.14.0 npm run lint
volta run --node 22.14.0 npx jest --ci
```

Run `/verify-changes` after implementation.

**Test impact**: Comments are zero-risk. Performance marks are no-ops in tests. `.top()` additions don't affect mocked queries. New try/catch wrapping adds error handling but doesn't change happy-path behavior. `DataServiceError` replacements match existing pattern.
