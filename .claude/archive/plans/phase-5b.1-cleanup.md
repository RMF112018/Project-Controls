# Phase 5B.1: Workflow State Machines Fidelity & Polish

## Context
Phase 5B delivered the locked scope (xstate v5 machines, WorkflowMachineFactory, hooks, optimistic integration, dual-path flag, Playwright E2E) but left CLAUDE.md out of sync, E2E partial, and 2 legacy pages using raw machine.send(). Phase 5B.1 closes all gaps with zero new methods, zero bundle impact, and zero behavior change when WorkflowStateMachine flag is OFF.

**Baseline:** HEAD 054fac737c20ddc02f0d0438892ca572a8f71e0e. 276 IDataService methods, 900 Jest tests.

---

## 1. Files to Modify (6 files only)

| # | Path | Change |
|---|------|--------|
| 1 | `CLAUDE.md` | Update §7, §15, §16 to mark Phase 5B COMPLETE (exact governing text) |
| 2 | `.claude/skills/workflow-state-machines/SKILL.md` | Bump to v1.1 + append implementation details |
| 3 | `playwright/workflow.e2e.spec.ts` | Expand to 8 full scenarios (add 4 rollback/approval chains) |
| 4 | `src/.../pages/preconstruction/GoNoGoPage.tsx` | Convert raw machine.send() to useWorkflowMachine hook |
| 5 | `src/.../pages/operations/PMPApprovalPage.tsx` | Convert raw machine.send() to useWorkflowMachine hook |
| 6 | `packages/hbc-sp-services/src/machines/WorkflowMachineFactory.ts` | Add safety comment on dual-path enforcement |

---

## 2. Technical Approach
- **CLAUDE.md** – exact §6-style text for Phase 5B completion.
- **E2E expansion** – add 4 focused rollback/approval flows using roleFixture + switchRole.
- **Legacy pages** – replace direct `send()` with `useWorkflowMachine` (optimistic + flag-safe).
- **SKILL.md** – v1.1 adds critical flows and manual test steps.

---

## 3. Trade-off Table

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| E2E expansion | Add 4 scenarios to existing file | Keeps test surface minimal, follows existing convention |
| Legacy pages | useWorkflowMachine hook | Enforces universal hook rule from §16 |
| SKILL.md | In-place v1.1 bump | No new file per documentation hygiene |

---

## 4. Implementation Checklist (8 items)

1. Update CLAUDE.md §7/§15/§16 with exact Phase 5B completion text.  
2. Bump workflow-state-machines/SKILL.md to v1.1 + append governing section.  
3. Expand workflow.e2e.spec.ts with 4 additional scenarios.  
4. Refactor GoNoGoPage.tsx to useWorkflowMachine.  
5. Refactor PMPApprovalPage.tsx to useWorkflowMachine.  
6. Add safety comment in WorkflowMachineFactory.ts.  
7. Run full verification gate.  
8. Confirm 100 % fidelity + CLAUDE.md now marks Phase 5B COMPLETE.

---

## 5. Exact CLAUDE.md Diffs (ready-to-insert)

**§7** – Append:  
`Phase 5B: Workflow State Machines + E2E Coverage (Feb 2026) — xstate v5 machines (goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine), WorkflowMachineFactory (lazy chunk), useWorkflowMachine/useWorkflowTransition, optimistic TanStack Query integration, dual-path WorkflowStateMachine flag (default OFF, zero drift). Playwright workflow E2E.`

**§15** – Replace the PLANNED line with:  
`- Phase 5B: Workflow State Machines + E2E Coverage — **COMPLETE** on `feature/hbc-suite-stabilization`. xstate v5 machines, WorkflowMachineFactory, hooks, optimistic integration, dual-path flag, Playwright workflow E2E. TanStack Router actions skipped.`

**§16** – Append:  
`- **WorkflowStateMachine flag**: Legacy imperative path byte-for-byte identical when OFF.  
- **xstate import policy**: Hooks only; direct machine.send() disallowed in UI.  
- **Workflow transitions**: Mutation-coupled; send() only after mutateAsync success.`

---

## 6. SKILL.md Update (workflow-state-machines/SKILL.md → v1.1)

Insert after existing Phase 5A.1 content:

```
**Phase 5B Workflow State Machines**

- Machines: goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine at machines/
- Factory: WorkflowMachineFactory (lazy chunk priority 30)
- Hooks: useWorkflowMachine / useWorkflowTransition (universal adoption)
- Optimistic: TanStack Query integration with rollback
- Flag: WorkflowStateMachine (default OFF, zero drift on legacy path)
- E2E: workflow.e2e.spec.ts (8 scenarios)
- Manual test: Toggle flag OFF → confirm legacy behavior unchanged
```

---

## 7. Verification Gate
```bash
npm run verify:sprint3
npm run verify:bundle-size:fail
cd packages/hbc-sp-services && npx jest --coverage
npx playwright test workflow.e2e.spec.ts
```

**Acceptance:** All gates green, CLAUDE.md marks Phase 5B COMPLETE, 100 % fidelity, zero regressions.

**Outcome:** Phase 5B now 100 % complete and governance-compliant. Ready for Phase 6.