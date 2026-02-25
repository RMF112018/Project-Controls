# Phase 5D: Cross-cutting Quality & Governance

## Context

The resilient-data-operations SKILL.md v1.1 lists two "Critical Flows Guaranteed Stable" items that remain unimplemented: **GraphBatchEnforcer** (auto-batching coalescence) and **ListThresholdGuard** (Audit_Log paging safety). Additionally, `@hbc/sp-services` coverage thresholds sit at 30/20/25/30 — far below the ≥80% target for production release. No connector-specific Playwright E2E tests exist. No `SECURITY_ANALYSIS.md` or `DATA_ARCHITECTURE.md` reference docs exist. Phase 5D closes all of these governance gaps.

**Baseline:** 276 IDataService methods (no new methods needed). 837 tests passing. 57 feature flags (IDs 1–57).

---

## 1. Files to Create

| # | Path | Purpose |
|---|------|---------|
| 1 | `packages/hbc-sp-services/src/services/GraphBatchEnforcer.ts` | Auto-batching coalescence (10ms window, threshold 3) |
| 2 | `packages/hbc-sp-services/src/utils/ListThresholdGuard.ts` | SP list item count safety utility (warn 3000, force-page 4500) |
| 3 | `packages/hbc-sp-services/src/services/__tests__/GraphBatchEnforcer.test.ts` | Enforcer unit tests |
| 4 | `packages/hbc-sp-services/src/utils/__tests__/ListThresholdGuard.test.ts` | Guard unit tests |
| 5 | `playwright/connectors.e2e.spec.ts` | Connector sync E2E (admin grid, status, drawer, role-based visibility) |
| 6 | `.claude/SECURITY_ANALYSIS.md` | Graph scopes, MSAL flow, no-secrets, RBAC enforcement summary |
| 7 | `.claude/DATA_ARCHITECTURE.md` | columnMappings, list threshold strategy, Audit_Log patterns, IDataService inventory |

---

## 2. Files to Modify

| # | Path | Change |
|---|------|--------|
| 1 | `packages/hbc-sp-services/src/models/enums.ts` | Add `AuditAction.ListThresholdWarning`, `AuditAction.BatchEnforcerCoalesced`, `EntityType.ListThreshold` |
| 2 | `packages/hbc-sp-services/src/mock/featureFlags.json` | Add id 58 `GraphBatchingEnabled` (default OFF) |
| 3 | `packages/hbc-sp-services/src/services/index.ts` | Export `GraphBatchEnforcer`, `graphBatchEnforcer` |
| 4 | `packages/hbc-sp-services/src/utils/index.ts` | Export `ListThresholdGuard`, threshold constants |
| 5 | `packages/hbc-sp-services/src/utils/constants.ts` | Add `LIST_THRESHOLD_WARNING = 3000`, `LIST_THRESHOLD_CRITICAL = 4500`, `CACHE_KEYS.AUDIT_LOG` |
| 6 | `packages/hbc-sp-services/jest.config.js` | Raise `coverageThreshold` to 80/60/70/80 (Phase 5D interim) |
| 7 | `src/.../pages/admin/ConnectorManagementPanel.tsx` | Add `data-testid` attributes for Playwright targeting |
| 8 | `playwright/provisioning-saga.e2e.spec.ts` | Expand with provisioning governance E2E scenarios |
| 9 | `CLAUDE.md` | Update §7, §15, §16, §18 |
| 10 | `.claude/skills/resilient-data-operations/SKILL.md` | Update to v1.2 with enforcer + guard implementation details |

---

## 3. Technical Approach

### 3A. GraphBatchEnforcer (10ms coalescence, threshold 3, feature-gated)

**File:** `packages/hbc-sp-services/src/services/GraphBatchEnforcer.ts`

**Design:** Composition wrapper around `GraphBatchService`. Queues incoming `IBatchRequest` objects. Flushes automatically when:
- Queue reaches >3 requests, OR
- 10ms coalescence timer expires (whichever comes first)

```
class GraphBatchEnforcer {
  private queue: Array<{ request: IBatchRequest; resolve; reject }> = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly COALESCENCE_MS = 10;
  private readonly THRESHOLD = 3;

  constructor(
    private batchService: GraphBatchService,
    private isFeatureEnabled: (flag: string) => boolean,
    private auditLogger?: GraphAuditLogger
  )

  async enqueue(request: IBatchRequest): Promise<IBatchResponse>
    - If GraphBatchingEnabled OFF → pass-through to single-request execution
    - If ON → push to queue, start/reset timer, check threshold

  private flush(): void
    - Drain queue, call batchService.executeBatch()
    - Resolve/reject individual promises by matching response IDs
    - Audit log: BatchEnforcerCoalesced action with count

  dispose(): void
    - Clear timer, reject pending
}

export const graphBatchEnforcer = new GraphBatchEnforcer(graphBatchService, () => false);
```

**Key decisions:**
- Returns `Promise<IBatchResponse>` per request (callers don't need to know about batching)
- Promise-based deferred pattern: each enqueued request gets its own resolve/reject
- Singleton exported, but `isFeatureEnabled` injected at initialization (same injection pattern used elsewhere)
- Timer uses `setTimeout`/`clearTimeout` — no `setInterval` (one-shot per coalescence window)
- When flag OFF: zero overhead, direct pass-through

**Tests (12+ cases):**
1. Flag OFF → single request passes through directly (no batching)
2. Flag ON → 1-2 requests within 10ms → flushed after timer
3. Flag ON → 4 requests → immediate flush at threshold (before timer)
4. Multiple flush cycles → independent
5. Promise resolution by matching response ID
6. Promise rejection on batch failure
7. Audit logging on coalescence
8. dispose() clears timer and rejects pending
9. Mixed: 3 requests + 1 late arrival → two flushes
10. Empty queue → no flush call
11. Timer reset on new request within window
12. Pass-through mode performance (no timer allocation)

### 3B. ListThresholdGuard (warn 3000, force cursor paging 4500)

**File:** `packages/hbc-sp-services/src/utils/ListThresholdGuard.ts`

**Design:** Pure utility class, no React dependencies.

```
export enum ThresholdLevel { Safe = 'safe', Warning = 'warning', Critical = 'critical' }

export interface IThresholdResult {
  level: ThresholdLevel;
  itemCount: number;
  threshold: number;
  message: string;
  shouldForceCursorPaging: boolean;
}

export class ListThresholdGuard {
  constructor(
    private warningThreshold: number = LIST_THRESHOLD_WARNING,  // 3000
    private criticalThreshold: number = LIST_THRESHOLD_CRITICAL  // 4500
  )

  checkThreshold(listName: string, itemCount: number): IThresholdResult
    - < 3000 → Safe, shouldForceCursorPaging: false
    - 3000–4499 → Warning, shouldForceCursorPaging: false (but warn)
    - ≥ 4500 → Critical, shouldForceCursorPaging: true

  static shouldUseCursorPaging(
    itemCount: number,
    isInfinitePagingEnabled: boolean
  ): boolean
    - Returns true if itemCount ≥ 4500 AND InfinitePagingEnabled flag is ON
    - Returns false otherwise (graceful degradation when flag OFF)
}

export const listThresholdGuard = new ListThresholdGuard();
```

**Integration into SharePointDataService:**
- In `getAuditLog()` (line ~668): Before query execution, call `listThresholdGuard.checkThreshold('Audit_Log', count)`. If critical and `InfinitePagingEnabled` is ON, auto-redirect to `getAuditLogPage()`.
- Fire-and-forget `logAudit()` with `AuditAction.ListThresholdWarning` when warning or critical.
- **Note:** This is an additive guard in SharePointDataService only. MockDataService does NOT need threshold checks (in-memory arrays don't have SP 5000-item limits).

**Tests (8+ cases):**
1. Safe: 500 items → safe, no force-paging
2. Warning boundary: 3000 items → warning, no force-paging
3. Warning range: 3500 items → warning
4. Critical boundary: 4500 items → critical, shouldForceCursorPaging true
5. Critical over: 5000 items → critical
6. Zero items → safe
7. `shouldUseCursorPaging` static: 4500 + flag ON → true
8. `shouldUseCursorPaging` static: 4500 + flag OFF → false (graceful degradation)

### 3C. Coverage Ramp to ≥80% on @hbc/sp-services

**Current state:** `coverageThreshold` in `packages/hbc-sp-services/jest.config.js`:
```
statements: 30, branches: 20, functions: 25, lines: 30
```

**Phase 5D target:**
```
statements: 80, branches: 60, functions: 70, lines: 80
```

**Approach:**
1. Run `npx jest --coverage` first to measure the current actual coverage (likely already above 60% given 771 sp-services tests)
2. Add the ~20 new tests for GraphBatchEnforcer (12) and ListThresholdGuard (8)
3. If still below 80/60/70/80, identify under-tested service files and write targeted gap-filling tests (likely MockDataService edge cases, utility functions, or ConnectorRegistry/adapter paths)
4. Update `coverageThreshold.global` to the final target only after confirming actual coverage meets it
5. If coverage naturally meets the target → single jump. If not → write gap tests until it does.

**Action:** Update `coverageThreshold.global` in `jest.config.js` lines 38-43. Run `npx jest --coverage` to verify the new thresholds pass before committing.

### 3D. SECURITY_ANALYSIS.md and DATA_ARCHITECTURE.md

**Both are NEW files** in `.claude/` directory. The SKILL.md references them but they don't exist.

**`.claude/SECURITY_ANALYSIS.md`** (~150 lines):
- Three-mode auth architecture (mock/standalone/sharepoint)
- MSAL 5.x browser OAuth flow (standalone mode only)
- Graph API scopes (Sites.FullControl, Group.ReadWrite.All, User.Read)
- No-secrets policy: MSAL packages only in `dev/auth/`, never in `src/` or `@hbc/sp-services`
- RBAC enforcement: RoleGate + FeatureGate, 6 canonical roles, IRoleConfiguration
- SOC2 audit trail: logAudit() on every mutation, IAuditSnapshot on role/config changes
- Connector security: per-adapter retry policies, no direct graphClient access outside service layer
- Real-time messaging: client-side projectCode filtering (server-side groups deferred to Phase 6)

**`.claude/DATA_ARCHITECTURE.md`** (~200 lines):
- IDataService abstraction (276 methods, 3 implementations)
- columnMappings.ts pattern — never hard-code SP column names
- List inventory: HUB_LISTS (47 entries) + PROJECT_LISTS (47 entries)
- Cursor-based paging infrastructure: ICursorToken/Request/Result
- List threshold strategy: ListThresholdGuard (3000 warn, 4500 force-page, 5000 SP hard limit)
- Audit_Log patterns: logAudit(), getAuditLog(), getAuditLogPage(), purgeOldAuditEntries()
- Cache strategy: CACHE_KEYS, CACHE_TTL_MS (15 min), TanStack Query defaults
- Data backends: DataProviderFactory (sharepoint/azuresql/dataverse)
- Bundle governance: chunk strategy, MONITORED_CHUNKS, bundle-budget.spfx.json

### 3E. Playwright E2E Specs for Connector Sync and Provisioning Governance

**New file: `playwright/connectors.e2e.spec.ts`** (~100 lines)

**Prerequisites:** Add `data-testid` attributes to `ConnectorManagementPanel.tsx`:
- `data-testid="connector-grid"` on grid container
- `data-testid="connector-card-{connectorId}"` on each card
- `data-testid="connector-status-{connectorId}"` on status badges
- `data-testid="connector-test-btn-{connectorId}"` on Test buttons
- `data-testid="connector-sync-btn-{connectorId}"` on Sync Now buttons
- `data-testid="connector-history-btn-{connectorId}"` on History buttons
- `data-testid="sync-history-drawer"` on Drawer component

**Tests (5 cases):**
1. Admin connectors page renders grid with Procore and BambooHR cards
2. Connector cards display correct status badges (Active)
3. Clicking History button opens sync history drawer
4. SuperAdmin sees both connectors; role-based visibility verified
5. Connector cards show sync direction info (Bidirectional vs Inbound)

**Expand `playwright/provisioning-saga.e2e.spec.ts`** (+2 tests):
6. Feature flag OFF → legacy progress text shown, no expanded view
7. Admin provisioning page shows KPI summary cards with correct data

**Pattern:** Follow existing E2E spec conventions:
- Import `roleFixture` and `dismissWhatsNew`
- `switchRole('SuperAdmin')` → navigate → assert visibility
- `toBeVisible({ timeout: 10_000 })` for async content

---

## 4. Trade-off Table

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| Enforcer location | New class in services/ | Extend GraphBatchService | **A — new class** | Composition > inheritance; keeps GraphBatchService untouched |
| Coalescence timer | setTimeout (one-shot) | setInterval (polling) | **A — setTimeout** | Reset-on-arrival pattern; no wasted ticks |
| Threshold guard | Utility class in utils/ | React hook | **A — utility class** | Used by SharePointDataService (non-React); hooks can wrap later |
| Coverage target | Jump to 80/60/70/80 now | Staged 60% interim | **A — jump now** | Measure first, write gap tests only where needed; 771 sp-services tests likely near target already |
| ListThresholdGuard in Mock | Add threshold checks | Skip (in-memory safe) | **B — skip** | In-memory arrays don't hit SP 5000-item limit; guard is SP-specific |
| Feature flag for enforcer | Reuse existing flag | New `GraphBatchingEnabled` | **B — new flag** | Dedicated flag (id 58) per feature-flag discipline |
| New IDataService methods | Add getListItemCount() | Use SP REST /_api/lists | **B — SP REST inline** | No new IDataService methods; count is SP-specific infrastructure |
| SECURITY/DATA docs | Full 500+ line docs | Concise ~150-200 line refs | **B — concise** | These are agent reference docs, not user-facing; lean principle |

---

## 5. Implementation Checklist

| # | Task | Acceptance Criteria |
|---|------|--------------------|
| 1 | Add `AuditAction.ListThresholdWarning`, `AuditAction.BatchEnforcerCoalesced`, `EntityType.ListThreshold` to `enums.ts` | TypeScript compiles. Enum values follow existing naming pattern (`ListThreshold.Warning`, `Batch.EnforcerCoalesced`). |
| 2 | Add `LIST_THRESHOLD_WARNING = 3000`, `LIST_THRESHOLD_CRITICAL = 4500`, `CACHE_KEYS.AUDIT_LOG = 'hbc_audit_log'` to `constants.ts` | Constants exported and importable. |
| 3 | Register `GraphBatchingEnabled` feature flag (id 58) in `featureFlags.json` | Flag has `Enabled: false`, category `Infrastructure`, notes reference Phase 5D. |
| 4 | Create `ListThresholdGuard.ts` in `utils/` | `checkThreshold()` returns correct `ThresholdLevel` for safe/warning/critical ranges. `shouldUseCursorPaging()` static works with flag parameter. |
| 5 | Create `ListThresholdGuard.test.ts` with ≥8 test cases | All boundary conditions tested: 0, 2999, 3000, 3500, 4499, 4500, 5000. Static method tested with flag ON/OFF. |
| 6 | Export `ListThresholdGuard` + constants from `utils/index.ts` | Named imports work from `@hbc/sp-services`. |
| 7 | Create `GraphBatchEnforcer.ts` in `services/` | Coalescence at 10ms, threshold at 3. Pass-through when flag OFF. Singleton exported. Audit logging on coalescence. |
| 8 | Create `GraphBatchEnforcer.test.ts` with ≥12 test cases | Flag OFF pass-through, timer flush, threshold flush, promise resolution/rejection, dispose cleanup, audit logging all tested. |
| 9 | Export `GraphBatchEnforcer` from `services/index.ts` | Named import works from `@hbc/sp-services`. |
| 10 | Compile `@hbc/sp-services` (`tsc -p tsconfig.json`) | Zero errors. lib/ output updated. |
| 11 | Root TypeScript compilation (`npx tsc --noEmit`) | Zero errors. |
| 12 | Add `data-testid` attributes to `ConnectorManagementPanel.tsx` | 7 testid attributes added: grid, card-{id}, status-{id}, test-btn-{id}, sync-btn-{id}, history-btn-{id}, sync-history-drawer. |
| 13 | Create `playwright/connectors.e2e.spec.ts` with 5 test cases | Admin grid renders, status badges visible, history drawer opens, role-based visibility, sync direction displayed. |
| 14 | Expand `playwright/provisioning-saga.e2e.spec.ts` with +2 tests | Legacy text progress when flag OFF, KPI summary cards validated. |
| 15 | Raise `coverageThreshold` in `jest.config.js` to 80/60/70/80 | `npx jest --coverage` passes with new thresholds. |
| 16 | Create `.claude/SECURITY_ANALYSIS.md` (~150 lines) | Covers: 3-mode auth, MSAL scopes, no-secrets policy, RBAC enforcement, SOC2 audit, connector security. |
| 17 | Create `.claude/DATA_ARCHITECTURE.md` (~200 lines) | Covers: IDataService inventory, columnMappings, list threshold strategy, cursor paging, cache strategy, bundle governance. |
| 18 | Update `.claude/skills/resilient-data-operations/SKILL.md` to v1.2 | Add GraphBatchEnforcer section, ListThresholdGuard section, update file references. |
| 19 | Update `CLAUDE.md` §7, §15, §16, §18 with Phase 5D diffs (see §6 below) | All four sections updated. Last Updated header refreshed. |
| 20 | Run full verification: `npm run verify:sprint3` + `npm run verify:bundle-size:fail` | All tests pass (837 + ~20 new ≈ 857+). Bundle within budget. Coverage thresholds met. TypeScript clean. |

---

## 6. CLAUDE.md Diff Specifications

### §7 — Service Methods Status
**Replace** the current §7 content with:
```
**Total methods**: 276
**Implemented**: 276
**Remaining stubs**: 0 — **DATA LAYER COMPLETE**

Last major additions: Phase 5D Cross-cutting Governance (Feb 2026) — No new IDataService methods. GraphBatchEnforcer (10ms coalescence, threshold 3, feature-gated GraphBatchingEnabled). ListThresholdGuard utility (warn at 3000, force cursor paging at 4500 for Audit_Log). Coverage ramp to 80/60/70/80. SECURITY_ANALYSIS.md + DATA_ARCHITECTURE.md created. Connector + provisioning E2E specs. ~20 new Jest tests (~857 total).
```

### §15 — Current Phase Status
**Append** after Phase 5C entry:
```
- Phase 5D: Cross-cutting Quality & Governance — **COMPLETE** on `feature/hbc-suite-stabilization`. GraphBatchEnforcer (10ms coalescence, threshold 3, feature flag GraphBatchingEnabled id 58). ListThresholdGuard (3000 warn, 4500 force-page). Coverage ramp 80/60/70/80. SECURITY_ANALYSIS.md + DATA_ARCHITECTURE.md created. Connector E2E (5 tests) + expanded provisioning E2E (+2 tests). resilient-data-operations SKILL v1.2. ~857 tests passing.
```

### §16 — Active Pitfalls & Rules
**Append** these rules after the existing `getStepState()` entry:
```
- **GraphBatchEnforcer coalescence window is 10ms**: Timer resets on every new enqueue. Threshold of 3 triggers immediate flush. When `GraphBatchingEnabled` OFF, zero overhead pass-through.
- **GraphBatchEnforcer is composition, not inheritance**: Wraps `GraphBatchService.executeBatch()`. Never extend or modify GraphBatchService for auto-batching.
- **ListThresholdGuard thresholds**: Warning at 3000, critical at 4500. SP hard limit is 5000. Guard is for SharePointDataService only — MockDataService skips threshold checks.
- **ListThresholdGuard + InfinitePagingEnabled dual-gate**: `shouldUseCursorPaging()` requires BOTH itemCount ≥ 4500 AND flag ON. Graceful degradation when flag OFF.
- **No new IDataService methods for Phase 5D**: GraphBatchEnforcer and ListThresholdGuard are infrastructure utilities, not data layer methods. Method count stays at 276.
```

### §18 — Roadmap
**No structural changes.** Phase 5D falls within the existing Phase 4/5 timeline. The §15 entry provides the status update.

---

## 7. SKILL.md Recommendation

**Update `resilient-data-operations/SKILL.md` to v1.2:**

1. Change frontmatter `version: 1.2`, `updated: 2026-02-2x` (execution date)
2. Add `GraphBatchEnforcer, ListThresholdGuard` to triggers
3. **Add new section** after existing Phase 5C content:

```
**GraphBatchEnforcer (Phase 5D)**

- Class: `GraphBatchEnforcer` at `packages/hbc-sp-services/src/services/GraphBatchEnforcer.ts`
- Coalescence window: 10ms via setTimeout (reset on each enqueue)
- Threshold: >3 requests triggers immediate flush
- Feature flag: `GraphBatchingEnabled` (id 58, default OFF)
- Pass-through: When flag OFF, zero overhead — no timer, no queue
- Composition: Wraps `GraphBatchService.executeBatch()`; never extends it
- Audit: `AuditAction.BatchEnforcerCoalesced` logged on each flush

**ListThresholdGuard (Phase 5D)**

- Utility: `ListThresholdGuard` at `packages/hbc-sp-services/src/utils/ListThresholdGuard.ts`
- Warning: 3000 items → audit log + console warning
- Critical: 4500 items → force cursor paging when InfinitePagingEnabled ON
- Static: `shouldUseCursorPaging(count, flagEnabled)` → boolean
- Integration: SharePointDataService `getAuditLog()` checks before query
- Audit: `AuditAction.ListThresholdWarning` logged on warning/critical
```

4. Update "Critical Flows Guaranteed Stable" items 5 and 6 to indicate **IMPLEMENTED** status
5. Update Reference section with new file paths

---

## Verification

1. `cd packages/hbc-sp-services && volta run --node 22.14.0 npx tsc -p tsconfig.json` — zero errors
2. `volta run --node 22.14.0 npx tsc --noEmit` — zero errors (root)
3. `cd packages/hbc-sp-services && volta run --node 22.14.0 npx jest --coverage` — all pass, thresholds 80/60/70/80 met
4. `volta run --node 22.14.0 npx jest --verbose` — all tests pass (≥857)
5. `volta run --node 22.14.0 node scripts/verify-bundle-size.js` — PASS, no regression
6. Verify `GraphBatchingEnabled` flag appears in `featureFlags.json` at id 58
7. Verify `data-testid` attributes present in ConnectorManagementPanel via grep
8. Verify SECURITY_ANALYSIS.md and DATA_ARCHITECTURE.md exist in `.claude/`
