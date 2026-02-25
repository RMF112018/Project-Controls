# Phase 5D.1: Fidelity Cleanup & Enforcement Completion

## Context
Phase 5D delivered the core infrastructure but contains 4 deviations from the governing `fancy-floating-sutherland.md` (single source of truth), 2 missing checklist items, and branches at 78.67 % (below 80 % target). Phase 5D.1 resolves every discrepancy with zero new methods, zero bundle impact, and zero behavior change outside the intended safety enforcement.

**Baseline:** HEAD `d0d69195d8a4408c5f8287024a2c19ab41ddffb0`. 276 IDataService methods, 791 Jest tests.

---

## 1. Files to Modify (8 files only – no creations)

| # | Path | Change |
|---|------|--------|
| 1 | `packages/hbc-sp-services/src/services/GraphBatchEnforcer.ts` | Revert to exact governing constructor + singleton (remove `initializeEnforcerFeatureCheck`, module closure, extra export) |
| 2 | `packages/hbc-sp-services/src/services/GraphService.ts` | Remove extra param & wiring; use direct singleton injection |
| 3 | `packages/hbc-sp-services/src/utils/ListThresholdGuard.ts` | Change `ThresholdLevel` to lowercase (`'safe'`, `'warning'`, `'critical'`) per governing 3B |
| 4 | `packages/hbc-sp-services/src/utils/constants.ts` | Add missing `CACHE_KEYS.AUDIT_LOG = 'hbc_audit_log'` |
| 5 | `packages/hbc-sp-services/src/services/SharePointDataService.ts` | Move `checkThreshold` to `getAuditLog()` (line ~668) + implement `shouldUseCursorPaging` redirection for actual enforcement |
| 6 | `packages/hbc-sp-services/jest.config.js` | Keep 80/60/70/80; add 2–3 minimal gap tests if branches remain <80 % |
| 7 | `CLAUDE.md` | Replace §7, §15, §16, §18 with exact governing §6 diffs |
| 8 | `.claude/skills/resilient-data-operations/SKILL.md` | Append exact governing §7 sections (GraphBatchEnforcer + ListThresholdGuard) |

---

## 2. Technical Approach

**GraphBatchEnforcer** – exact governing 3A singleton:
```ts
export const graphBatchEnforcer = new GraphBatchEnforcer(
  graphBatchService,
  () => isFeatureEnabled('GraphBatchingEnabled')  // injected at init
);
```
`GraphService.initialize()` becomes one-line (matches ProvisioningService pattern).

**ListThresholdGuard** – full safety guarantee (governing 3B):
- Enum casing standardized to lowercase.
- In `getAuditLog()` (before query):
  ```ts
  const result = listThresholdGuard.checkThreshold('Audit_Log', count);
  if (result.level !== 'safe') this.logAudit(...);
  if (listThresholdGuard.shouldUseCursorPaging(count, isInfinitePagingEnabled)) {
    return this.getAuditLogPage(...);  // actual enforcement
  }
  ```
- `getAuditLogPage()` retains telemetry only.

**Coverage** – governing 3C: final 80/60/70/80 target with measured gap tests only if needed.

---

## 3. Trade-off Table

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Injection | Exact governing singleton | Zero indirection, matches every other service, minimal test surface |
| Enforcement location | `getAuditLog()` + redirection | Delivers the safety promise of the governing spec |
| Enum casing | Lowercase | Exact match to governing 3B and SKILL.md examples |
| Coverage fix | 2–3 gap tests only | Hits gate without scope creep |

---

## 4. Implementation Checklist (10 items)

1. Simplify `GraphBatchEnforcer.ts` to governing constructor + singleton.  
2. Update `GraphService.ts` (remove extra wiring).  
3. Standardize `ThresholdLevel` enum to lowercase in `ListThresholdGuard.ts`.  
4. Add `CACHE_KEYS.AUDIT_LOG` to `constants.ts`.  
5. Move + enhance threshold logic in `SharePointDataService.ts` (`getAuditLog()`).  
6. Add 2–3 gap tests if branches <80 %.  
7. Update `CLAUDE.md` with exact governing §6 diffs.  
8. Append governing §7 sections to `resilient-data-operations/SKILL.md`.  
9. Run full verification gate.  
10. Confirm 100 % fidelity (grep governing strings, coverage ≥80/60/70/80, CLAUDE.md matches).

---

## 5. Exact Governing CLAUDE.md Diffs (ready-to-insert)

(Use the exact text from governing §6 for §7, §15, §16, §18 – identical to the block I provided in the analysis.)

---

## 6. Verification Gate
```bash
cd packages/hbc-sp-services && npx tsc -p tsconfig.json
npx tsc --noEmit
npx jest --coverage
npx playwright test connectors.e2e.spec.ts provisioning-saga.e2e.spec.ts
npm run verify:sprint3
node scripts/verify-bundle-size.js
```

**Acceptance Criteria:** All gates green, branches ≥80 %, CLAUDE.md synchronized, zero linter regressions, full fidelity to governing `fancy-floating-sutherland.md`.

**Outcome:** Phase 5D now 100 % complete and production-gate compliant. Zero technical debt carried forward.