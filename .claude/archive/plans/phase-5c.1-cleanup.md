# Phase 5C.1: Provisioning Saga Resilience Integration & Polish

## Context
Phase 5C delivered the saga orchestrator but did not integrate with Phase 5D (GraphBatchEnforcer + ListThresholdGuard) or expand E2E/SKILL.md/CLAUDE.md. Phase 5C.1 closes the gaps with zero new methods, zero bundle impact, and zero behavior change when flags are OFF.

**Baseline:** HEAD 054fac737c20ddc02f0d0438892ca572a8f71e0e. 276 IDataService methods, 900 Jest tests.

---

## 1. Files to Modify

| # | Path | Change |
|---|------|--------|
| 1 | `packages/hbc-sp-services/src/services/ProvisioningSaga.ts` | Wire graphBatchEnforcer.enqueue() in all Graph steps; ListThresholdGuard in audit logs |
| 2 | `playwright/provisioning-saga.e2e.spec.ts` | Expand to 6 scenarios (add compensation rollback + resilience under flag) |
| 3 | `packages/hbc-sp-services/src/models/enums.ts` | Add AuditAction.SagaCompensationFailure |
| 4 | `CLAUDE.md` | Update §7, §15, §16 with 5C.1 cross-references |
| 5 | `.claude/skills/provisioning-engine/SKILL.md` | Bump to v1.2 with 5C.1 details |
| 6 | `.claude/skills/resilient-data-operations/SKILL.md` | Add cross-reference to provisioning saga using 5D resilience |

---

## 2. Technical Approach
- **Resilience wiring**: In saga step execution, replace raw Graph calls with `graphBatchEnforcer.enqueue()`. Use listThresholdGuard in any audit_log calls.
- **E2E expansion**: Add flag OFF legacy text and compensation rollback scenarios.
- **Docs**: Exact governing-style updates to CLAUDE.md and SKILL.md.

---

## 3. Trade-off Table

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Wiring location | Inside saga step execution | Makes resilience live without changing public API |
| E2E expansion | Add to existing file | Keeps test surface minimal |

---

## 4. Implementation Checklist (8 items)

1. Add AuditAction.SagaCompensationFailure to enums.ts.  
2. Wire GraphBatchEnforcer and ListThresholdGuard in ProvisioningSaga.ts.  
3. Expand provisioning-saga.e2e.spec.ts to 6 scenarios.  
4. Update CLAUDE.md §7/§15/§16 with 5C.1 cross-references.  
5. Bump provisioning-engine/SKILL.md to v1.2.  
6. Add cross-reference in resilient-data-operations/SKILL.md.  
7. Run full verification gate.  
8. Confirm 100 % fidelity to governing Phase 5C intent.

---

## 5. Exact CLAUDE.md Diffs (ready-to-insert)

**§15** – Append after Phase 5C entry:  
`- Phase 5C.1: Provisioning Saga Resilience Integration — **COMPLETE**. GraphBatchEnforcer and ListThresholdGuard wired into saga steps, E2E expansion, SKILL.md updates.`

**§16** – Append:  
`- **ProvisioningSaga resilience (Phase 5C.1)**: All Graph calls in saga steps MUST use graphBatchEnforcer.enqueue(). ListThresholdGuard applied to audit logs.`

---

## 6. SKILL.md Updates (ready-to-insert)

**provisioning-engine/SKILL.md v1.2** – append after existing content:  
```
**Phase 5C.1 Resilience Integration**
- GraphBatchEnforcer wired in all saga Graph steps.
- ListThresholdGuard applied to Audit_Log in saga.
- E2E expanded for compensation rollback.
```

**resilient-data-operations/SKILL.md** – append cross-reference.

---

## 7. Verification Gate
```bash
npm run verify:sprint3
npm run verify:bundle-size:fail
npx playwright test provisioning-saga.e2e.spec.ts
```

**Acceptance:** All gates green, 100 % fidelity, Phase 5C now production-hardened.

**Outcome:** Phase 5C 100 % complete with full resilience integration.