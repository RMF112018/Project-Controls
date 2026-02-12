# HBC Project Controls — Deployment Readiness Report

**Date:** 2026-02-12
**Application:** HBC Project Controls SPFx Web Part
**Version:** 1.0.0.0
**SPFx Version:** 1.21.1
**Assessment Scope:** Build process, version alignment, stub coverage, Graph API scopes, provisioning gaps, prioritized remediation

---

## Executive Summary

**Deployment Status: PARTIAL — Core features ready, advanced features require SharePointDataService implementation**

The HBC Project Controls application is structurally sound and ready for deployment of its **Minimum Viable Deployment (MVD)** scope. The SPFx build pipeline, version alignment, and web part packaging are fully validated. However, **76% of SharePointDataService methods remain stubbed**, meaning only a subset of features will function against live SharePoint data.

| Area | Status | Details |
|------|--------|---------|
| SPFx Version Alignment | CLEAR | All 10 SPFx packages at 1.21.1 |
| Build Pipeline | READY | gulp bundle/package-solution --ship verified |
| Web Part Manifest | READY | SharePoint + Teams hosts, tenant-wide deployment |
| SharePointDataService | CRITICAL GAP | 51 of 204 methods implemented (25%) |
| Graph API Scopes | CLEAN | 8 scopes declared, all used; unused scopes removed (Phase 32) |
| Provisioning Service | MOCK ONLY | All 7 steps are simulated; hardcoded tenant URL |
| CDN/Storage Config | PLACEHOLDER | Requires deployment-time configuration |
| `getCurrentUser()` | FIXED (Phase 31) | SP implementation uses page context + App_Roles lookup |

---

## 1. SPFx Version Alignment

**Status: CLEAR — No mismatch detected**

All SPFx runtime and dev dependencies are aligned at version 1.21.1:

| Package | Type | Version | Aligned |
|---------|------|---------|---------|
| @microsoft/sp-core-library | Runtime | 1.21.1 | Yes |
| @microsoft/sp-lodash-subset | Runtime | 1.21.1 | Yes |
| @microsoft/sp-office-ui-fabric-core | Runtime | 1.21.1 | Yes |
| @microsoft/sp-property-pane | Runtime | 1.21.1 | Yes |
| @microsoft/sp-webpart-base | Runtime | 1.21.1 | Yes |
| @microsoft/sp-build-web | Dev | 1.21.1 | Yes |
| @microsoft/sp-module-interfaces | Dev | 1.21.1 | Yes |
| @microsoft/eslint-config-spfx | Dev | 1.21.1 | Yes |
| @microsoft/eslint-plugin-spfx | Dev | 1.21.1 | Yes |
| @microsoft/sp-build-core-tasks | Dev | 1.21.1 | Yes |

---

## 2. Node Version Advisory

**Status: ADVISORY — Documented intentional mismatch**

| Setting | Value |
|---------|-------|
| package.json `engines` | `>=18.17.1 <19.0.0` |
| package.json `volta.node` | `22.14.0` |
| CLAUDE.md documented | Yes — Volta 22.14.0 for local dev, Node 18.x for CI/CD |

**Recommendation:** CI/CD pipelines should enforce Node 18.x (e.g., `18.20.x`). Local development uses Volta to pin Node 22.14.0, which is compatible with SPFx 1.21.1 gulp commands when prefixed with `volta run --node 22.14.0`.

---

## 3. Build Process Validation

**Status: READY**

### Build Configuration

| Config File | Status | Notes |
|-------------|--------|-------|
| `gulpfile.js` | Valid | SPFx 1.21.1 build init, SASS warning suppression for ms-Grid |
| `tsconfig.json` | Valid | target: es2017, module: esnext, strict mode, 8 path aliases |
| `config/config.json` | Valid | Bundle entry: `./lib/webparts/hbcProjectControls/HbcProjectControlsWebPart.js` |
| `config/serve.json` | Valid | Port 4321, HTTPS, workbench initial page |
| `config/package-solution.json` | Valid | Solution ID, 8 Graph scopes, skipFeatureDeployment: true |
| `dev/webpack.config.js` | Valid | Dev server port 3000, REACT_APP_USE_MOCK=true |

### Build Commands

| Command | Purpose | Status |
|---------|---------|--------|
| `gulp serve --nobrowser` | SPFx local workbench | Ready |
| `gulp bundle --ship` | Production bundle (minification, tree-shaking) | Ready |
| `gulp package-solution --ship` | Create .sppkg package | Ready |
| `npm run dev` | Standalone dev server (port 3000, mock data) | Ready |
| `npm run build` | bundle --ship + package-solution --ship | Ready |

### Web Part Manifest

| Property | Value |
|----------|-------|
| Solution ID | `a3e7b5d2-9f14-4c68-b3a1-2d5e8f6c9b04` |
| Web Part ID | `c8e4f1a9-6d23-4b87-9e5c-1a3f7d8b2e60` |
| Supported Hosts | SharePointWebPart, TeamsPersonalApp, TeamsTab |
| Manifest Version | 2 |
| Skip Feature Deployment | true (tenant-wide, no per-site activation) |
| Domain Isolated | false |

### .sppkg Output

The `.sppkg` file is generated at `sharepoint/solution/hbc-project-controls.sppkg`. This file is uploaded to the SharePoint tenant app catalog for deployment.

---

## 4. CDN & Azure Storage Configuration

**Status: PLACEHOLDER — Requires deployment-time configuration**

| File | Field | Current Value | Required Action |
|------|-------|---------------|-----------------|
| `config/write-manifests.json` | `cdnBasePath` | `<!-- PATH TO CDN -->` | Set to Azure CDN or SharePoint CDN URL |
| `config/deploy-azure-storage.json` | `account` | `<!-- AZURE STORAGE ACCOUNT NAME -->` | Set Azure Storage account name |
| `config/deploy-azure-storage.json` | `accessKey` | `<!-- AZURE STORAGE ACCESS KEY -->` | Set Azure Storage access key |

**Options for CDN hosting:**

1. **SharePoint CDN (recommended for simplicity):** Enable Office 365 CDN on the tenant, set `cdnBasePath` to the CDN origin. No Azure Storage needed.
2. **Azure Blob Storage + CDN:** Create a storage account, configure Azure CDN, set both `deploy-azure-storage.json` fields and `cdnBasePath`.

If using the SharePoint tenant app catalog with `includeClientSideAssets: true` (current setting), assets are bundled into the `.sppkg` itself and no external CDN is strictly required for initial deployment.

---

## 5. SharePointDataService Implementation Matrix

**Status: CRITICAL GAP — 51 of 204 methods implemented (25%)**

### Implementation Summary

| Category | Implemented | Stubbed | Total |
|----------|------------|---------|-------|
| Leads CRUD | 7 | 0 | 7 |
| Scorecards (basic CRUD) | 5 | 7 | 12 |
| Estimating CRUD | 8 | 0 | 8 |
| Roles/Flags | 4 | 0 | 4 |
| Audit | 2 | 1 | 3 |
| Provisioning | 2 | 3 | 5 |
| Phase 6 Workflow | 14 | 0 | 14 |
| Buyout/Commitment/Compliance | 12 | 0 | 12 |
| Active Projects Portfolio | 7 | 0 | 7 |
| App Context/Reference | 3 | 0 | 3 |
| getCurrentUser | 1 | 0 | 1 |
| Scorecard Workflow | 0 | 7 | 7 |
| Workflow Definitions | 0 | 10 | 10 |
| Permission Engine | 0 | 15 | 15 |
| Project Operations | 0 | 84 | 84 |
| Meetings/Notifications | 0 | 5 | 5 |
| Provisioning Triggers | 0 | 3 | 3 |
| Miscellaneous | 0 | 4 | 4 |
| **Total** | **51** | **153** | **204** |

### Priority 1 — App Cannot Start (1 method) — **RESOLVED**

| Method | Status |
|--------|--------|
| `getCurrentUser()` | **Implemented in Phase 31** — Uses SPFx page context + App_Roles SP list lookup + ROLE_PERMISSIONS mapping |

### Priority 2 — Core Workflows Broken (16 methods)

| Category | Methods | Impact |
|----------|---------|--------|
| Scorecard Workflow (7) | submitScorecard, respondToScorecardSubmission, enterCommitteeScores, recordFinalDecision, unlockScorecard, relockScorecard, getScorecardVersions | Go/No-Go approval workflow non-functional |
| Workflow Definitions (9) | getWorkflowDefinitions, getWorkflowDefinition, updateWorkflowStep, add/update/removeConditionalAssignment, get/set/removeWorkflowStepOverride, resolveWorkflowChain | Admin workflow configuration non-functional |

### Priority 3 — Permission Engine Broken (15 methods)

| Category | Methods | Impact |
|----------|---------|--------|
| Permission Templates (5) | get/getAll/create/update/delete PermissionTemplate | Template-based authorization disabled |
| Security Group Mappings (3) | get/create/update SecurityGroupMapping | Group-to-template mapping broken |
| Project Team Assignments (7) | get/getAll/getMyProjectAssignments/create/update/remove ProjectTeamAssignment, resolveUserPermissions, getAccessibleProjects | Project-scoped permissions non-functional |

**Note:** When `PermissionEngine` feature flag is disabled, the app falls back to `ROLE_PERMISSIONS[role]` from `utils/permissions.ts`, so the app still functions with role-based permissions.

### Priority 4 — Project Operations Broken (84 methods)

All project-level operations including:
- Startup checklist (4), Responsibility matrices (14), Marketing records (4)
- Risk/cost management (4), Quality concerns (3), Safety concerns (3)
- Project schedule (3), Superintendent plan (3), Lessons learned (3)
- PMP (7), Monthly review (4), Estimating kickoff (8)
- Job number requests (4), Reference data (2), Turnover agenda (16)
- BD Leads folders (4), Assignment mappings (4), Sector definitions (3)
- Environment config (2), Miscellaneous (2)

### Priority 5 — Delegated by Design (9 methods)

| Category | Methods | Notes |
|----------|---------|-------|
| Meetings (3) | getCalendarAvailability, createMeeting, getMeetings | "Use GraphService directly" — by design |
| Notifications (2) | sendNotification, getNotifications | "Use PowerAutomateService directly" — by design |
| Provisioning (3) | triggerProvisioning, updateProvisioningLog, retryProvisioning | "Use PowerAutomateService directly" — by design |
| Audit (1) | purgeOldAuditEntries | Administrative maintenance — low priority |

---

## 6. Graph API Scope Analysis

**Status: CLEAN — Unused scopes removed (Phase 32), all Graph methods audit-logged**

### Declared Scopes (8 scopes, down from 11)

| Declared Scope | Used By | Method | Admin Consent |
|---------------|---------|--------|---------------|
| `User.Read` | SPFx framework | `/me` (current user profile) | No |
| `Group.Read.All` | GraphService | `getGroupMembers()` — `/groups/{id}/members` (GET) | Yes |
| `Group.ReadWrite.All` | GraphService | `addGroupMember()` — `/groups/{id}/members/$ref` (POST) | Yes |
| `Calendars.Read.Shared` | GraphService | `getCalendarAvailability()` — `/me/calendar/getSchedule` | No |
| `Calendars.ReadWrite` | GraphService | `createCalendarEvent()` — `/me/events` (POST) | No |
| `Mail.Send` | GraphService | `sendEmail()` — `/me/sendMail` | No |
| `Chat.Create` | GraphService | `createTeamsChat()` — `/chats` (POST) | Yes |
| `ChatMessage.Send` | GraphService | `createTeamsChat()` — `/chats/{id}/messages` (POST) | Yes |

### Scopes Removed (Phase 32)

| Scope | Reason for Removal |
|-------|-------------------|
| `User.Read.All` | No code path called it — SPFx `pageContext.user` provides current user; `getUserPhoto()` uses `User.Read` |
| `Sites.ReadWrite.All` | No code path called it — `@pnp/sp` with SPFx context provides site-scoped access through page context |

### Phased Admin Consent Strategy

| Phase | Scopes to Approve | When |
|-------|-------------------|------|
| **MVD** | `User.Read`, `Group.ReadWrite.All`, `Group.Read.All` (3 scopes) | Before first deployment |
| **Calendar** | + `Calendars.Read.Shared`, `Calendars.ReadWrite` | When MeetingScheduler feature enabled |
| **Email** | + `Mail.Send` | When PowerAutomate bypass needed for email |
| **Teams** | + `Chat.Create`, `ChatMessage.Send` | When DualNotifications flag enabled |

### GraphService Audit Logging (Phase 32)

All 8 GraphService methods now log to the application audit trail via `GraphAuditLogger` callback:
- **Mutations** (addGroupMember, createCalendarEvent, sendEmail, createTeamsChat): Log both success and failure
- **Reads** (getGroupMembers, getCalendarAvailability, getCurrentUserProfile): Log failures only
- **getUserPhoto**: Silent failure (cosmetic — no audit needed)
- Fire-and-forget `inviteToSiteGroup` in `usePermissionEngine.ts` now logs 403/failure to audit trail

---

## 7. Provisioning Service Analysis

**Status: HIGH RISK — Mock-only implementation**

### Current State

| Component | Status | Details |
|-----------|--------|---------|
| `provisionSite()` 7-step engine | Mock only | Each step simulates with 500ms `setTimeout` |
| `provisionSiteWithFallback()` | Implemented | 3-tier fallback chain (PowerAutomate → local → offline) |
| `retryFromStep()` | Implemented | Retry with max 3 attempts |
| `ProvisioningStatus` stepper UI | Implemented | Real-time polling with step progress display |
| Hub navigation link creation | Mock only | `SharePointHubNavigationService` throws on all 3 methods |

### Hardcoded Values

| Location | Value | Action Required |
|----------|-------|-----------------|
| `ProvisioningService.ts:158` | `https://hedrickbrotherscom.sharepoint.com/sites/` | Fixed in Phase 32 — was `hedrickbrothers` |
| `ProvisioningService.ts:259` | `https://hedrickbrotherscom.sharepoint.com/sites/` | Fixed in Phase 32 — was `hedrickbrothers` |
| `utils/constants.ts` | `DEFAULT_HUB_SITE_URL = 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral'` | Verify correct tenant domain |

**Note:** The domain inconsistency (`hedrickbrothers` vs `hedrickbrotherscom`) has been fixed in Phase 32. Both ProvisioningService and constants now use `hedrickbrotherscom.sharepoint.com`.

### Production Implementation Requirements

For production provisioning, each of the 7 steps needs real PnP/SP REST implementation:

1. **Create site** — `@pnp/sp` site creation via admin API or Power Automate
2. **Apply PnP template** — `provisioning/site-template.json` via PnP provisioning engine
3. **Hub association** — Associate new site with hub site via SP REST API
4. **Security groups** — Create/configure SP groups for project RBAC
5. **Copy templates** — Copy document library templates from hub to project site
6. **Copy lead data** — Populate project site lists with data from `Leads_Master`
7. **Update Leads_Master** — Write `ProjectSiteURL` back to the lead record

### Offline Queue Concern

`OfflineQueueService` uses `sessionStorage` which is cleared on browser close. For reliable offline provisioning, this should use `localStorage` or IndexedDB.

---

## 8. Configuration Checklist

Before deploying to any environment, complete the following:

### Required Configuration

- [ ] **CDN Path** — Set `cdnBasePath` in `config/write-manifests.json` (or use bundled assets via `includeClientSideAssets: true`)
- [ ] **Azure Storage** — If using Azure CDN: set `account` and `accessKey` in `config/deploy-azure-storage.json`
- [ ] **Graph Admin Consent** — Approve all 8 API permission requests in SharePoint admin center (see §6 for phased consent strategy)
- [ ] **`getCurrentUser()` implementation** — Implement in `SharePointDataService.ts` before any deployment
- [ ] **Tenant domain** — Verify and configure the correct SharePoint tenant domain for provisioning URLs
- [ ] **Hub site URL** — Verify `DEFAULT_HUB_SITE_URL` matches the actual hub site

### Optional Configuration (Feature-Dependent)

- [ ] **Power Automate endpoints** — Configure `PowerAutomateService` HTTP trigger URLs for provisioning, notifications, and archive flows
- [ ] **Hub Navigation Service** — Implement `SharePointHubNavigationService` for post-provisioning nav link creation
- [ ] **Feature flags** — Review `Feature_Flags` list; disable features not ready for production (e.g., `OfflineSupport`, `AuditTrail`, all integrations)

### SharePoint Lists to Create

The application requires SharePoint lists on both the hub site and each project site. List schemas are defined in `services/columnMappings.ts` (1267 lines).

**Hub site lists (32):**
`Leads_Master`, `App_Roles`, `Feature_Flags`, `App_Context_Config`, `Audit_Log`, `Audit_Log_Archive`, `Provisioning_Log`, `Estimating_Tracker`, `GoNoGo_Scorecard`, `GNG_Committee`, `Active_Projects_Portfolio`, `Template_Registry`, `Regions`, `Sectors`, `Autopsy_Attendees`, `Job_Number_Requests`, `Estimating_Kickoffs`, `Estimating_Kickoff_Items`, `Loss_Autopsies`, `Marketing_Project_Records`, `Lessons_Learned_Hub`, `Project_Types`, `Standard_Cost_Codes`, `Workflow_Definitions`, `Workflow_Steps`, `Workflow_Conditional_Assignments`, `Workflow_Step_Overrides`, `Permission_Templates`, `Security_Group_Mappings`, `Project_Team_Assignments`, `Sector_Definitions`, `Assignment_Mappings`

**Per-project site lists (37):**
`Project_Info`, `Team_Members`, `Deliverables`, `Action_Items`, `Turnover_Checklist`, `Buyout_Log`, `Commitment_Approvals`, `Startup_Checklist`, `Checklist_Activity_Log`, `Internal_Matrix`, `Owner_Contract_Matrix`, `Sub_Contract_Matrix`, `Risk_Cost_Management`, `Risk_Cost_Items`, `Quality_Concerns`, `Safety_Concerns`, `Project_Schedule`, `Critical_Path_Items`, `Superintendent_Plan`, `Superintendent_Plan_Sections`, `Lessons_Learned`, `Project_Management_Plans`, `PMP_Signatures`, `PMP_Approval_Cycles`, `PMP_Approval_Steps`, `Monthly_Reviews`, `Monthly_Checklist_Items`, `Monthly_Follow_Ups`, `Closeout_Items`, `Marketing_Project_Record`, `Contract_Info`, `Interview_Prep`, `Turnover_Agendas`, `Turnover_Prerequisites`, `Turnover_Discussion_Items`, `Turnover_Subcontractors`, `Turnover_Exhibits`, `Turnover_Signatures`, `Turnover_Attachments`

---

## 9. Minimum Viable Deployment (MVD)

### Features That Work Today (50 SP methods implemented)

| Feature | Module | Route | Status |
|---------|--------|-------|--------|
| Lead intake (create/edit/delete/search) | LeadFormPage, LeadDetailPage | `/lead/new`, `/lead/:id` | WORKS |
| Go/No-Go basic scoring (no workflow) | GoNoGoScorecard | `/lead/:id/gonogo` | WORKS (save/view only) |
| Estimating tracker (full CRUD) | EstimatingDashboard | `/preconstruction` | WORKS |
| Pipeline dashboard | PipelinePage | `/preconstruction/pipeline` | WORKS |
| Executive dashboard (KPIs, charts) | DashboardPage | `/` | WORKS |
| Admin Panel (roles, flags, audit, provisioning read) | AdminPanel | `/admin` | WORKS |
| Buyout log + commitment approvals | BuyoutLogPage | `/operations/buyout-log` | WORKS |
| Compliance log | ComplianceLog | `/operations/compliance-log` | WORKS |
| Active projects portfolio | ActiveProjectsDashboard | `/operations` | WORKS |
| Phase 6 workflow (team, deliverables, interview, contract, turnover items, closeout) | Various | `/preconstruction/pursuit/:id/*` | WORKS |
| Loss autopsy | LossAutopsy, PostBidAutopsyForm | `/preconstruction/pursuit/:id/autopsy*` | WORKS |

### Features That Will NOT Work Without Implementation

| Feature | Blocked By | Priority |
|---------|-----------|----------|
| ~~**App login/initialization**~~ | ~~`getCurrentUser()` not implemented~~ | **RESOLVED (Phase 31)** |
| Go/No-Go approval workflow (submit, review, decide) | 7 scorecard workflow stubs | P2 |
| Workflow definitions admin | 10 workflow definition stubs | P2 |
| Permission engine (template-based RBAC) | 15 permission engine stubs | P3 (fallback to role-based works) |
| Startup checklist | 4 stubs | P4 |
| Responsibility matrices | 14 stubs | P4 |
| Marketing project records | 4 stubs | P4 |
| Risk/cost management | 4 stubs | P4 |
| Quality/safety concerns | 6 stubs | P4 |
| Project schedule/critical path | 3 stubs | P4 |
| Superintendent plan | 3 stubs | P4 |
| Lessons learned | 3 stubs | P4 |
| PMP (7 methods) | 7 stubs | P4 |
| Monthly project review | 4 stubs | P4 |
| Estimating kickoff | 8 stubs | P4 |
| Job number requests | 4 stubs | P4 |
| Turnover agenda | 16 stubs | P4 |
| All provisioning (live site creation) | Mock-only steps | P4 |

---

## 10. Prioritized Remediation Roadmap

### Tier 1: Deployment Blocker (Before ANY deployment)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1.1 | ~~Implement `getCurrentUser()` in SharePointDataService~~ | ~~Small~~ | **DONE (Phase 31)** |
| 1.2 | Graph admin consent for 8 scopes (see §6 phased strategy) | Config | Group membership operations |
| 1.3 | Verify/create hub site SharePoint lists (32 lists) | Medium | Data storage |

### Tier 2: Core Feature Completion (MVP for Go/No-Go workflow)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 2.1 | Implement 7 scorecard workflow methods | Medium | Full Go/No-Go approval chain |
| 2.2 | Implement 10 workflow definition methods | Medium | Admin workflow configuration |
| 2.3 | Replace hardcoded provisioning URLs with config | Small | Correct site creation URLs |

### Tier 3: Permission Engine (Optional — fallback works)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 3.1 | Implement 15 permission engine methods | Large | Template-based RBAC |
| 3.2 | Configure `Security_Group_Mappings` SP list | Config | Azure AD group-to-template mapping |

### Tier 4: Project Operations (Per-feature rollout)

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 4.1 | Implement estimating kickoff (8 methods) | Medium | Kickoff workflow |
| 4.2 | Implement job number requests (4 methods) | Small | Job number assignment |
| 4.3 | Implement PMP (7 methods) | Medium | Project management plans |
| 4.4 | Implement turnover agenda (16 methods) | Large | Turnover meeting workflow |
| 4.5 | Implement startup checklist (4 methods) | Small | Project startup |
| 4.6 | Implement matrices (14 methods) | Medium | Responsibility tracking |
| 4.7 | Implement remaining modules (40+ methods) | Large | Full feature set |

### Tier 5: Production Hardening

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 5.1 | Implement real provisioning steps (PnP SP) | Large | Live site creation |
| 5.2 | Implement HubNavigationService for SP | Medium | Hub nav links |
| 5.3 | Configure Power Automate flows | Medium | Automated notifications/provisioning |
| 5.4 | Replace `sessionStorage` in OfflineQueueService with `localStorage` | Small | Offline persistence |
| 5.5 | Configure CDN/Azure Storage (or use bundled assets) | Config | Asset hosting |

---

## 11. Deployment Steps (MVD)

Assuming Tier 1 remediation is complete:

1. **Build the package:**
   ```bash
   volta run --node 22.14.0 gulp bundle --ship
   volta run --node 22.14.0 gulp package-solution --ship
   ```

2. **Upload to tenant app catalog:**
   - Navigate to SharePoint admin center → More features → Apps → App Catalog
   - Upload `sharepoint/solution/hbc-project-controls.sppkg`
   - Check "Make this solution available to all sites in the organization"
   - Deploy

3. **Approve Graph API permissions:**
   - SharePoint admin center → Advanced → API access
   - MVD: Approve `User.Read`, `Group.Read.All`, `Group.ReadWrite.All` (3 scopes)
   - Later: Approve calendar/email/Teams scopes as features are enabled (see §6)

4. **Create hub site lists:**
   - Verify/create all 32 hub site lists with schemas from `columnMappings.ts`
   - Populate `Feature_Flags` list with entries from `mock/featureFlags.json`
   - Populate `App_Roles` list with role definitions
   - Populate `App_Context_Config` list

5. **Add web part to a page:**
   - Navigate to the hub site
   - Edit a page → Add web part → "HBC Project Controls"
   - Publish

6. **Verify:**
   - App loads (getCurrentUser succeeds)
   - Dashboard renders with KPIs
   - Lead CRUD operations work
   - Estimating tracker displays data
   - Role-based navigation filtering works

---

## Appendix A: File Inventory

| Category | Count |
|----------|-------|
| TypeScript source files | ~130 |
| React components (pages) | ~55 |
| React components (shared) | 33 |
| Custom hooks | 38 |
| Service files | 14 |
| Model/interface files | 45 |
| Mock JSON files | 41 |
| Utility files | 13 |
| Routes | 49 |
| Feature flags | 23 |
| IDataService methods | 204 |
| SP lists (hub) | 32 |
| SP lists (per-project) | 37 |

## Appendix B: Package Dependencies

### Runtime Dependencies (18)

| Package | Version | Purpose |
|---------|---------|---------|
| @fluentui/react-components | ^9.46.0 | UI component library |
| @fluentui/react-icons | ^2.0.230 | Icon library |
| @microsoft/sp-core-library | 1.21.1 | SPFx core |
| @microsoft/sp-lodash-subset | 1.21.1 | SPFx lodash |
| @microsoft/sp-office-ui-fabric-core | 1.21.1 | SPFx Fabric CSS |
| @microsoft/sp-property-pane | 1.21.1 | Web part property pane |
| @microsoft/sp-webpart-base | 1.21.1 | Web part base class |
| @pnp/sp | ^4.4.1 | SharePoint data access |
| @pnp/graph | ^4.4.1 | Microsoft Graph access |
| html2canvas | ^1.4.1 | HTML-to-canvas for PDF |
| jspdf | ^2.5.2 | PDF generation |
| react | 17.0.1 | UI framework |
| react-dom | 17.0.1 | React DOM |
| react-router-dom | ^6.22.3 | Client-side routing |
| recharts | ^2.12.3 | Chart library |
| tslib | ^2.6.0 | TypeScript helpers |
| xlsx | ^0.18.5 | Excel export |

---

*Generated by SPFx Deployment Readiness Assessment — 2026-02-12*
