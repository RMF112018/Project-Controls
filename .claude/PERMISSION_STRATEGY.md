# HBC Project Controls — Permission Strategy (Pentest-Prep)

> Phase 7 Stage 3 Security Hardening — Permission escalation attack surface inventory and mitigation.

## 1. Permission Escalation Attack Surface

| Vector | Surface | Mitigation |
|--------|---------|------------|
| Self-assignment | `createRoleConfiguration` / `updateRoleConfiguration` | `assertNotSelfEscalation()` — compares `defaultPermissions` against `currentUser.permissions` |
| Rate abuse | Rapid role mutations | `checkRateLimit()` — 10 mutations per 60s sliding window per user email |
| Feature bypass | Template operations when flag OFF | `assertFeatureFlagEnabled()` on all template mutations |
| OData injection | `getLeadsByStage`, `searchLeads` | `safeODataEq()` / `safeODataSubstringOf()` parameterization |
| XSS in templates | `createSiteTemplate` / `updateSiteTemplate` | `validateTemplateContent()` — 7 script injection patterns |
| Concurrent sync | `syncTemplateToGitOps` | `acquireSyncLock()` / `releaseSyncLock()` with state machine transitions |
| Graph API abuse | Unbounded batch queue | `BackpressureError` at `MAX_QUEUE_DEPTH=50` |
| Idempotency replay | Provisioning duplicate runs | Token validation with 24h expiry + replay detection |

## 2. Self-Assignment Prevention

**Utility**: `packages/hbc-sp-services/src/utils/escalationGuard.ts`

- `detectEscalation(currentUser, rolePermissions)` — returns `string[]` of permissions user does not hold.
- `assertNotSelfEscalation(currentUser, rolePermissions)` — throws `PermissionEscalationError` if escalation detected.
- Error includes `userEmail` and `attemptedPermissions` for SOC2 audit.

**Wired into**: `MockDataService.createRoleConfiguration()`, `MockDataService.updateRoleConfiguration()`.

## 3. Rate Limiting Policy

- **Window**: 60 seconds (sliding)
- **Limit**: 10 mutations per user per window
- **Scope**: Per `userEmail` + `operation` key
- **Error**: `RateLimitError` with `operation` and `windowMs`
- **Cleanup**: `resetRateLimiter()` for test isolation

## 4. SOC2 Audit Snapshot Requirements

All role mutations generate audit entries with:
- `AuditAction.RoleConfigurationCreated` / `Updated` / `Deleted`
- Before/after JSON snapshots in `Details` field
- `EntityType.RoleConfiguration` + `EntityId` = role config ID
- `User` = `createdBy` / `lastModifiedBy`

Escalation attempts additionally log:
- `AuditAction.PermissionEscalationBlocked` with attempted permissions list

## 5. Graph API Least-Privilege Scope Mapping

**Utility**: `packages/hbc-sp-services/src/utils/graphScopePolicy.ts`

| Operation | Required Scope |
|-----------|---------------|
| CreateGroup | Group.ReadWrite.All |
| UpdateGroup | Group.ReadWrite.All |
| DeleteGroup | Group.ReadWrite.All |
| AddGroupMember | Group.ReadWrite.All |
| RemoveGroupMember | Group.ReadWrite.All |
| CreateSite | Sites.FullControl.All |
| DeleteSite | Sites.FullControl.All |
| UpdateSiteProperties | Sites.FullControl.All |
| ListUsers | User.Read.All |
| GetUser | User.Read.All |
| AssociateHubSite | Sites.FullControl.All |

## 6. Feature Flag Enforcement Matrix

| Flag | Guarded Operations |
|------|-------------------|
| SiteTemplateManagement | createSiteTemplate, updateSiteTemplate, deleteSiteTemplate, applyTemplateToSite, syncTemplateToGitOps, syncAllTemplates |
| GraphBatchingEnabled | GraphBatchEnforcer coalescence (passthrough when OFF) |
| ProvisioningSaga | Saga-style provisioning (legacy runSteps when OFF) |
| WorkflowStateMachine | xstate workflow machines (imperative path when OFF) |
