---
name: HBC Workflow State Machines
description: xstate v5 finite state machine orchestration for HBC Project Controls workflows (Go/No-Go, PMP Approval, Commitment Approval) with 14-role/70+ permission guards, lazy loading via WorkflowMachineFactory, dual-path feature flag strategy, and optimistic TanStack Query integration. Ensures explicit, auditable, and testable transitions while preserving full backward compatibility.
version: 1.1
category: core-services
triggers: xstate, workflow-machine, goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine, PMPPage, dual-path, WorkflowMachineFactory, useWorkflowMachine, useWorkflowTransition, WorkflowStateMachine flag, scorecard-status, permission-guard
updated: 2026-02-24
---

# HBC Workflow State Machines Skill

**Activation**  
Implementing, extending, debugging, or optimizing any workflow transition logic, state machine definition, guard, or workflow-controlled UI component after Phase 5B commit 58c3dff (23 Feb 2026).

**Protocol**  
1. All workflow logic MUST be defined in xstate v5 machines located in `packages/hbc-sp-services/src/machines/`.  
2. Machines MUST be instantiated exclusively through `WorkflowMachineFactory` (sync or async lazy).  
3. UI components MUST use `useWorkflowMachine` and `useWorkflowTransition` hooks. Direct machine interaction is prohibited.  
4. Feature flag `WorkflowStateMachine` enforces dual-path: OFF = legacy imperative behavior (byte-for-byte), ON = machine-driven.  
5. Guards MUST be based on permission keys (`PERMISSIONS` + `ROLE_PERMISSIONS`) for all 14 roles.  
6. Transitions MUST be orchestrated via TanStack Query mutations with optimistic updates and connector retry (per resilient-data-operations SKILL.md).  
7. New machines or significant changes require immediate update to this SKILL.md and CLAUDE.md §1, §16, §21.  
8. Post-implementation: full Jest coverage for machines, Playwright E2E for end-to-end flows, bundle size verification, and testing in both flag states.

**Critical Flows Guaranteed Stable**  
1. Go/No-Go 10-state lifecycle with all director/committee return, reject, and lock paths.  
2. Role-based permission guards across 14 roles / 70+ permissions.  
3. Optimistic cache updates with rollback on mutation failure.  
4. Dual-mode operation (WorkflowStateMachine flag ON/OFF) with zero visual or behavioral regression in OFF state.  
5. Lazy chunk loading (`lib-xstate-workflow`) with no impact on main bundle.  
6. Audit logging on every successful state transition.

**Manual Test Steps**  
1. Enable `WorkflowStateMachine` flag in Admin → Verify action buttons are correctly enabled/disabled per role permissions.  
2. Execute complete Go/No-Go flow as BD → Director → Committee → Confirm machine state and UI stay synchronized.  
3. Disable flag → Confirm GoNoGoScorecard behavior and appearance identical to pre-Phase 5B.  
4. Simulate mutation failure → Confirm optimistic status reverts and machine does not advance.  
5. Check network tab / bundle analyzer → Confirm xstate workflow chunk loads lazily.  
6. Run `playwright/workflow-state-machines.e2e.spec.ts` → All scenarios (role switching, flag toggling) pass.

**Reference**
- `CLAUDE.md` §1 (Tech Stack), §16 (Active Pitfalls & Rules), §21 (Navigation & Suite UX Architecture)
- `.claude/skills/resilient-data-operations/SKILL.md` (optimistic updates and connector mutation integration)
- `.claude/skills/elevated-ux-ui-design/SKILL.md` (action bar and status UI polish)
- `packages/hbc-sp-services/src/machines/goNoGoMachine.ts` (canonical example)

**Phase 5B Implementation Details (v1.1)**

- Machines: goNoGoMachine (10 states, 12 events), pmpApprovalMachine (6 states, 8 events), commitmentApprovalMachine (7 states, 9 events) at machines/
- Factory: WorkflowMachineFactory (lazy chunk lib-xstate-workflow, priority 30)
- Hooks: useWorkflowMachine (151 lines) / useWorkflowTransition (38 lines) — universal adoption
- Optimistic: TanStack Query integration with rollback on mutation failure
- Flag: WorkflowStateMachine (id 56, default OFF, zero drift on legacy path)
- E2E: workflow-state-machines.e2e.spec.ts (8 scenarios)
- Dual-path: GoNoGoScorecard + PMPPage both gate on WorkflowStateMachine flag
- Manual test: Toggle flag OFF → confirm legacy behavior unchanged