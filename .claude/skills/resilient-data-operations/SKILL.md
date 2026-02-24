---
name: HBC Resilient Data Operations
description: Production-grade resilient Graph/SharePoint data layer for the HBC Project Controls SPFx suite – enforcing batching (GraphBatchService), TanStack Query mutations with retry/backoff (useConnectorMutation), saga-style compensation (ProvisioningSaga), and real-time SignalR status. Eliminates transient failures, orphaned resources, and silent data corruption while staying under SPFx limits and SOC2 audit requirements.
version: 1.3
category: core-services
triggers: connector, graph-batch, retry, backoff, provisioning-saga, compensation, signalr-status, resilient-data-operations, GraphBatchService, useConnectorMutation, ProvisioningSaga, IConnectorRetryPolicy, GraphBatchEnforcer, ProvisioningStatusStepper, useProvisioningStatus, RetryAttempt, CircuitBreak, BatchFallback
updated: 2026-02-24
---

# HBC Resilient Data Operations Skill

**Activation**
Implementing, extending, debugging, or optimizing any Graph/SharePoint connector call, batch operation, retry policy, saga compensation, or real-time SignalR status flow across the HBC Project Controls application (post Phase 5A commit fb4d8793 and Phase 5C saga implementation).

**Protocol**
1. All Graph/SharePoint calls MUST route through `useConnectorMutation` (or `GraphBatchService` for bulk) in `@hbc/sp-services`. Direct `graphClient` or PnP calls outside the service layer are prohibited.
2. Feature-flag gating is mandatory: `ConnectorMutationResilience` (Phase 5A), `ProvisioningSaga` (Phase 5C), `GraphBatchingEnabled`. Default off in mock mode.
3. Retry/backoff policy follows `IConnectorRetryPolicy` per adapter (Procore: 429-aware, 3 retries; BambooHR: 2 retries). Exponential backoff with SOC2 audit on every attempt.
4. Saga compensation (ProvisioningSaga) runs in strict reverse order for completed steps only; compensation failures are logged but never thrown. See Compensation Table below.
5. Idempotency token required on all long-running operations (`projectCode::timestamp::hex4`). Token stored on `IProvisioningLog.idempotencyToken`.
6. Real-time status (SignalR `ProvisioningStatus` channel) must use `useProvisioningStatus` hook; UI stepper follows Elevated UI/UX Skill (150-250 ms Fluent motionTokens, role-aware contrast, WCAG 2.2 AA).
7. Every new resilient pattern must be added to this SKILL.md and cross-documented in CLAUDE.md §7/§15/§16 immediately.
8. Post-change verification: run `npm run verify:bundle-size:fail`, `npm run verify:sprint3`, and full E2E suite. Update this SKILL.md before merge.

**Saga Compensation Table (Phase 5C)**

| Step | Forward Action | Compensation | IDataService Method | Critical |
|------|---------------|-------------|-------------------|----------|
| 7 | updateLead (set ProjectSiteURL) | Clear ProjectSiteURL | existing `updateLead` | No |
| 6 | copyLeadDataToProjectSite | Remove lead data from site | `removeLeadDataFromProjectSite` | No |
| 5 | copyTemplateFiles | Remove template files | `removeTemplateFiles` | No |
| 4 | createProjectSecurityGroups | Delete security groups | `deleteProjectSecurityGroups` | YES |
| 3 | associateWithHubSite | Disassociate from hub | `disassociateFromHubSite` | No |
| 2 | provisionProjectLists | Remove provisioned lists | `removeProvisionedLists` | No |
| 1 | createProjectSite | Delete project site | `deleteProjectSite` | YES |

Compensation order: Reverse (7 -> 1). Step 1 (site deletion) runs LAST.

**SignalR ProvisioningStatus Channel (Phase 5C)**

- Message type: `IProvisioningStatusMessage` (projectCode, currentStep, totalSteps, stepStatus, progress, error)
- Hook: `useProvisioningStatus(projectCode)` -> `{ status, currentStep, progress, stepLabel, stepStatus, error, isConnected }`
- UI: `ProvisioningStatusStepper` with Fluent UI v9 icons, motionToken transitions (durationFast-durationGentle, 150-250ms), reduced-motion support
- Webpack: `lib-signalr-realtime` async chunk (priority 20)
- Broadcast: Saga emits status after each step complete/fail/compensate via injected callback

**Critical Flows Guaranteed Stable**
1. Bulk Graph operations (security groups, Procore sync) via GraphBatchService (20-request chunking, auto-correlation).
2. Connector mutations with per-adapter retry/backoff and automatic query invalidation.
3. Full 7-step provisioning with saga compensation (reverse-order rollback, idempotency, 6 dedicated compensation IDataService methods).
4. Real-time ProvisioningStatusHub updates via SignalR (step icons, 150-250 ms motion, role-aware contrast).
5. GraphBatchEnforcer auto-batching: 10ms coalescence, threshold 3, direct constructor-injected isFeatureEnabled callback, feature flag GraphBatchingEnabled. File: `packages/hbc-sp-services/src/services/GraphBatchEnforcer.ts`.
6. Audit_Log paging guard: ListThresholdGuard CLASS at 3000 (warning telemetry) / 4500 (force paging), dual-gate with InfinitePagingEnabled, ThresholdLevel enum, exported singleton. File: `packages/hbc-sp-services/src/utils/ListThresholdGuard.ts`.
7. Compensation failures logged with SOC2 audit trail — never thrown, never block saga completion.

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

**Phase 5A.1 Connector Resilience Adoption**

- All adapters accept optional GraphBatchEnforcer and call enqueue() when provided.
- Universal useConnectorMutation hook adopted across all 8 connector mutation sites.
- ConnectorRegistry enforces IConnectorRetryPolicy on registration (fail-fast).
- 6 new Playwright resilience E2E scenarios.
- New AuditAction values: RetryAttempt, CircuitBreak, BatchFallback.
- Files: ProcoreAdapter.ts, BambooHRAdapter.ts, ConnectorRegistry.ts, ConnectorManagementPanel.tsx, ProcoreRFIsPage.tsx, ProcoreBudgetPage.tsx, ProcoreConflictsPage.tsx, BambooDirectoryPage.tsx, BambooTimeOffPage.tsx, BambooMappingsPage.tsx.

**Manual Test Steps**
1. Enable `ConnectorMutationResilience` -> Trigger Procore sync -> Confirm 429 simulation retries with audit log entries.
2. Run bulk security-group creation -> Verify GraphBatchService chunks at 20 and correlates responses.
3. Enable `ProvisioningSaga` -> Simulate provisioning failure at step 3 -> Confirm reverse compensation runs steps 2, 1 -> Verify audit logs for SagaCompensationStarted, SagaStepCompensated.
4. Monitor Admin Provisioning Dashboard -> Expand in-progress row -> Confirm ProvisioningStatusStepper updates live with correct icons and motion (reduced-motion respected).
5. Toggle `GraphBatchingEnabled` ON -> enqueue 4 Graph calls in rapid succession -> confirm single executeBatch call with 4 requests. Verify AuditAction.BatchEnforcerCoalesced logged.
6. Verify getAuditLogPage with >3000 mock entries -> confirm AuditAction.ListThresholdWarning telemetry with EntityType.ListThreshold. Verify >4500 sets shouldForceCursorPaging=true.
7. Verify idempotency: trigger provisioning twice rapidly -> confirm different tokens, no duplicates.
8. Test compensation failure: mock `deleteProjectSite` to throw -> confirm error logged, other compensations still run, no exception thrown.

**Reference**
- `CLAUDE.md` §7 (276 methods), §15 (Phase 5C), §16 (saga + SignalR pitfalls)
- `packages/hbc-sp-services/src/services/ProvisioningSaga.ts`
- `packages/hbc-sp-services/src/models/IProvisioningSaga.ts`
- `src/webparts/hbcProjectControls/components/hooks/useProvisioningStatus.ts`
- `src/webparts/hbcProjectControls/components/shared/ProvisioningStatusStepper.tsx`
- `packages/hbc-sp-services/src/services/GraphBatchEnforcer.ts`
- `packages/hbc-sp-services/src/utils/ListThresholdGuard.ts`
- `.claude/SECURITY_ANALYSIS.md`
- `.claude/DATA_ARCHITECTURE.md`
- `.claude/skills/provisioning-engine/SKILL.md`
- `.claude/skills/elevated-ux-ui-design/SKILL.md`
