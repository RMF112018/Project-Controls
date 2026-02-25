# Security Analysis — HBC Project Controls

Phase 5D Cross-cutting Governance Document. Last updated: 2026-02-24.

---

## 1. Threat Model Overview

HBC Project Controls runs as an SPFx 1.22.2 web part within the SharePoint Online tenant boundary. The primary attack surface includes:

- **SPFx Context**: Web parts execute with the authenticated user's delegated permissions. No elevation of privilege beyond the user's SharePoint and Graph API scopes.
- **Graph API OAuth Scopes**: Delegated permissions for user profiles, group membership, calendar, email, and Teams chat. Scopes are configured at the tenant app catalog level.
- **Tenant Boundary**: All data resides within the Hedrick Brothers SharePoint Online tenant. Cross-tenant access is architecturally impossible via SPFx.
- **Client-Side Execution**: All business logic runs in the browser. No server-side code beyond Power Automate flows and Azure Functions for provisioning.

## 2. Authentication Architecture

Three-mode matrix governs authentication:

| Mode | Trigger | Data Service | Auth Mechanism |
|------|---------|-------------|----------------|
| mock | Default (no .env) | MockDataService | None |
| standalone | VITE_DATA_SERVICE_MODE=standalone | StandaloneSharePointDataService | MSAL 5.x browser OAuth |
| sharepoint | SPFx onInit() | SharePointDataService | SPFx implicit |

**Isolation constraint**: MSAL packages are imported ONLY in `dev/auth/` directory. Never in `src/` or `@hbc/sp-services`. This prevents accidental MSAL bundle inclusion in the SPFx production build.

## 3. Authorization Layer

Six canonical roles govern access:

- **Admin**: Full system control (provisioning, user management, feature flags, audit logs).
- **Business Development Manager**: Lead creation, Go/No-Go workflow initiation.
- **Estimating Coordinator**: Job number requests, estimate tracking, project turnover.
- **Project Manager**: Buyout log, contract approvals, schedule tasks, constraints log.
- **Leadership**: Global read/write access to ALL projects and ALL departments.
- **Project Executive**: Scoped access ONLY to assigned projects and departments.

Configuration-driven via `IRoleConfiguration` (SP list-backed). `LEGACY_ROLE_MAP` normalizes 14 prior RoleName values to 6 canonical roles. `RoleGate` + `FeatureGate` required on every sensitive surface. Dual-path RBAC: when `PermissionEngine` flag is ON, resolves from `TOOL_DEFINITIONS` + permission templates; when OFF, falls back to `ROLE_PERMISSIONS`.

## 4. Data Protection

- **IDataService abstraction** (276 methods) serves as the security boundary between UI and data access.
- **columnMappings.ts** provides indirection between TypeScript property names and SP internal column names, preventing hard-coded column references in business logic.
- **Parameterized OData filters**: All SharePoint queries use parameterized filter expressions. No string concatenation of user input into OData.
- **Audit on every mutation**: All write operations call `this.logAudit()` with `AuditAction`, `EntityType`, `EntityId`, and `Details`.

## 5. Feature Flag Security

- Stored in `Feature_Flags` SharePoint list on the hub site.
- Infrastructure flags default to OFF: `GraphBatchingEnabled`, `ProvisioningSaga`, `WorkflowStateMachine`, `ConnectorMutationResilience`, `OptimisticMutationsEnabled`.
- `EnabledForRoles` array enables phased rollout to specific roles (e.g., `TelemetryDashboard` restricted to `ExecutiveLeadership` + `SharePointAdmin`).
- Feature flag evaluation is client-side via `isFeatureEnabled()` in the data service. Server-side enforcement deferred to Phase 6.

## 6. Connector Security

- **OAuth token exchange** for Procore and BambooHR is server-side (Azure Functions). Client never handles third-party OAuth tokens.
- **IConnectorRetryPolicy** enforces rate-limit awareness per adapter (Procore: 429-aware, 3 retries; BambooHR: 2 retries, exponential backoff).
- **ProcoreAdapter**: Bidirectional sync (RFIs, budget, projects). Procore API keys stored in Azure Key Vault.
- **BambooHRAdapter**: Inbound-only (employees, org chart, time off). No write operations to BambooHR.
- **ConnectorManagementPanel**: Admin-only surface with `RoleGate`. Non-admin roles see no connector grid.

## 7. Graph Batch Enforcer Security

Phase 5D `GraphBatchEnforcer` prevents Graph API rate-limit violations:

- **10ms coalescence window** with threshold of 3 for immediate flush.
- **Feature-gated** via `GraphBatchingEnabled` (default OFF). When OFF, zero overhead passthrough.
- **Audit trail**: `AuditAction.BatchEnforcerCoalesced` logged on every flush with count and window duration.
- **No setter methods**: `isFeatureEnabled` is a required constructor parameter via closure. Cannot be tampered with at runtime.

## 8. List Threshold Guard

Phase 5D `ListThresholdGuard` prevents performance degradation and potential DoS from large lists:

- **Warning at 3,000 items**: Telemetry-only via `AuditAction.ListThresholdWarning`. No behavioral change.
- **Critical at 4,500 items**: `shouldForceCursorPaging = true` (when `InfinitePagingEnabled` is also ON).
- **Dual-gate**: `shouldUseCursorPaging()` requires BOTH count >= 4500 AND `isInfinitePagingEnabled === true`.
- Applied to `getAuditLogPage()` — the only unbounded list approaching threshold.

## 9. Audit Trail Architecture

- **Schema**: `IAuditEntry` with `Action` (AuditAction enum), `EntityType` (EntityType enum), `EntityId`, `User`, `Details`, `Timestamp`.
- **Storage**: `Audit_Log` SharePoint list on hub site.
- **Immutability**: No update or delete methods for audit entries in IDataService. Write-once.
- **Archive**: Power Automate scheduled flow archives records older than 90 days to `Audit_Log_Archive`.
- **SOC2 Compliance**: Audit snapshots on role configuration mutations via `logAuditWithSnapshot()`.

## 10. Risks and Mitigations

| # | Risk | Severity | Likelihood | Mitigation | Owner |
|---|------|----------|------------|------------|-------|
| 1 | Graph API token scope over-exposure | Medium | Low | SPFx delegated permissions scoped at tenant app catalog. Regular scope review. | SharePoint Admin |
| 2 | SharePoint list threshold breach (5000 items) | High | Medium | ListThresholdGuard telemetry at 3000, forced paging at 4500. Power Automate archive flow. | Platform Team |
| 3 | Feature flag bypass via client-side manipulation | Low | Low | Flags evaluated client-side (acceptable for UI gating). Server-side enforcement in Phase 6. | Dev Team |
| 4 | Connector credential leakage | High | Low | OAuth tokens in Azure Key Vault. Server-side exchange only. Client never handles third-party tokens. | Security Team |
| 5 | Mock data service in production | Medium | Low | Three-mode architecture: SPFx mode detected via `onInit()`. Mock only when no `.env` and no SPFx context. | Dev Team |
| 6 | Unauthorized role escalation | High | Low | IRoleConfiguration SP list-backed. LEGACY_ROLE_MAP normalization. SOC2 audit on every mutation. RoleGate on all admin surfaces. | Security Team |
| 7 | Graph API rate limiting (429 errors) | Medium | Medium | GraphBatchEnforcer coalescence (10ms/3). GraphBatchService 20-chunk limit. IConnectorRetryPolicy exponential backoff. | Platform Team |
| 8 | Audit log tampering | High | Low | No update/delete methods in IDataService. SP list permissions restrict to add-only for service accounts. Archive flow preserves history. | Security Team |

## §10 Phase 7 Stage 3 — Security Hardening Remediation (Feb 2026)

### OData Injection Remediation
- **Before**: Direct string interpolation in `SharePointDataService.getLeadsByStage()`, `searchLeads()`, and project code filter.
- **After**: All OData filters use `safeODataEq()` and `safeODataSubstringOf()` from `utils/odataSanitizer.ts`.
- **Coverage**: `sanitizeODataString` escapes `'` to `''`, strips control chars, enforces max length. `sanitizeODataNumber` rejects NaN/Infinity.

### Feature Flag Enforcement (Server-Side)
- `assertFeatureFlagEnabled()` guards all template mutations: `createSiteTemplate`, `updateSiteTemplate`, `deleteSiteTemplate`, `applyTemplateToSite`, `syncTemplateToGitOps`, `syncAllTemplates`.
- Violations throw `FeatureFlagViolationError` with flag name and operation.
- `AuditAction.FeatureFlagViolation` logged.

### GraphBatchEnforcer Backpressure
- `MAX_QUEUE_DEPTH = 50` — rejects with `BackpressureError` when queue exceeds limit.
- `highWaterMark` metric tracks maximum queue depth (observability).
- `AuditAction.BackpressureRejected` logged on rejection.
- Passthrough mode (feature OFF) has zero-overhead, no backpressure.

### Permission Escalation Prevention
- `detectEscalation(currentUser, rolePermissions)` identifies unauthorized permissions.
- `assertNotSelfEscalation(currentUser, rolePermissions)` — throws `PermissionEscalationError` on self-assignment.
- Rate limiting: 10 mutations per 60s sliding window per user. `RateLimitError` on breach.
- Guards wired into `MockDataService.createRoleConfiguration()` and `updateRoleConfiguration()`.
- `AuditAction.PermissionEscalationBlocked` logged.

### Idempotency Token Lifecycle
- **Generation**: `generateCryptoHex4()` uses `crypto.getRandomValues()` (fallback: `Math.random()`).
- **Format**: `projectCode::ISO-timestamp::4-char-hex`.
- **Validation**: Format regex, project code match, 24h expiry, 5min clock skew tolerance, replay detection against existing provisioning logs.
- `AuditAction.IdempotencyReplayDetected` logged on replay.

### Template Sync State Machine
- Valid transitions: Idle to [Syncing], Syncing to [Success,Failed], Success to [Syncing,Idle], Failed to [Syncing,Idle].
- `acquireSyncLock(templateId)` / `releaseSyncLock(templateId)` — in-memory Set prevents concurrent syncs.
- `validateTemplateContent()` — URL validation (SharePoint domain, HTTPS), XSS pattern detection (7 patterns).
- Multi-approver gate: `assertSyncApproved(approvals, requiredCount=2)` with email deduplication.

### Graph Scope Policy (Least-Privilege)
- `GRAPH_SCOPE_POLICY` maps 11 Graph operations to minimum required scopes.
- `assertSufficientScope(operation, grantedScopes)` enforces least-privilege.

### ProvisioningSaga Manual Rollback
- `rollback(projectCode, originalToken)` — looks up log by token, rebuilds context, runs compensation in strict reverse order.
- `rollbackFromToken` recorded on provisioning log.
- Template version tracking: `templateVersion` and `templateType` on `IProvisioningLog` and `ISagaExecutionResult`.

### New AuditAction Values (7)
BackpressureRejected, FeatureFlagViolation, PermissionEscalationBlocked, IdempotencyReplayDetected, TemplateSyncTransitionViolation, ManualRollbackInitiated, ManualRollbackCompleted.

### Test Coverage
- 6 new utility files, 5 utility test suites (43 tests), 1 integration test suite (6 tests).
- 8 new tests in ProvisioningSaga.test.ts, 5 in GraphBatchEnforcer.test.ts, 4 in MockDataService.roleConfig.test.ts.
- Total: ~945 tests across 58 suites.
