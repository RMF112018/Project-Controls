# Phase 5A.1: Connector Resilience Fidelity & Adoption Completion

## Context
Phase 5A (commit fb4d8793) added the resilience foundation per CLAUDE.md §15 and resilient-data-operations/SKILL.md v1.1, but left adoption incomplete: GraphBatchEnforcer is dead code for connectors, useConnectorMutation is used in only 2 places, retry/backoff is not uniform, resilience E2E is missing, and audit/docs lag. Phase 5A.1 closes all gaps with zero new IDataService methods, zero bundle impact, and zero behavior change when flags are OFF.

**Baseline:** HEAD 4e6b5f0059aa1026248ac73a667669940333598b. 276 IDataService methods, 880 Jest tests, coverage 93/81/93/94.

---

## 1. Files to Create

| # | Path | Purpose |
|---|------|---------|
| 1 | `packages/hbc-sp-services/src/services/__tests__/ConnectorResilienceE2E.test.ts` | Jest resilience scenarios (retry, batch fallback, circuit break) |
| 2 | `playwright/connectors-resilience.e2e.spec.ts` | 6 Playwright E2E for retry/backoff under simulated Graph throttling |

---

## 2. Files to Modify

| # | Path | Change |
|---|------|--------|
| 1 | `packages/hbc-sp-services/src/adapters/ProcoreAdapter.ts` | All Graph calls → `graphBatchEnforcer.enqueue()` |
| 2 | `packages/hbc-sp-services/src/adapters/BambooHRAdapter.ts` | All Graph calls → `graphBatchEnforcer.enqueue()` + full IConnectorRetryPolicy |
| 3 | `packages/hbc-sp-services/src/services/ConnectorRegistry.ts` | Enforce IConnectorRetryPolicy on registration + default policy |
| 4 | `src/.../components/admin/ConnectorManagementPanel.tsx` (and all mutation callers) | Replace raw mutate with `useConnectorMutation` (10+ places) |
| 5 | `packages/hbc-sp-services/src/models/enums.ts` | Add `AuditAction.RetryAttempt`, `AuditAction.CircuitBreak`, `AuditAction.BatchFallback` |
| 6 | `packages/hbc-sp-services/src/mock/featureFlags.json` | Add id 59 `ConnectorResilienceE2E` (default OFF) |
| 7 | `CLAUDE.md` | Update §7, §15, §16 with Phase 5A.1 |
| 8 | `.claude/skills/resilient-data-operations/SKILL.md` | Bump to v1.3 with Phase 5A.1 section |

---

## 3. Technical Approach

### 3A. Full GraphBatchEnforcer Adoption (zero-overhead when OFF)
In every adapter (ProcoreAdapter, BambooHRAdapter, future ones):
```ts
const response = await graphBatchEnforcer.enqueue({ /* request */ });
```
GraphService callers remain untouched (Enforcer sits transparently between).

### 3B. Universal useConnectorMutation
All connector mutations now use the hook:
```ts
const { mutateAsync } = useConnectorMutation('procore.sync', {
  onMutate: optimisticUpdate,
  retry: connectorRetryPolicy,
});
```

### 3C. Uniform Retry/Backoff + Registry Enforcement
ConnectorRegistry.register enforces `retryPolicy: IConnectorRetryPolicy` with default exponential backoff (3 attempts, 500ms base).

### 3D. Resilience E2E + Audit Actions
6 new Playwright scenarios + new AuditAction values on every retry/fallback.

---

## 4. Trade-off Table

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Enforcer wiring | All adapters call enqueue | Makes batching live without changing public API |
| useConnectorMutation | Universal replacement | Consistent optimistic + resilience everywhere |
| Registry enforcement | Throw on registration if missing policy | Fail-fast at startup, zero runtime surprise |
| E2E location | Separate resilience spec | Keeps connectors.e2e.spec.ts clean |

---

## 5. Implementation Checklist

1. Add AuditAction values to enums.ts.  
2. Add ConnectorResilienceE2E flag to featureFlags.json.  
3. Update ProcoreAdapter & BambooHRAdapter to use graphBatchEnforcer + full retry policy.  
4. Update ConnectorRegistry to enforce policy.  
5. Refactor all mutation callers to useConnectorMutation (10+ places).  
6. Create ConnectorResilienceE2E.test.ts (Jest).  
7. Create connectors-resilience.e2e.spec.ts (6 tests).  
8. Update CLAUDE.md §7/§15/§16 with Phase 5A.1.  
9. Update resilient-data-operations/SKILL.md to v1.3 (see §7).  
10. Run full verification gate + confirm 100 % fidelity to Phase 5A governing intent.

---

## 6. CLAUDE.md Diffs (ready-to-insert)

**§7** – Append to last major additions: “Phase 5A.1 Connector Resilience Adoption (Feb 2026) — Full GraphBatchEnforcer wiring, universal useConnectorMutation, uniform retry/backoff, resilience E2E, new AuditActions.”

**§15** – Append after Phase 5D entry:
```
- Phase 5A.1: Connector Resilience Adoption — **COMPLETE**. Full Enforcer integration, universal useConnectorMutation, registry enforcement, resilience E2E. resilient-data-operations SKILL.md v1.3.
```

**§16** – Append:
```
- **ConnectorResilience** — All adapters MUST use graphBatchEnforcer.enqueue() and IConnectorRetryPolicy. Registry enforces at registration.
- **useConnectorMutation** — Sole mutation path for all connectors; raw mutate disallowed.
```

---

## 7. SKILL.md Update (resilient-data-operations/SKILL.md → v1.3)

Add after the new Phase 5D sections:

```
**Phase 5A.1 Connector Resilience Adoption**

- All adapters now route Graph calls through GraphBatchEnforcer.enqueue().
- Universal useConnectorMutation hook with optimistic updates and per-adapter retry.
- ConnectorRegistry enforces IConnectorRetryPolicy on registration.
- 6 new Playwright resilience E2E scenarios.
- New AuditAction values: RetryAttempt, CircuitBreak, BatchFallback.
- File references: ProcoreAdapter.ts, BambooHRAdapter.ts, ConnectorRegistry.ts, connectors-resilience.e2e.spec.ts.
```

---

## Verification Gate
```bash
npm run verify:sprint3
npm run verify:bundle-size:fail
cd packages/hbc-sp-services && npx jest --coverage
npx playwright test connectors-resilience.e2e.spec.ts
```

**Acceptance:** All gates green, 100 % fidelity to Phase 5A governing intent, branches ≥81 %, no regressions.

**Outcome:** Phase 5A now 100 % complete and production-hardened. Connectors are fully resilient.