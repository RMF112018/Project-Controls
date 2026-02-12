# Permissions & Security Analysis — HBC Project Controls (Post-Phase 32)

**Date:** 2026-02-12
**Application:** HBC Project Controls SPFx Web Part
**Version:** 1.0.0.0
**SPFx Version:** 1.21.1
**Assessment Scope:** Graph API scopes, permission model, audit coverage, deployment configuration, remaining risks

---

## Context

This analysis examines the permissions and security posture of the HBC Project Controls SPFx application. Phase 32 resolved the highest-priority items from the original analysis. This document reflects the **post-Phase 32 state** and identifies remaining risks and recommendations.

**Resolved by prior phases:**
- Phase 31: `getCurrentUser()` implementation, GraphService initialization, hook error protection
- Phase 32: Removed unused scopes, GraphService audit logging, provisioning URL fix, fire-and-forget audit trail

**No further code changes are recommended.** All remaining items are deployment configuration or accepted risks.

---

## 1. Graph API Scope Inventory (Current State)

### 1.1 Declared Scopes (config/package-solution.json — 8 scopes)

| # | Scope | Status | Admin Consent |
|---|-------|--------|--------------|
| 1 | `User.Read` | Active (SPFx framework) | No |
| 2 | `Group.Read.All` | Reserved (getGroupMembers exists, not yet called) | Yes |
| 3 | `Group.ReadWrite.All` | Active — addGroupMember() via ProjectAssignmentsPanel | Yes |
| 4 | `Calendars.Read.Shared` | Reserved (MeetingScheduler feature flag) | No |
| 5 | `Calendars.ReadWrite` | Reserved (MeetingScheduler feature flag) | No |
| 6 | `Mail.Send` | Reserved (DualNotifications feature flag) | No |
| 7 | `Chat.Create` | Reserved (DualNotifications feature flag) | Yes |
| 8 | `ChatMessage.Send` | Reserved (DualNotifications feature flag) | Yes |

**Phase 32 changes:** `User.Read.All` and `Sites.ReadWrite.All` removed (were unused, created unnecessary admin consent burden).

### 1.2 GraphService Audit Coverage (Phase 32)

All 8 GraphService methods now have try/catch + `logGraphCall()` audit logging:
- **Mutations** (addGroupMember, createCalendarEvent, sendEmail, createTeamsChat): log both success and failure
- **Reads** (getGroupMembers, getCalendarAvailability, getCurrentUserProfile): log failures only
- **Fire-and-forget failures** in `usePermissionEngine.inviteToSiteGroup`: now logged to audit trail with `AuditAction.GraphGroupMemberAddFailed`

New enums added in Phase 32: `GraphApiCallSucceeded`, `GraphApiCallFailed`, `GraphGroupMemberAdded`, `GraphGroupMemberAddFailed` (AuditAction), `GraphApi` (EntityType).

### 1.3 Directory.ReadWrite.All Not Needed

Phase 27's `addGroupMember()` adds users to *existing* Azure AD security groups. `Group.ReadWrite.All` is sufficient. `Directory.ReadWrite.All` would only be needed for role assignments or OU management, which are outside the app's scope. PowerAutomate flows handle site/group creation with their own service identity.

---

## 2. Resolved Issues

| Issue | Resolution | Phase |
|-------|-----------|-------|
| `getCurrentUser()` throws in production | Implemented using SPFx page context + App_Roles lookup | 31 |
| GraphService not initialized | Wired in `WebPart.onInit()` via `msGraphClientFactory.getClient('3')` | 31 |
| Unprotected hook callbacks crash pages | try/catch on 24 callbacks (useGoNoGo + usePermissionEngine) | 31 |
| `User.Read.All` / `Sites.ReadWrite.All` over-broad | Removed from package-solution.json | 32 |
| No Graph API call auditing | `GraphAuditLogger` callback + `logGraphCall()` on all 8 methods | 32 |
| Fire-and-forget swallows 403 errors | `inviteToSiteGroup` catch block now logs to audit trail | 32 |
| Provisioning URL domain mismatch | Fixed `hedrickbrothers` → `hedrickbrotherscom` (lines 158, 259) | 32 |

---

## 3. Remaining Risks (No Code Changes Needed)

### 3.1 Deployment Configuration Items

| Risk | Severity | Action Required | Owner |
|------|----------|----------------|-------|
| Mock group IDs (`aad-group-001`–`009`) | P1 High | Replace with real Azure AD object IDs before production | SharePoint Admin |
| PowerAutomate endpoints unconfigured | P2 Medium | Configure flow HTTP trigger URLs or rely on local fallback | IT Admin |
| Admin consent not granted | P2 Medium | Follow phased consent strategy (§4 below) | SharePoint Admin |

### 3.2 Accepted Risks (No Action)

| Risk | Severity | Rationale |
|------|----------|-----------|
| Client-side RBAC bypass via DevTools | P3 Low | SharePoint list-level permissions are the real security boundary; UI guards provide UX clarity |
| SharePointAdmin role has ALL permissions | P3 Low | Intentional for IT administrators; blast radius acceptable for internal app |
| Notification emails contain financial data | P3 Low | PowerAutomate is the intended email path; Graph Mail.Send is feature-flagged off |
| Dev Super-Admin deployable in mock mode | P3 Low | `dataServiceMode` defaults to mock; production requires explicit `'sharepoint'` setting |

---

## 4. Phased Admin Consent Strategy

| Phase | Scopes to Approve | When |
|-------|-------------------|------|
| **MVD** | `User.Read`, `Group.Read.All`, `Group.ReadWrite.All` (3 scopes) | Before first deployment |
| **Calendar** | + `Calendars.Read.Shared`, `Calendars.ReadWrite` | When MeetingScheduler feature enabled |
| **Email** | + `Mail.Send` | When PowerAutomate bypass needed for direct email |
| **Teams** | + `Chat.Create`, `ChatMessage.Send` | When DualNotifications flag enabled |

SPFx consent model: Developer declares → `.sppkg` uploaded → Admin approves in **Admin center → Advanced → API access**. No interactive consent. Unapproved scopes fail silently with 403 at runtime.

---

## 5. Architecture Notes (No Changes Needed)

- **No custom Azure AD app registration needed** — SPFx uses SharePoint's service principal (`57fb890c`). PowerAutomate flows handle background operations.
- **PnP Graph not initialized** — `graphService` uses raw `MSGraphClient v3`. No conflict with `@pnp/sp`, but a dual-access pattern exists as a latent design gap.
- **Permission resolution uses feature-flagged engine** — When `PermissionEngine` flag (id: 23) is enabled, `resolveUserPermissions()` resolves via security group → template → project override chain. When disabled, falls back to `ROLE_PERMISSIONS[role]`.

---

## 6. Files Referenced

| File | Status |
|------|--------|
| `config/package-solution.json` | 8 scopes (post-Phase 32) |
| `services/GraphService.ts` | Full audit logging (post-Phase 32) |
| `services/ProvisioningService.ts` | URL fixed (post-Phase 32) |
| `hooks/usePermissionEngine.ts` | Failure audit logging (post-Phase 32) |
| `HbcProjectControlsWebPart.ts` | GraphService + audit logger wired (post-Phase 32) |
| `mock/securityGroupMappings.json` | 9 placeholder IDs — deployment config item |
| `services/PowerAutomateService.ts` | Endpoints unconfigured — deployment config item |

---

## Related Documents

- [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md) — Build process, stub coverage, SP list inventory
- [PERMISSION_STRATEGY.md](./PERMISSION_STRATEGY.md) — Dual-layer permission model, RBAC architecture
- [CLAUDE.md](../CLAUDE.md) — §10 RBAC Matrix, §11 Feature Flags, §16 Common Pitfalls
