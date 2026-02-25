# Phase 5B — Workflow State Machines (xstate v5)

**Branch:** `feature/hbc-suite-stabilization`
**HEAD (locked):** `fb4d8793f4ed5b9085c29386ba0b330d8b5a5165` (Phase 5A complete)
**Feature flag:** `WorkflowStateMachine` (disabled by default — existing pages unchanged when off)
**Design decision:** TanStack Router v1 actions SKIPPED (experimental API). Transitions via TanStack Query mutations + xstate v5.

---

## 1. Files to Create / Files to Modify

### Files to Create (15)

| # | Path | Purpose |
|---|------|---------|
| 1 | `packages/hbc-sp-services/src/machines/goNoGoMachine.ts` | xstate v5 Go/No-Go scorecard machine (10 states, 12 events, 5 guards) |
| 2 | `packages/hbc-sp-services/src/machines/pmpApprovalMachine.ts` | xstate v5 PMP approval machine (6 states, 8 events, 4 guards) |
| 3 | `packages/hbc-sp-services/src/machines/commitmentApprovalMachine.ts` | xstate v5 Contract Tracking machine (7 states, 9 events, 5 guards) |
| 4 | `packages/hbc-sp-services/src/machines/types.ts` | `WorkflowMachineType` union + shared context interfaces |
| 5 | `packages/hbc-sp-services/src/machines/index.ts` | Barrel export for all machines + types |
| 6 | `packages/hbc-sp-services/src/machines/WorkflowMachineFactory.ts` | Lazy-loading factory: sync `get()` + async `getAsync()` with `webpackChunkName` |
| 7 | `src/webparts/hbcProjectControls/hooks/useWorkflowMachine.ts` | React hook wrapping `@xstate/react` `useActor` → `{ state, send, can, allowedEvents, isFinal }` |
| 8 | `src/webparts/hbcProjectControls/hooks/useWorkflowTransition.ts` | Mutation + machine transition orchestrator (guard → mutate → send) |
| 9 | `packages/hbc-sp-services/src/machines/__tests__/goNoGoMachine.test.ts` | ~15 tests: transitions, guards, finals, happy path, return paths, audit |
| 10 | `packages/hbc-sp-services/src/machines/__tests__/pmpApprovalMachine.test.ts` | ~12 tests: transitions, multi-step, signatures, guard rejection |
| 11 | `packages/hbc-sp-services/src/machines/__tests__/commitmentApprovalMachine.test.ts` | ~10 tests: linear 4-step, rejection at each step, guards |
| 12 | `packages/hbc-sp-services/src/machines/__tests__/WorkflowMachineFactory.test.ts` | ~6 tests: get/getAsync, caching, invalid type |
| 13 | `packages/hbc-sp-services/src/machines/__tests__/types.test.ts` | ~3 tests: type coverage, enum alignment |
| 14 | `src/webparts/hbcProjectControls/hooks/__tests__/useWorkflowMachine.test.tsx` | ~10 tests: init, can(), allowedEvents, send(), isFinal, unmount |
| 15 | `src/webparts/hbcProjectControls/hooks/__tests__/useWorkflowTransition.test.tsx` | ~8 tests: transition flow, guard rejection, mutation error rollback |
| 16 | `playwright/workflow-e2e.spec.ts` | 3 E2E scenarios: Go/No-Go flow, flag toggle, Contract Tracking 4-step |

### Files to Modify (12)

| # | Path | Change |
|---|------|--------|
| 1 | `package.json` | Add `xstate@^5.19`, `@xstate/react@^4.3` as `--save-exact` |
| 2 | `packages/hbc-sp-services/src/services/index.ts` | Append `export * from '../machines';` |
| 3 | `packages/hbc-sp-services/src/mock/featureFlags.json` | Add `WorkflowStateMachine` (id 56, disabled, Category: Infrastructure) |
| 4 | `src/webparts/hbcProjectControls/tanstack/query/mutations/optimisticMutationFlags.ts` | Add `workflows: 'WorkflowStateMachine'` |
| 5 | `src/webparts/hbcProjectControls/tanstack/query/cachePolicies.ts` | Add `workflows: 30 * 1000` |
| 6 | `src/webparts/hbcProjectControls/tanstack/query/mutations/useHbcOptimisticMutation.ts` | Add 4 methods to `WAVE_A_METHODS`: `submitGoNoGoDecision`, `recordFinalDecision`, `submitContractTracking`, `respondToContractTracking` |
| 7 | `dev/webpack.config.js` | Add `xstateWorkflow` cache group (`/xstate\|@xstate/`, name `lib-xstate-workflow`, priority 20, chunks async) |
| 8 | `scripts/verify-bundle-size.js` | Add `'lib-xstate-workflow'` to `MONITORED_CHUNKS` array (line 25) |
| 9 | `config/bundle-budget.spfx.json` | Add `"lib-xstate-workflow": { "rawBytes": 0, "gzipBytes": 0, "brotliBytes": 0 }` |
| 10 | `src/webparts/hbcProjectControls/components/pages/preconstruction/GoNoGoPage.tsx` | Dual-path: `isFeatureEnabled('WorkflowStateMachine')` gates machine-driven buttons vs imperative |
| 11 | `src/webparts/hbcProjectControls/components/pages/operations/PMPPage.tsx` | Dual-path: machine-driven approval/signature actions vs imperative |
| 12 | `src/webparts/hbcProjectControls/components/pages/operations/BuyoutLogPage.tsx` | Dual-path: machine-driven 4-step tracking vs imperative |

---

## 2. Technical Approach

### 2.1 xstate v5 Machine Definitions

All three machines live in `packages/hbc-sp-services/src/machines/` (data layer per CLAUDE.md §4). Each uses xstate v5 `setup()` + `createMachine()` API. Guards check `PERMISSIONS` constants from `packages/hbc-sp-services/src/utils/permissions.ts` via `context.userPermissions`. Every transition fires `logTransition` action for SOC2 audit.

#### goNoGoMachine — 10 states, 12 events, 5 guards

```
States (matching ScorecardStatus enum in packages/hbc-sp-services/src/models/enums.ts:65-76):
  bdDraft → awaitingDirectorReview → awaitingCommitteeScoring → go → locked
                ↕ directorReturnedForRevision       ↕ committeeReturnedForRevision
                                                     → noGo (final)
                                                     → rejected (final)
                                                              locked ↔ unlocked

Events:
  SUBMIT_FOR_REVIEW        bdDraft → awaitingDirectorReview             guard: canSubmit
  DIRECTOR_APPROVE         awaitingDirectorReview → awaitingCommitteeScoring  guard: canReview
  DIRECTOR_RETURN          awaitingDirectorReview → directorReturnedForRevision  guard: canReview
  RESUBMIT_AFTER_DIRECTOR  directorReturnedForRevision → awaitingDirectorReview  guard: canSubmit
  COMMITTEE_APPROVE        awaitingCommitteeScoring → go                guard: canDecide
  COMMITTEE_RETURN         awaitingCommitteeScoring → committeeReturnedForRevision  guard: canScore
  COMMITTEE_REJECT         awaitingCommitteeScoring → rejected          guard: canDecide
  DECIDE_NOGO              awaitingCommitteeScoring → noGo              guard: canDecide
  RESUBMIT_AFTER_COMMITTEE committeeReturnedForRevision → awaitingCommitteeScoring  guard: canSubmit
  LOCK                     go → locked                                  guard: canLock
  UNLOCK                   locked → unlocked                            guard: canLock
  RELOCK                   unlocked → locked                            guard: canLock

Guards (checked via context.userPermissions):
  canSubmit  → .includes(PERMISSIONS.GONOGO_SUBMIT)       // BD Rep
  canReview  → .includes(PERMISSIONS.GONOGO_REVIEW)       // Director
  canScore   → .includes(PERMISSIONS.GONOGO_SCORE_COMMITTEE) // Committee
  canDecide  → .includes(PERMISSIONS.GONOGO_DECIDE)       // Executive Leadership
  canLock    → .includes(PERMISSIONS.GONOGO_DECIDE)       // Executive Leadership

Context: { scorecardId: number; projectCode: string; userPermissions: string[] }
```

#### pmpApprovalMachine — 6 states, 8 events, 4 guards

```
States (matching PMPStatus type in packages/hbc-sp-services/src/models/IProjectManagementPlan.ts:1):
  draft → pendingApproval → approved → pendingSignatures → closed (final)
                ↕ returned

Events:
  SUBMIT_FOR_APPROVAL  draft → pendingApproval                     guard: canEdit
  APPROVE_STEP         pendingApproval → pendingApproval (self)    guard: canApprove
                       (fires when context.pendingSteps > 1; decrements pendingSteps)
  APPROVE_FINAL        pendingApproval → approved                  guard: canFinalApprove
                       (fires when context.pendingSteps === 1)
  RETURN_STEP          pendingApproval → returned                  guard: canApprove
  RESUBMIT             returned → pendingApproval                  guard: canEdit
  BEGIN_SIGNATURES     approved → pendingSignatures                guard: canFinalApprove
  SIGN                 pendingSignatures → pendingSignatures (self) guard: canSign
                       (fires when context.pendingSignatures > 1; decrements pendingSignatures)
  SIGN_FINAL           pendingSignatures → closed                  guard: canSign
                       (fires when context.pendingSignatures === 1)

Guards:
  canEdit         → .includes(PERMISSIONS.PMP_EDIT)            // Operations Team
  canApprove      → .includes(PERMISSIONS.PMP_APPROVE)         // Executive, Director
  canFinalApprove → .includes(PERMISSIONS.PMP_FINAL_APPROVE)   // Executive, Director
  canSign         → .includes(PERMISSIONS.PMP_SIGN)            // All signatories

Context: { projectCode: string; pmpId: number; cycleNumber: number;
           pendingSteps: number; pendingSignatures: number; userPermissions: string[] }

Assign actions:
  decrementPendingSteps      → on APPROVE_STEP
  decrementPendingSignatures → on SIGN
```

#### commitmentApprovalMachine — 7 states, 9 events, 5 guards

```
States (matching ContractTrackingStatus in packages/hbc-sp-services/src/models/IContractTrackingApproval.ts:3-10):
  notStarted → pendingAPM → pendingPM → pendingRiskMgr → pendingPX → tracked (final)
  Any pending state → rejected (final) on REJECT_*

Events:
  SUBMIT       notStarted → pendingAPM         guard: canSubmit
  APPROVE_APM  pendingAPM → pendingPM          guard: canApproveAPM
  REJECT_APM   pendingAPM → rejected           guard: canApproveAPM
  APPROVE_PM   pendingPM → pendingRiskMgr      guard: canApprovePM
  REJECT_PM    pendingPM → rejected            guard: canApprovePM
  APPROVE_RISK pendingRiskMgr → pendingPX      guard: canApproveRisk
  REJECT_RISK  pendingRiskMgr → rejected       guard: canApproveRisk
  APPROVE_PX   pendingPX → tracked             guard: canApprovePX
  REJECT_PX    pendingPX → rejected            guard: canApprovePX

Guards:
  canSubmit      → .includes(PERMISSIONS.CONTRACT_TRACKING_SUBMIT)      // Operations Team
  canApproveAPM  → .includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_APM) // APM/PA
  canApprovePM   → .includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PM)  // Project Manager
  canApproveRisk → .includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_RISK)// Risk Manager
  canApprovePX   → .includes(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PX)  // Project Executive

Context: { projectCode: string; buyoutEntryId: number; userPermissions: string[] }
```

### 2.2 WorkflowMachineFactory (lazy-loaded)

**File:** `packages/hbc-sp-services/src/machines/WorkflowMachineFactory.ts`

- `get(type: WorkflowMachineType)` — synchronous, returns cached machine definition (not actor)
- `getAsync(type: WorkflowMachineType)` — async, uses `import(/* webpackChunkName: "lib-xstate-workflow" */ ...)` for code-splitting
- `register(type, machine)` — static, for test injection
- Follows `DataProviderFactory` pattern (`packages/hbc-sp-services/src/factory/DataProviderFactory.ts`)

Webpack splits xstate into `lib-xstate-workflow` async chunk via cache group:
```javascript
// dev/webpack.config.js — add after exportLibs (line 139)
xstateWorkflow: {
  test: /[\\/]node_modules[\\/](xstate|@xstate)[\\/]/,
  name: 'lib-xstate-workflow',
  priority: 20,
  chunks: 'async',
},
```

### 2.3 useWorkflowMachine Hook

**File:** `src/webparts/hbcProjectControls/hooks/useWorkflowMachine.ts`

```typescript
interface IUseWorkflowMachineResult<TContext> {
  state: string;                       // Current state value ('bdDraft', 'pendingPM', etc.)
  snapshot: ActorSnapshot;             // Full xstate snapshot
  send: (event: { type: string }) => void;
  can: (eventType: string) => boolean; // Guard check from current state + permissions
  allowedEvents: string[];             // All events where can() is true (memoized)
  context: TContext;
  isFinal: boolean;
}
```

- Accepts `machineType`, `initialState`, `context`
- Calls `WorkflowMachineFactory.getAsync()` on mount (lazy chunk)
- Creates actor via `createActor(machine, { snapshot: restoredState, input: context })`
- Wraps `@xstate/react` `useActor` for subscriptions
- `can()` evaluates machine transition guards against `context.userPermissions`
- Stops actor on unmount

**Critical rule:** Hook does NOT call service methods — state management only.

### 2.4 useWorkflowTransition Hook (Mutation Integration)

**File:** `src/webparts/hbcProjectControls/hooks/useWorkflowTransition.ts`

```typescript
function useWorkflowTransition(options: {
  workflow: IUseWorkflowMachineResult<unknown>;
  mutation: UseMutationResult<unknown, Error, unknown>;
}): {
  transition: (eventType: string, variables: unknown) => Promise<void>;
  isTransitioning: boolean;
}
```

**Flow:**
1. `transition('SUBMIT_FOR_REVIEW', { scorecardId: 42 })`
2. `workflow.can('SUBMIT_FOR_REVIEW')` → reject if false
3. `mutation.mutateAsync(variables)` → goes through `useHbcOptimisticMutation`
4. On success: `workflow.send({ type: 'SUBMIT_FOR_REVIEW' })`
5. On error: machine stays in previous state (natural rollback — no compensation needed)

**Optimistic update recipe:**
- WAVE_A_METHODS expanded: `submitGoNoGoDecision`, `recordFinalDecision`, `submitContractTracking`, `respondToContractTracking`
- `applyOptimistic` callback uses xstate `getNextSnapshot(event)` to compute optimistic next state
- `OPTIMISTIC_MUTATION_FLAGS.workflows` → `'WorkflowStateMachine'`
- Integrates with `useConnectorMutation` retry/backoff from resilient-data-operations SKILL.md when connector-backed

### 2.5 Page Wiring (Dual-Path Behind Feature Flag)

Each page uses `isFeatureEnabled('WorkflowStateMachine')` to conditionally activate machine-driven UI:

**GoNoGoPage.tsx** — `disabled={!workflow.can('SUBMIT_FOR_REVIEW')}` replaces hardcoded status checks; buttons render from `workflow.allowedEvents`; status badge reads `workflow.state`
**PMPPage.tsx** — Submit/approve/sign buttons gated by `can()`; signature section visible only when `workflow.state === 'pendingSignatures'`
**BuyoutLogPage.tsx** — Submit tracking + step approve/reject from `allowedEvents`; status column renders `workflow.state` label

When flag OFF: zero code path change — existing imperative checks remain.

### 2.6 Playwright E2E

**File:** `playwright/workflow-e2e.spec.ts`

Three scenarios using existing `roleFixture.ts` (`switchRole()`):
1. **Go/No-Go full flow**: BD Rep → submit → Director (switchRole) → approve → Committee → Go → Lock
2. **Flag toggle**: Super-Admin toggles WorkflowStateMachine ON/OFF → verify dual-path renders
3. **Contract Tracking 4-step**: Operations Team → submit → APM approve → PM approve → Risk approve → PX approve → Tracked

---

## 3. Trade-off Table

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| xstate v5 vs custom state machine | xstate v5 | Hand-rolled FSM | xstate v5 `setup()` API gives type-safe guards/actions, `can()` introspection, serializable snapshots. ~45KB async-loaded, well within budget. |
| Machines in data layer vs UI layer | Data layer (`@hbc/sp-services`) | UI hooks directory | Machines encode domain logic (RBAC guards, state transitions). Data → Domain → Presentation rule (§4). Testable without React. |
| `getAsync()` lazy load vs static import | Async factory | Direct `import` | Entrypoint at 96% of 2MB hard cap. Static import would push past. Async chunk follows `lib-echarts-vendor` precedent. |
| Dual-path flag vs hard-switch | Dual-path (`WorkflowStateMachine` flag) | Replace imperative code | Three workflows run in production. Bugs in machine defs would break all three simultaneously. Flag enables incremental rollout per workflow. |
| Guards check PERMISSIONS vs role names | PERMISSIONS constants | Role string checks | RBAC system supports config-driven IRoleConfiguration (Phase 2). Guards must work with both `ROLE_PERMISSIONS` fallback and `PermissionEngine` path. |
| useWorkflowTransition separate from useWorkflowMachine | Separate hooks | Single combined hook | Separation of concerns: machine hook manages state, transition hook orchestrates mutations. Components compose independently; machine hook testable without mocking IDataService. |
| Self-transitions (APPROVE_STEP/SIGN) vs intermediate states | Self-transitions with context counters | One state per step | PMP has variable numbers of approval steps and signatures per cycle. Self-transitions with `pendingSteps` counter handle N-step dynamically. |
| TanStack Router actions | SKIPPED | Router action per transition | Router actions are experimental in v1. Using TanStack Query mutations (existing, stable) + xstate orchestration avoids Router API churn. |

---

## 4. Implementation Checklist

### Step 0 — Re-verify HEAD
- [ ] `git log --oneline -1` outputs `fb4d879 feat: Phase 5A — Connector Resilience ...`
- **AC:** HEAD matches fb4d8793f4ed5b9085c29386ba0b330d8b5a5165

### Step 1 — Install xstate v5 + @xstate/react
- [ ] `volta run --node 22.14.0 npm install xstate@^5.19 @xstate/react@^4.3 --save-exact`
- [ ] `npm ls xstate` shows 5.19.x; `npm ls @xstate/react` shows 4.3.x
- **AC:** Both packages in `package.json` dependencies with exact versions

### Step 2 — Create machine definitions
- [ ] Create `packages/hbc-sp-services/src/machines/types.ts` with `WorkflowMachineType` union
- [ ] Create `packages/hbc-sp-services/src/machines/goNoGoMachine.ts` with `setup()` + `createMachine()` — 10 states, 12 events, 5 guards using PERMISSIONS constants, `logTransition` action on every event
- [ ] Create `packages/hbc-sp-services/src/machines/pmpApprovalMachine.ts` — 6 states, 8 events, 4 guards, `decrementPendingSteps`/`decrementPendingSignatures` assign actions
- [ ] Create `packages/hbc-sp-services/src/machines/commitmentApprovalMachine.ts` — 7 states, 9 events, 5 guards
- [ ] Create `packages/hbc-sp-services/src/machines/index.ts` barrel
- [ ] Add `export * from '../machines';` to `packages/hbc-sp-services/src/services/index.ts`
- **AC:** All three machines compile with `npx tsc --noEmit`; states match existing enums/types exactly; guards reference PERMISSIONS constants only (no role strings)

### Step 3 — WorkflowMachineFactory
- [ ] Create `packages/hbc-sp-services/src/machines/WorkflowMachineFactory.ts` with `get()`, `getAsync()`, `register()`
- [ ] `getAsync()` uses `import(/* webpackChunkName: "lib-xstate-workflow" */ ...)` for code-splitting
- **AC:** `get('goNoGo')` returns goNoGoMachine; `getAsync('pmpApproval')` resolves to pmpApprovalMachine; invalid type throws

### Step 4 — useWorkflowMachine hook
- [ ] Create `src/webparts/hbcProjectControls/hooks/useWorkflowMachine.ts`
- [ ] Returns `{ state, snapshot, send, can, allowedEvents, context, isFinal }`
- [ ] `can()` evaluates guards against `context.userPermissions`
- [ ] `allowedEvents` is memoized
- [ ] Actor stopped on unmount
- **AC:** Hook hydrates machine from `initialState`, `can()` correctly rejects events without proper permissions, `isFinal` true for final states

### Step 5 — useWorkflowTransition hook
- [ ] Create `src/webparts/hbcProjectControls/hooks/useWorkflowTransition.ts`
- [ ] `transition()` calls `can()` → `mutation.mutateAsync()` → `send()`
- [ ] Mutation error does NOT advance machine state
- **AC:** Guard-rejected transitions throw without calling mutation; successful mutations advance state; failed mutations leave state unchanged

### Step 6 — Feature flag + mutation config
- [ ] Add `{ "id": 56, "FeatureName": "WorkflowStateMachine", ... }` to `featureFlags.json`
- [ ] Add `workflows: 'WorkflowStateMachine'` to `optimisticMutationFlags.ts`
- [ ] Add `workflows: 30 * 1000` to `cachePolicies.ts`
- [ ] Add `submitGoNoGoDecision`, `recordFinalDecision`, `submitContractTracking`, `respondToContractTracking` to `WAVE_A_METHODS` in `useHbcOptimisticMutation.ts`
- **AC:** Flag visible in Admin Feature Flags page (disabled); 4 new methods appear in WAVE_A_METHODS set

### Step 7 — Wire workflow pages behind flag
- [ ] GoNoGoPage.tsx: dual-path with `isFeatureEnabled('WorkflowStateMachine')`; machine-driven buttons when ON, imperative when OFF
- [ ] PMPPage.tsx: dual-path submit/approve/sign via `can()` + `allowedEvents`
- [ ] BuyoutLogPage.tsx: dual-path tracking submit/approve via `can()` + `allowedEvents`
- **AC:** Pages render correctly with flag OFF (unchanged behavior); with flag ON, buttons enable/disable based on `can()` for current role; no runtime errors in either mode

### Step 8 — Bundle chunk updates
- [ ] Add `xstateWorkflow` cache group to `dev/webpack.config.js` optimization.splitChunks.cacheGroups
- [ ] Add `'lib-xstate-workflow'` to MONITORED_CHUNKS in `scripts/verify-bundle-size.js`
- [ ] Add `"lib-xstate-workflow": { "rawBytes": 0, "gzipBytes": 0, "brotliBytes": 0 }` to `config/bundle-budget.spfx.json`
- [ ] Run `node scripts/verify-bundle-size.js --update-baseline` to establish real baseline
- **AC:** `npm run verify:bundle-size:fail` passes; `lib-xstate-workflow` appears as monitored chunk (~45-55KB raw); entrypoint stays ≤ 2,097,152 bytes

### Step 9 — Jest unit tests
- [ ] Create 4 machine/factory test files in `packages/hbc-sp-services/src/machines/__tests__/`
- [ ] Create 2 hook test files in `src/webparts/hbcProjectControls/hooks/__tests__/`
- [ ] Create types test file
- [ ] All tests pass: `cd packages/hbc-sp-services && npx jest --no-coverage` + root `npx jest --config jest.config.js --no-coverage`
- **AC:** ~60-70 new tests passing; zero regressions on existing 734 tests

### Step 10 — Playwright E2E
- [ ] Create `playwright/workflow-e2e.spec.ts` with 3 test scenarios
- [ ] Go/No-Go full flow with role switching (BD Rep → Director → Committee)
- [ ] Flag toggle: WorkflowStateMachine ON → verify machine UI, OFF → verify imperative UI
- [ ] Contract Tracking 4-step with role switching at each step
- **AC:** `npx playwright test playwright/workflow-e2e.spec.ts` — all 3 scenarios pass

### Step 11 — Full verification
- [ ] `volta run --node 22.14.0 npx tsc --noEmit` — zero errors
- [ ] `volta run --node 22.14.0 npm run lint` — zero warnings
- [ ] All tests pass (~800+ total)
- [ ] `npm run verify:bundle-size:fail` — PASS
- [ ] Dev server: pages render with flag OFF (unchanged) and ON (machine-driven)
- **AC:** All verification gates green; preview_screenshot with flag ON and OFF

### Step 12 — Re-verify HEAD before commit
- [ ] `git log --oneline -1` still outputs `fb4d879`
- **AC:** No unexpected commits between start and end of Phase 5B

---

## 5. CLAUDE.md Diffs (ready-to-insert)

### §1 Tech Stack & Build — INSERT after "Data Fetching: TanStack Query v5" line:

```diff
+- Workflows: xstate v5 + @xstate/react v4 (lazy chunk `lib-xstate-workflow`). Three machines: goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine. Feature flag: WorkflowStateMachine.
```

### §15 Current Phase Status — INSERT after existing Phase 4 content:

```diff
+- Phase 5B: Workflow State Machines — **COMPLETE** on `feature/hbc-suite-stabilization`. xstate v5 machines (goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine) + WorkflowMachineFactory + useWorkflowMachine hook + useWorkflowTransition hook + Playwright E2E. Feature flag: WorkflowStateMachine. ~65 new tests ({PRIOR_TOTAL} → {NEW_TOTAL} total).
```

### §16 Active Pitfalls & Rules — APPEND:

```diff
+- **xstate v5 machines in data layer**: Machine definitions live in `@hbc/sp-services/src/machines/` (domain layer). NO xstate imports in UI components — only `useWorkflowMachine` and `useWorkflowTransition` hooks.
+- **WorkflowMachineFactory.getAsync()**: UI layer MUST use `getAsync()` for lazy chunk loading. Direct `import` of machine files from UI would pull xstate into entrypoint (2MB hard cap violation).
+- **Machine guards check PERMISSIONS constants, not role names**: Guards use `context.userPermissions.includes(PERMISSIONS.X)` — never check role strings. This respects the PermissionEngine dual-path (§16 existing pitfall).
+- **useWorkflowTransition does NOT send() on mutation error**: If `mutation.mutateAsync()` throws, the machine stays in its previous state. This is the natural rollback — no compensating transaction needed.
+- **xstate chunk budget**: `lib-xstate-workflow` tracked in MONITORED_CHUNKS. Expected ~45-55KB raw. Any increase > 10% or 102.4KB absolute triggers fail.
+- **pmpApprovalMachine self-transitions**: APPROVE_STEP and SIGN use `assign()` to decrement `pendingSteps`/`pendingSignatures`. APPROVE_FINAL and SIGN_FINAL only fire when counter reaches 1. Never use APPROVE_FINAL when pendingSteps > 1.
```

### §21 Navigation & Suite UX Architecture:

No change — workflow machines are data-layer, not navigation.

---

## 6. SKILL.md Recommendation

**Update** `.claude/skills/resilient-data-operations/SKILL.md`:

**Add to Protocol** (after point 7):
```
8. Workflow state machines (`goNoGoMachine`, `pmpApprovalMachine`, `commitmentApprovalMachine`) formalize all approval transitions. Machine guards enforce RBAC permissions. `useWorkflowTransition` orchestrates TanStack Query mutations + xstate `send()`. Feature flag: `WorkflowStateMachine`.
```

**Add to Critical Flows Guaranteed Stable** (after point 6):
```
7. Formal workflow state machines (xstate v5) for Go/No-Go, PMP approval, and Contract Tracking — permission-gated transitions, audit-logged, with lazy-loaded `lib-xstate-workflow` chunk.
```

**No new SKILL.md file needed** — Phase 5B extends the existing resilient-data-operations skill rather than introducing a standalone new capability.
