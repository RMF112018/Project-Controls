# HBC Project Controls -- Permission Strategy

> **Last updated:** 2026-02-08
> **Application:** HBC Project Controls SPFx Web Part (v1.21.1)
> **Tenant:** hedrickbrothers.sharepoint.com

---

## 1. Overview

HBC Project Controls uses a **dual-layer permission model** that combines application-level role-based access control (RBAC) with SharePoint site-level permissions:

1. **Application RBAC** -- An `App_Roles` SharePoint list on the hub site maps Azure AD users/groups to named roles. At runtime the SPFx web part resolves the current user's roles, computes a `Set<string>` of permission keys, and gates UI components via `RoleGate` and `FeatureGate` guard components. The `ROLE_PERMISSIONS` map in `permissions.ts` is the single source of truth for which role holds which permission key.

2. **SharePoint Site Permissions** -- Each provisioned project site receives three security groups (`{ProjectCode}_Owners`, `{ProjectCode}_Members`, `{ProjectCode}_Visitors`) via the PnP provisioning template. These groups enforce data access at the SharePoint platform level, meaning even direct REST API calls respect them.

3. **Feature Flags** -- The `Feature_Flags` list allows administrators to enable or disable entire feature modules (e.g., `ProjectManagementPlan`, `MonthlyProjectReview`) independently of role permissions. Feature flags are evaluated by the `FeatureGate` component and do not grant permissions -- they only control visibility.

### How the layers interact

```
User Request
    |
    v
[FeatureGate] -- Is the feature enabled?  --> No --> hidden
    |
    Yes
    v
[RoleGate]    -- Does user have the role? --> No --> hidden / fallback
    |
    Yes
    v
[Permission Check] -- Does role grant the permission key? --> No --> disabled / read-only
    |
    Yes
    v
[SharePoint REST API] -- Does SP group grant list/item access? --> No --> 403
    |
    Yes
    v
Data returned
```

---

## 2. Application Roles

All roles are defined in the `RoleName` enum (`models/enums.ts`) and stored in the `App_Roles` list on the hub site.

| Role | Enum Value | Description | Typical Users | Scope |
|------|-----------|-------------|---------------|-------|
| BD Representative | `BD Representative` | Business development staff who originate leads, schedule Go/No-Go meetings, and manage the pipeline | BD managers, regional BD leads | Hub + Project |
| Estimating Coordinator | `Estimating Coordinator` | Manages preconstruction estimates, proposals, kickoff templates, and post-bid autopsies | Chief Estimator, senior estimators | Hub + Project |
| Accounting Manager | `Accounting Manager` | Finalizes job numbers, views financial data, manages accounting queue | Controller, accounting staff | Hub |
| Preconstruction Team | `Preconstruction Team` | Edits preconstruction deliverables, proposals, and supports estimating | Precon managers, assistant estimators | Hub + Project |
| Operations Team | `Operations Team` | Manages active construction: startup checklists, responsibility matrices, PMP, buyout, monthly reviews, operational modules | Project Managers, Superintendents, Project Engineers | Project |
| Executive Leadership | `Executive Leadership` | Full administrative access; Go/No-Go decision authority; PMP approval; commitment approval and escalation; portfolio oversight | President, Division VPs, Project Executives | Hub + Project |
| Legal | `Legal` | Reviews and edits contracts; read-only access to pipeline and project data | General Counsel, contract administrators | Hub + Project |
| Risk Management | `Risk Management` | Manages risk items, compliance reviews, and commitment compliance approvals | Risk Manager, insurance coordinator | Hub + Project |
| Marketing | `Marketing` | Manages Marketing Project Records, proposal content, and hub marketing dashboard | Marketing Director, marketing coordinators | Hub + Project |
| Quality Control | `Quality Control` | Manages quality concern tracking on project sites | QC Manager, QC inspectors | Project |
| Safety | `Safety` | Read-only access to project data (safety module editing governed by Operations Team role) | Safety Director, safety officers | Project |
| IDS | `IDS` | Information & Data Services; manages app configuration and infrastructure | IT staff, SharePoint administrators | Hub |

### Role Resolution at Runtime

The `ICurrentUser` interface (`models/IRole.ts`) represents the authenticated user:

```typescript
interface ICurrentUser {
  id: number;
  displayName: string;
  email: string;            // lowercase
  loginName: string;
  roles: RoleName[];        // populated from App_Roles list
  permissions: Set<string>; // computed from ROLE_PERMISSIONS map
  photoUrl?: string;
}
```

A user may hold **multiple roles** (e.g., a Project Executive might have both `Executive Leadership` and `Operations Team`). Permissions are the union of all granted keys across all assigned roles.

---

## 3. Permission Keys

All permission keys are defined in `utils/permissions.ts`. The `ROLE_PERMISSIONS` map determines which roles hold each key.

### Lead Management

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `lead:create` | `LEAD_CREATE` | Create new leads in Leads_Master | BD Representative | Hub |
| `lead:read` | `LEAD_READ` | View lead records | BD Representative, Estimating Coordinator, Accounting Manager, Executive Leadership, Legal, Risk Management, Marketing | Hub |
| `lead:edit` | `LEAD_EDIT` | Edit existing lead records | BD Representative | Hub |
| `lead:delete` | `LEAD_DELETE` | Delete lead records | BD Representative | Hub |

### Go/No-Go

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `gonogo:score:originator` | `GONOGO_SCORE_ORIGINATOR` | Submit originator scoring on Go/No-Go scorecard | BD Representative, Estimating Coordinator | Hub |
| `gonogo:score:committee` | `GONOGO_SCORE_COMMITTEE` | Submit committee scoring on Go/No-Go scorecard | Executive Leadership | Hub |
| `gonogo:submit` | `GONOGO_SUBMIT` | Submit a completed scorecard for review | BD Representative | Hub |
| `gonogo:decide` | `GONOGO_DECIDE` | Make the final GO / NO GO / WAIT decision | Executive Leadership | Hub |
| `gonogo:read` | `GONOGO_READ` | View scorecards and decisions | BD Representative, Estimating Coordinator, Accounting Manager, Executive Leadership, Legal, Risk Management, Marketing | Hub |

### Preconstruction

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `precon:read` | `PRECON_READ` | View preconstruction data | BD Representative, Estimating Coordinator, Preconstruction Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS | Hub + Project |
| `precon:edit` | `PRECON_EDIT` | Edit preconstruction records | Estimating Coordinator, Preconstruction Team | Hub + Project |

### Proposals

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `proposal:read` | `PROPOSAL_READ` | View proposals | BD Representative, Estimating Coordinator, Preconstruction Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS | Hub + Project |
| `proposal:edit` | `PROPOSAL_EDIT` | Edit proposals | Estimating Coordinator, Preconstruction Team, Marketing | Hub + Project |

### Win/Loss

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `winloss:record` | `WINLOSS_RECORD` | Record a win or loss decision | BD Representative | Hub |
| `winloss:read` | `WINLOSS_READ` | View win/loss records | BD Representative, Estimating Coordinator, Preconstruction Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS, Accounting Manager | Hub |

### Contracts

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `contract:read` | `CONTRACT_READ` | View contract records | BD Representative, Estimating Coordinator, Accounting Manager, Preconstruction Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS, Operations Team (implicit via project) | Both |
| `contract:edit` | `CONTRACT_EDIT` | Edit contract records | Legal | Project |
| `contract:view:financials` | `CONTRACT_VIEW_FINANCIALS` | View sensitive financial fields on contracts | Accounting Manager, Executive Leadership | Both |

### Turnover & Closeout

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `turnover:read` | `TURNOVER_READ` | View turnover checklist items | BD Representative, Estimating Coordinator, Accounting Manager, Preconstruction Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS, Operations Team | Project |
| `turnover:edit` | `TURNOVER_EDIT` | Edit turnover checklist items | Operations Team | Project |
| `closeout:read` | `CLOSEOUT_READ` | View closeout items | BD Representative, Estimating Coordinator, Accounting Manager, Preconstruction Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS, Operations Team | Project |
| `closeout:edit` | `CLOSEOUT_EDIT` | Edit closeout items | Operations Team | Project |

### Estimating

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `estimating:read` | `ESTIMATING_READ` | View estimating tracker records | BD Representative, Estimating Coordinator, Accounting Manager, Preconstruction Team, Executive Leadership | Hub |
| `estimating:edit` | `ESTIMATING_EDIT` | Create/edit estimating tracker records | Estimating Coordinator | Hub |

### Module Access

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `precon:hub:view` | `PRECON_HUB_VIEW` | Access preconstruction hub navigation | Estimating Coordinator, Executive Leadership | Hub |
| `project:hub:view` | `PROJECT_HUB_VIEW` | Access project hub navigation | Estimating Coordinator, Operations Team, Executive Leadership | Hub |

### Administration

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `admin:roles` | `ADMIN_ROLES` | Manage role assignments in Admin Panel | Executive Leadership | Hub |
| `admin:flags` | `ADMIN_FLAGS` | Toggle feature flags in Admin Panel | Executive Leadership | Hub |
| `admin:config` | `ADMIN_CONFIG` | Manage app configuration | Executive Leadership, IDS | Hub |
| `admin:connections` | `ADMIN_CONNECTIONS` | Manage data connections in Admin Panel | Executive Leadership | Hub |
| `admin:provisioning` | `ADMIN_PROVISIONING` | View/manage provisioning logs in Admin Panel | Executive Leadership | Hub |

### Marketing

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `marketing:edit` | `MARKETING_EDIT` | Edit marketing-specific content | Marketing | Hub + Project |
| `marketing:dashboard:view` | `MARKETING_DASHBOARD_VIEW` | View the Marketing Dashboard on the hub | Executive Leadership, Marketing | Hub |

### Site Provisioning

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `site:provision` | `SITE_PROVISION` | Trigger project site provisioning after GO decision | BD Representative | Hub |

### Meetings

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `meeting:schedule` | `MEETING_SCHEDULE` | Schedule meetings via Graph API | BD Representative, Executive Leadership | Hub + Project |
| `meeting:read` | `MEETING_READ` | View scheduled meetings | BD Representative, Estimating Coordinator, Accounting Manager, Preconstruction Team, Operations Team, Executive Leadership, Legal, Risk Management, Marketing, Quality Control, Safety, IDS | Both |

### Project Startup

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `startup:checklist:edit` | `STARTUP_CHECKLIST_EDIT` | Edit project startup checklist items | Operations Team | Project |
| `startup:checklist:signoff` | `STARTUP_CHECKLIST_SIGNOFF` | Sign off on completed startup checklist | Executive Leadership | Project |
| `matrix:edit` | `MATRIX_EDIT` | Edit responsibility matrices (Internal, Owner Contract, Sub-Contract) | Operations Team | Project |
| `projectrecord:edit` | `PROJECT_RECORD_EDIT` | Edit all sections of Marketing Project Record | Marketing | Project |
| `projectrecord:ops:edit` | `PROJECT_RECORD_OPS_EDIT` | Edit sections 3-7 of Marketing Project Record (operations data) | Operations Team | Project |

### Project Management Plan (PMP)

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `pmp:edit` | `PMP_EDIT` | Edit PMP content sections | Operations Team | Project |
| `pmp:approve` | `PMP_APPROVE` | Approve PMP at division level (Step 1: Project Executive) | Executive Leadership | Project |
| `pmp:final:approve` | `PMP_FINAL_APPROVE` | Final PMP approval (Step 2: Division Head) | Executive Leadership | Project |
| `pmp:sign` | `PMP_SIGN` | Sign PMP startup/completion signature blocks | Operations Team, Executive Leadership | Project |

### Operational Modules

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `risk:edit` | `RISK_EDIT` | Edit Risk & Cost Management items | Operations Team, Risk Management | Project |
| `quality:edit` | `QUALITY_EDIT` | Edit Quality Concerns tracker | Operations Team, Quality Control | Project |
| `safety:edit` | `SAFETY_EDIT` | Edit Safety Concerns tracker | Operations Team | Project |
| `schedule:edit` | `SCHEDULE_EDIT` | Edit Project Schedule & Critical Path | Operations Team | Project |
| `superintendent:plan:edit` | `SUPERINTENDENT_PLAN_EDIT` | Edit Superintendent's Plan | Operations Team | Project |
| `lessons:edit` | `LESSONS_EDIT` | Add/edit Lessons Learned entries | Operations Team | Project |

### Monthly Review

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `monthly:review:pm` | `MONTHLY_REVIEW_PM` | Complete PM sections of monthly review (checklist, comments) | Operations Team | Project |
| `monthly:review:px` | `MONTHLY_REVIEW_PX` | Complete PX sections, advance review workflow | Executive Leadership | Project |
| `monthly:review:create` | `MONTHLY_REVIEW_CREATE` | Create a new monthly review period | Executive Leadership | Project |

### Job Number Requests

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `job_number_request:create` | `JOB_NUMBER_REQUEST_CREATE` | Submit a new job number request | Estimating Coordinator | Hub |
| `job_number_request:finalize` | `JOB_NUMBER_REQUEST_FINALIZE` | Assign a job number to a request | Accounting Manager | Hub |
| `accounting_queue:view` | `ACCOUNTING_QUEUE_VIEW` | View the accounting job number queue | Accounting Manager | Hub |

### Estimating Kick-Off

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `kickoff:view` | `KICKOFF_VIEW` | View estimating kick-off records | BD Representative, Estimating Coordinator, Executive Leadership, Preconstruction Team | Hub |
| `kickoff:edit` | `KICKOFF_EDIT` | Edit estimating kick-off checklists | Estimating Coordinator, Executive Leadership | Hub |
| `kickoff:template:edit` | `KICKOFF_TEMPLATE_EDIT` | Edit kick-off templates | Estimating Coordinator, Executive Leadership | Hub |

### Post-Bid Autopsy

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `autopsy:view` | `AUTOPSY_VIEW` | View post-bid autopsy records | BD Representative, Estimating Coordinator, Executive Leadership, Preconstruction Team | Hub |
| `autopsy:edit` | `AUTOPSY_EDIT` | Edit autopsy records | Estimating Coordinator, Executive Leadership | Hub |
| `autopsy:schedule` | `AUTOPSY_SCHEDULE` | Schedule an autopsy meeting | Estimating Coordinator, Executive Leadership | Hub |

### Buyout Log

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `buyout:view` | `BUYOUT_VIEW` | View buyout log entries | Preconstruction Team, Operations Team, Executive Leadership | Project |
| `buyout:edit` | `BUYOUT_EDIT` | Edit buyout entries | Operations Team, Executive Leadership | Project |
| `buyout:manage` | `BUYOUT_MANAGE` | Initialize buyout log, add/remove entries | Operations Team | Project |

### Commitment Approval

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `commitment:submit` | `COMMITMENT_SUBMIT` | Submit a commitment for approval | Operations Team | Project |
| `commitment:approve:px` | `COMMITMENT_APPROVE_PX` | Approve at Project Executive level | Executive Leadership | Project |
| `commitment:approve:compliance` | `COMMITMENT_APPROVE_COMPLIANCE` | Approve at compliance/risk level | Risk Management | Project |
| `commitment:approve:cfo` | `COMMITMENT_APPROVE_CFO` | Approve at CFO level (high-value commitments) | Executive Leadership | Project |
| `commitment:escalate` | `COMMITMENT_ESCALATE` | Escalate a commitment to CFO | Executive Leadership, Risk Management | Project |

### Active Projects Portfolio

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `active_projects:view` | `ACTIVE_PROJECTS_VIEW` | View Active Projects Portfolio dashboard | Operations Team, Executive Leadership | Hub |
| `active_projects:sync` | `ACTIVE_PROJECTS_SYNC` | Trigger portfolio sync from external sources | Executive Leadership | Hub |

### Compliance Log

| Permission Key | Constant | Description | Granted To | Scope |
|---------------|----------|-------------|------------|-------|
| `compliance_log:view` | `COMPLIANCE_LOG_VIEW` | View E-Verify Compliance Log dashboard | Operations Team, Executive Leadership, Risk Management | Hub |

---

## 4. SharePoint Site Permissions

### Hub Site (`HBCHub`)

The hub site hosts all cross-project data (Leads_Master, GoNoGo_Scorecards, Estimating_Tracker, App_Roles, Feature_Flags, Audit_Log, etc.).

| SharePoint Group | Permission Level | Members | Purpose |
|-----------------|-----------------|---------|---------|
| HBCHub Owners | Full Control | IDS, Executive Leadership | Full site administration |
| HBCHub Members | Contribute | All HBC employees with app access | Create/edit list items via the app |
| HBCHub Visitors | Read | Read-only stakeholders, external consultants | View dashboards and reports only |

### Project Sites (from `site-template.json`)

Each project site is provisioned with three security groups populated based on the user's application role. The PnP template defines these groups in the `securityGroups` array:

| SharePoint Group | Permission Level | Member Roles (from template) | Typical Users |
|-----------------|-----------------|------------------------------|---------------|
| `{ProjectCode}_Owners` | Full Control | Executive Leadership, BD Representative | Project Executive, Division Director, originating BD Rep |
| `{ProjectCode}_Members` | Contribute | Preconstruction Team, Operations Team, Estimating Coordinator | Project Manager, Superintendent, Estimating Coordinator, Project Engineer |
| `{ProjectCode}_Visitors` | Read | Marketing, Legal, Accounting Manager, Risk Management, Quality Control, Safety | Marketing coordinators, legal counsel, accounting staff, safety officers |

### Hub Association

All project sites are automatically associated with the hub site via:
```
hubSiteAssociation: "https://hedrickbrothers.sharepoint.com/sites/HBCHub"
```

This enables:
- Hub-level search across all project sites
- Shared navigation and branding
- Cross-site content roll-up for Executive Dashboard

---

## 5. List-Level Permissions

The following lists contain sensitive data and require permission configurations beyond the default site-level inheritance.

### Hub Site Lists

| List | Owners (Full Control) | Members (Contribute) | Visitors (Read) | Notes |
|------|----------------------|---------------------|-----------------|-------|
| `App_Roles` | IDS, Executive Leadership | -- | All | Broken inheritance; only admins can modify role assignments |
| `Feature_Flags` | Executive Leadership | -- | All | Broken inheritance; only admins can toggle flags |
| `Audit_Log` | IDS | -- | Executive Leadership | Append-only; fire-and-forget writes via service account |
| `Leads_Master` | BD Representative (via hub Members) | All hub Members | Hub Visitors | Standard inheritance |
| `GoNoGo_Scorecards` | Executive Leadership | BD Representative, Estimating Coordinator | All | Standard inheritance |
| `Estimating_Tracker` | Estimating Coordinator | Preconstruction Team | All | Standard inheritance |
| `Active_Projects` | Executive Leadership | Operations Team | All | Standard inheritance |
| `Compliance_Log` | Executive Leadership, Risk Management | Operations Team | -- | Broken inheritance; restricted visibility |

### Project Site Lists

| List | _Owners (Full Control) | _Members (Contribute) | _Visitors (Read) | Notes |
|------|----------------------|---------------------|-----------------|-------|
| `Buyout_Log` | _Owners | Operations Team, Preconstruction Team | All _Visitors | Contains subcontractor pricing |
| `Commitment_Approvals` | _Owners | Operations Team (submit), Executive Leadership (approve) | Risk Management | Multi-step approval; item-level permissions recommended |
| `Risk_Cost_Management` | _Owners | Operations Team, Risk Management | All _Visitors | Financial exposure data |
| `Risk_Cost_Items` | _Owners | Operations Team, Risk Management | All _Visitors | Inherits from parent |
| `Safety_Concerns` | _Owners | Operations Team | Safety, Quality Control | Contains incident data; restricted visibility |
| `Project_Management_Plans` | _Owners | Operations Team | All _Visitors | PMP content and status |
| `PMP_Signatures` | _Owners | Operations Team, Executive Leadership | All _Visitors | Digital signature records |
| `PMP_Approval_Cycles` | _Owners | Operations Team (submit), Executive Leadership (approve) | All _Visitors | Approval workflow state |
| `PMP_Approval_Steps` | _Owners | Executive Leadership | All _Visitors | Individual approval decisions |
| `Monthly_Reviews` | _Owners | Operations Team, Executive Leadership | All _Visitors | PM/PX review workflow |
| `Contract_Info` | _Owners | Legal | All _Visitors | Contract amounts and terms |
| `Startup_Checklist` | _Owners | Operations Team | All _Visitors | Startup completion tracking |

---

## 6. Turnover Permission Flip

When a project transitions from **Preconstruction** (stages: `Opportunity`, `Pursuit`, `Won-ContractPending`) to **Active Construction** (stage: `Active-Construction`), security group memberships must be updated to reflect the operational team taking ownership.

### Membership Changes

| Action | Group | User/Role | Rationale |
|--------|-------|-----------|-----------|
| **Remove** | `{ProjectCode}_Members` | Estimating Coordinator | No longer actively contributing; becomes read-only observer |
| **Add** | `{ProjectCode}_Visitors` | Estimating Coordinator | Retains read access for reference and post-bid autopsy |
| **Add** | `{ProjectCode}_Members` | Superintendent (by name) | Now actively managing field operations |
| **Verify** | `{ProjectCode}_Members` | Operations Team | Should already be present; confirm PM and PE are assigned |

### Field-Level Permission Updates

When a project enters Active Construction, the following cost-sensitive columns on project lists should have their permissions tightened:

| Field | List | Pre-Turnover Access | Post-Turnover Access | Method |
|-------|------|---------------------|---------------------|--------|
| `ContractAmount` | `Contract_Info` | _Members (Contribute) | _Owners + Legal only | Column-level formatting + app RBAC |
| `OriginalBudget` | `Buyout_Log` | _Members (Contribute) | Operations Team + Executive Leadership | App RBAC via `contract:view:financials` |
| `ContractValue` | `Buyout_Log` | _Members (Contribute) | Operations Team + Executive Leadership | App RBAC via `contract:view:financials` |
| `EstimatedValue` | `Risk_Cost_Items` | _Members (Contribute) | Operations Team + Risk Management | App RBAC via `risk:edit` |

### Turnover Trigger

The turnover is initiated via the `TurnoverCompleted` audit action. The `ProvisioningService` should execute these group changes as part of the turnover workflow. The app logs `AuditAction.TurnoverCompleted` and `AuditAction.PermissionChanged` entries to maintain a full audit trail.

### Automation Approach

```
Turnover Complete
    |
    v
[App fires AuditAction.TurnoverCompleted]
    |
    v
[ProvisioningService.updateSecurityGroups()]
    |-- Remove Estimating Coordinator from _Members
    |-- Add Estimating Coordinator to _Visitors
    |-- Add Superintendent to _Members
    |-- Fire AuditAction.PermissionChanged for each change
    |
    v
[Lead stage updated to Active-Construction]
```

---

## 7. PMP Approval Chain

The Project Management Plan follows a structured workflow with digital signatures and a division-aware approval chain.

### Status Lifecycle

```
Draft --> PendingSignatures --> PendingApproval --> Approved
                                      |                |
                                      v                v
                                  Returned          Closed
                                      |
                                      v
                                   Draft (revision cycle)
```

### Step-by-Step Workflow

#### 1. Drafting (Status: `Draft`)
- **Who:** Project Manager (Operations Team with `pmp:edit`)
- **What:** PM edits PMP-only fields (superintendent plan notes, precon meeting notes, site management notes, attachments) and reviews module-sourced data (risk/cost, quality, safety, schedule, superintendent plan)
- The PMP consolidates data from 16 sections defined in `PMP_SECTIONS`, pulling from standalone operational modules

#### 2. Signature Collection (Status: `PendingSignatures`)
- **Who:** PM initiates; all required signers execute
- **Signature Types:**
  - **Startup Signatures** -- Collected before project begins (PM, Superintendent, Project Executive)
  - **Completion Signatures** -- Collected at project closeout
- **Permission:** `pmp:sign` (Operations Team + Executive Leadership)
- **Signature Statuses:** `Pending` --> `Signed` or `Declined`
- Each signature record includes: role, person name/email, affidavit text, signed date, comment

#### 3. Submission for Approval (Status: `PendingApproval`)
- **Who:** PM submits via `submitPMPForApproval()` service method
- **What:** Creates a new `IPMPApprovalCycle` with incrementing `cycleNumber` and auto-generates approval steps based on division

#### 4. Approval Steps

The approval chain is **division-aware** with the following structure:

**Commercial Division:**

| Step | Approver Role | Approver | Permission Required |
|------|--------------|----------|-------------------|
| 1 | Project Executive | Kim Foster | `pmp:approve` |
| 2 | Division Head - Commercial | Arthur Miller | `pmp:final:approve` |

**Luxury Residential Division:**

| Step | Approver Role | Approver | Permission Required |
|------|--------------|----------|-------------------|
| 1 | Project Executive | Kim Foster | `pmp:approve` |
| 2 | Division Head - Luxury Residential | Joe Morrin | `pmp:final:approve` |

Division approvers are maintained in the `Division_Approvers` reference list and loaded via `getDivisionApprovers()`.

#### 5. Approval Response
- **Action:** Each approver calls `respondToPMPApproval(projectCode, stepId, approved, comment)`
- **If approved:** Step status set to `Approved`; if all steps approved, cycle status set to `Approved` and PMP status set to `Approved`
- **If returned:** Step status set to `Returned`; cycle status set to `Returned`; PMP status reverts to `Returned` (then `Draft` for revision)

#### 6. Revision Cycles
- When returned, the PM revises and resubmits, incrementing `currentCycleNumber`
- Each cycle maintains its own `changesFromPrevious` array documenting what was modified
- Full approval history is preserved across all cycles

### Audit Trail for PMP

| Action | AuditAction Enum | Logged When |
|--------|-----------------|-------------|
| PMP submitted for approval | `PMP.Submitted` | PM calls `submitPMPForApproval()` |
| PMP step approved | `PMP.Approved` | Approver approves a step |
| PMP step returned | `PMP.Returned` | Approver returns for revision |
| PMP signature collected | `PMP.Signed` | Signer completes a signature block |

### Notification Events for PMP

| Event | NotificationEvent Enum | Recipients |
|-------|----------------------|------------|
| Signature requested | `PMPSignatureRequested` | Named signer |
| Submitted for approval | `PMPSubmittedForApproval` | Next approver in chain |
| Approval required | `PMPApprovalRequired` | Current step approver |
| Fully approved | `PMPApproved` | PM, all signers |
| Returned for revision | `PMPReturnedForRevision` | PM |

---

## 8. Data Sensitivity Classification

### High Sensitivity

| Field / Data | Entity / List | Access Restriction | Rationale |
|-------------|---------------|-------------------|-----------|
| Safety incident descriptions | `Safety_Concerns` | Safety Director + Executive Leadership + Operations Team | Legal liability; OSHA reporting requirements |
| Incident severity & status | `Safety_Concerns` | Safety Director + Executive Leadership | Potential regulatory exposure |
| Personal contact info (email, phone) | `Team_Members`, `PMP_Signatures` | Project team leads + Executive Leadership | PII protection |
| PMP signature affidavit text | `PMP_Signatures` | Named signer + Executive Leadership | Legal document with personal attestation |
| Compliance log entries | `Compliance_Log` | Operations Team + Executive Leadership + Risk Management | E-Verify regulatory compliance data |
| Audit log entries | `Audit_Log` | IDS + Executive Leadership | System integrity; tamper evidence |

### Medium Sensitivity

| Field / Data | Entity / List | Access Restriction | Rationale |
|-------------|---------------|-------------------|-----------|
| Contract amounts | `Contract_Info`, `Risk_Cost_Management` | Project team + Executive Leadership + Accounting Manager | Financial exposure; competitive intelligence |
| Original budget vs. contract value | `Buyout_Log` | Operations Team + Executive Leadership + Accounting Manager | Margin analysis; proprietary pricing |
| Subcontractor pricing / proposals | `30_Subcontracts` library | _Members + _Owners | Competitive bid information |
| Cost report data | `05_Budget` library | _Members + _Owners | Financial performance data |
| Commitment approval amounts | `Commitment_Approvals` | Operations Team + Executive Leadership + Risk Management | Approval chain integrity |
| Go/No-Go scores | `GoNoGo_Scorecards` | BD Representative + Estimating Coordinator + Executive Leadership | Strategic pursuit decisions |
| Risk/cost item estimated values | `Risk_Cost_Items` | Operations Team + Risk Management + Executive Leadership | Financial risk quantification |
| Liquidated damages flag | `Project_Schedule` | Operations Team + Executive Leadership + Legal | Contractual penalty exposure |
| Personnel workload data | Active Projects Portfolio | Executive Leadership | Staffing and capacity planning |

### Low Sensitivity

| Field / Data | Entity / List | Access Restriction | Rationale |
|-------------|---------------|-------------------|-----------|
| Project name, code, region | `Project_Info`, `Leads_Master` | All authenticated users | General project identification |
| Quality concern descriptions | `Quality_Concerns` | Project team + Quality Control | Operational quality tracking |
| Lessons learned | `Lessons_Learned` | Project team (all roles) | Knowledge sharing |
| Meeting schedules | Calendar / Meetings | All project participants | Coordination |
| Marketing project record | `Marketing_Project_Record` | Marketing + Operations Team | Public-facing content |
| Superintendent plan sections | `Superintendent_Plan_Sections` | Operations Team + Executive Leadership | Operational planning |
| Startup checklist items | `Startup_Checklist` | Operations Team + Executive Leadership | Project readiness tracking |
| Feature flag settings | `Feature_Flags` | All (read) / Executive Leadership (write) | App configuration |

---

## 9. REST API Bypass Risk Analysis

### The Risk

SharePoint REST API endpoints (e.g., `/_api/web/lists/getbytitle('Buyout_Log')/items`) are accessible to any authenticated user who knows the list URL. The application's RBAC layer (`RoleGate`, permission keys) runs entirely in the browser -- a knowledgeable user could bypass the React UI and call REST endpoints directly via PowerShell, Postman, or browser dev tools.

### Current Mitigations

| Layer | Mitigation | Coverage |
|-------|-----------|----------|
| **SP Group Permissions** | `{ProjectCode}_Visitors` have Read-only; cannot create/edit via REST even if they bypass the app | Write operations on project lists |
| **SP Group Membership** | Users not in any project group cannot access the project site at all | Unauthorized project access |
| **Hub Site Permissions** | Hub Members can edit hub lists; this is acceptable because hub lists (Leads_Master, etc.) are broad-access by design | Hub list modifications |
| **List-Level Broken Inheritance** | `App_Roles`, `Feature_Flags`, `Audit_Log` break inheritance to restrict writes | Admin configuration tampering |
| **Column Validation** | SharePoint column validation rules prevent invalid data via any access method | Data integrity |

### Residual Risks

| Risk | Severity | Scenario |
|------|----------|----------|
| Hub Member edits Leads_Master directly | Medium | A hub Member role user modifies lead data outside the app, bypassing audit logging |
| Project Member reads cost data via REST | Low | A _Members user queries `Buyout_Log` cost columns that the app would hide based on role |
| Hub Member reads audit log | Low | If `Audit_Log` inherits from hub site, any member could read audit entries |

### Recommendations

1. **Item-Level Permissions for Highly Sensitive Data**
   - Apply item-level permissions on `Safety_Concerns` items to restrict access to Safety Director and Executive Leadership only
   - Apply item-level permissions on `Commitment_Approvals` items so only the current step approver and submitter can view

2. **Azure AD Conditional Access Policies**
   - Require compliant devices for SharePoint access
   - Block external network access to project sites
   - Require multi-factor authentication for admin operations

3. **SharePoint Data Loss Prevention (DLP)**
   - Apply DLP policies to document libraries containing contracts and financial documents
   - Alert on bulk downloads from `05_Budget` and `30_Subcontracts` libraries

4. **Microsoft 365 Audit Logging**
   - Enable Microsoft 365 unified audit logging for all SharePoint list and library operations
   - Set up alerts for direct REST API access patterns that bypass the app (user-agent analysis)
   - Cross-reference M365 audit logs with app-level `Audit_Log` entries to detect discrepancies

5. **API Permission Scoping**
   - When migrating to Azure AD app-only access, use application permissions scoped to specific sites via `Sites.Selected` rather than `Sites.ReadWrite.All`
   - Consider implementing a middle-tier API (Azure Function) that enforces RBAC server-side before calling SharePoint

6. **Sensitivity Labels**
   - Apply Microsoft Information Protection sensitivity labels to document libraries containing financial data
   - Use "Confidential" label for `05_Budget`, `30_Subcontracts`, and contract documents

---

## 10. Audit Trail

### Audit Entry Structure

All permission-related and significant data actions are logged to the `Audit_Log` list via the `logAudit()` service method. Entries follow the `IAuditEntry` interface:

```typescript
interface IAuditEntry {
  id: number;
  Timestamp: string;       // ISO 8601
  User: string;            // Display name of acting user
  UserId?: number;         // SP user ID
  Action: AuditAction;     // Enum value (e.g., "Permission.Changed")
  EntityType: EntityType;  // Enum value (e.g., "Permission", "PMP")
  EntityId: string;        // Identifier of affected entity
  ProjectCode?: string;    // Project context (if applicable)
  FieldChanged?: string;   // Specific field that changed
  PreviousValue?: string;  // Value before change
  NewValue?: string;       // Value after change
  Details: string;         // Human-readable description
}
```

**Note:** `IAuditEntry` uses **PascalCase** property names (Action, EntityType, EntityId, User, Details) -- not camelCase.

### Audited Permission Actions

| Category | AuditAction | EntityType | When Logged | Details Captured |
|----------|------------|------------|-------------|-----------------|
| **Role Changes** | `Config.RoleChanged` | `Config` | Admin modifies role assignments in Admin Panel | Previous/new user list, role name |
| **Feature Flag Toggles** | `Config.FeatureFlagChanged` | `Config` | Admin enables/disables a feature flag | Flag name, previous/new enabled state |
| **Permission Changes** | `Permission.Changed` | `Permission` | Security group membership modified during turnover | User added/removed, group name, project code |
| **PMP Submission** | `PMP.Submitted` | `PMP` | PM submits PMP for approval | Cycle number, submitted by, project code |
| **PMP Approval** | `PMP.Approved` | `PMP` | Approver approves a PMP step | Step order, approver name, cycle number |
| **PMP Return** | `PMP.Returned` | `PMP` | Approver returns PMP for revision | Step order, approver name, return comment |
| **PMP Signature** | `PMP.Signed` | `PMP` | Signer completes a signature block | Signature type (Startup/Completion), signer name |
| **Lead Creation** | `Lead.Created` | `Lead` | New lead created | Lead title, originator |
| **Lead Edit** | `Lead.Edited` | `Lead` | Lead record modified | Changed fields, previous/new values |
| **Go/No-Go Score** | `GoNoGo.ScoreSubmitted` | `Scorecard` | Originator or committee submits scores | Scorer name, score type |
| **Go/No-Go Decision** | `GoNoGo.DecisionMade` | `Scorecard` | Executive makes GO/NO GO/WAIT decision | Decision value, decider name |
| **Site Provisioning** | `Site.ProvisioningTriggered` | `Project` | BD Rep triggers project site creation | Project code, requested by |
| **Site Provisioned** | `Site.ProvisioningCompleted` | `Project` | Provisioning engine completes all steps | Site URL, completion status |
| **Turnover Initiated** | `Turnover.Initiated` | `Project` | Turnover workflow begins | Project code, initiator |
| **Turnover Completed** | `Turnover.Completed` | `Project` | All turnover items completed | Project code, completion date |
| **Checklist Updates** | `Checklist.ItemUpdated` | `Checklist` | Startup checklist item response changed | Item ID, previous/new response |
| **Checklist Sign-Off** | `Checklist.SignedOff` | `Checklist` | Executive signs off on completed checklist | Signer name, project code |
| **Matrix Changes** | `Matrix.AssignmentChanged` | `Matrix` | Responsibility matrix assignment modified | Task, previous/new assignment |
| **Monthly Review** | `MonthlyReview.Submitted` | `MonthlyReview` | PM submits monthly review to PX | Review month, project code |
| **Monthly Review Advanced** | `MonthlyReview.Advanced` | `MonthlyReview` | PX advances review to leadership | Review month, project code |
| **Commitment Submitted** | via notification | `Project` | Commitment submitted for approval | Entry ID, project code, amount |
| **Commitment Approved** | via notification | `Project` | Commitment approval step completed | Approver, step, project code |

### Audit Log Administration

- **Viewing:** Executive Leadership and IDS can view the audit log via the Admin Panel (Audit Log tab)
- **Filtering:** Audit log supports filtering by `entityType`, `entityId`, `startDate`, and `endDate`
- **Retention:** The `purgeOldAuditEntries(olderThanDays)` method allows IDS to archive entries beyond the retention window
- **Write pattern:** All audit writes use fire-and-forget (`logAudit()` returns `Promise<void>`) to avoid blocking user interactions
- **Immutability:** The `Audit_Log` list should be configured with broken inheritance granting only Append permission to the service account, with no Edit or Delete permissions for any user

### Guard Component Reference

The application uses two guard components to enforce permissions in the React UI:

**RoleGate** (`components/guards/RoleGate.tsx`):
```typescript
// Renders children only if the current user holds at least one of the allowed roles
<RoleGate allowedRoles={[RoleName.ExecutiveLeadership, RoleName.OperationsTeam]}>
  <SensitiveComponent />
</RoleGate>
```

**FeatureGate** (`components/guards/FeatureGate.tsx`):
```typescript
// Renders children only if the named feature flag is enabled
<FeatureGate featureName="ProjectManagementPlan">
  <PMPDashboard />
</FeatureGate>
```

Both guards accept an optional `fallback` prop (defaults to `null`) rendered when access is denied.

---

## Stage 17 Job Number Request & Accounting Handoff Addendum

This addendum captures Stage 17 permission intent for the Estimator -> Accounting workflow.

### A. Dual-role hardening intent

- Stage 17 hardens role behavior for Estimator and Accounting Manager paths to ensure expected create/finalize workflow access.
- Dev-role validation must match production permission intent, but production authority remains identity mapping plus SharePoint boundaries.

### B. Entra mapping ownership

- Identity administrators are responsible for keeping Entra principal mappings aligned to application roles used by this workflow.
- Role mapping updates should be validated immediately with a role-based smoke check before release sign-off.

### C. Workflow permission keys

The Stage 17 workflow depends on these permission keys:

| Permission Key | Constant | Primary Workflow Use |
|---|---|---|
| `job_number_request:create` | `JOB_NUMBER_REQUEST_CREATE` | Estimator creates request |
| `job_number_request:finalize` | `JOB_NUMBER_REQUEST_FINALIZE` | Accounting Manager finalizes request/job number |
| `accounting_queue:view` | `ACCOUNTING_QUEUE_VIEW` | Accounting Manager accesses setup queue |

### D. Cross-reference runbook

For full operational procedures, environment notes, and verification:  
`docs/stage-17-project-number-request-workflow.md`

---

## Appendix A: Permission Matrix Summary (Role x Key)

Legend: **C** = Create, **R** = Read, **E** = Edit, **D** = Delete, **A** = Approve, **S** = Sign, **X** = Execute

| Permission Area | BD Rep | Est. Coord. | Acct. Mgr | Precon Team | Ops Team | Exec. Leadership | Legal | Risk Mgmt | Marketing | QC | Safety | IDS |
|----------------|--------|------------|-----------|-------------|----------|-----------------|-------|-----------|-----------|-----|--------|-----|
| Leads | CRED | R | R | -- | -- | R | R | R | R | -- | -- | -- |
| Go/No-Go | R,Score,Submit | R,Score | R | -- | -- | R,Score,Decide | R | R | R | -- | -- | -- |
| Preconstruction | R | RE | -- | RE | -- | R | R | R | R | R | R | R |
| Proposals | R | RE | -- | RE | -- | R | R | R | RE | R | R | R |
| Win/Loss | RX | R | R | R | -- | R | R | R | R | R | R | R |
| Contracts | R | R | R,Fin | R | -- | R,Fin | RE | R | R | R | R | R |
| Turnover | R | R | R | R | RE | R | R | R | R | R | R | -- |
| Closeout | R | R | R | R | RE | R | R | R | R | R | R | -- |
| Estimating | R | RE | R | R | -- | R | -- | -- | -- | -- | -- | -- |
| Startup | -- | -- | -- | -- | E | S | -- | -- | -- | -- | -- | -- |
| Matrices | -- | -- | -- | -- | E | -- | -- | -- | -- | -- | -- | -- |
| Project Record | -- | -- | -- | -- | E(3-7) | -- | -- | -- | E(all) | -- | -- | -- |
| PMP | -- | -- | -- | -- | E,S | A,S | -- | -- | -- | -- | -- | -- |
| Risk/Cost | -- | -- | -- | -- | E | -- | -- | E | -- | -- | -- | -- |
| Quality | -- | -- | -- | -- | E | -- | -- | -- | -- | E | -- | -- |
| Safety Concerns | -- | -- | -- | -- | E | -- | -- | -- | -- | -- | -- | -- |
| Schedule | -- | -- | -- | -- | E | -- | -- | -- | -- | -- | -- | -- |
| Super. Plan | -- | -- | -- | -- | E | -- | -- | -- | -- | -- | -- | -- |
| Lessons | -- | -- | -- | -- | E | -- | -- | -- | -- | -- | -- | -- |
| Monthly Review | -- | -- | -- | -- | PM | PX,Create | -- | -- | -- | -- | -- | -- |
| Buyout | -- | -- | -- | View | E,Manage | E,View | -- | -- | -- | -- | -- | -- |
| Commitments | -- | -- | -- | -- | Submit | PX,CFO,Esc | -- | Compl,Esc | -- | -- | -- | -- |
| Job Numbers | -- | Create | Finalize,Queue | -- | -- | -- | -- | -- | -- | -- | -- | -- |
| Kickoff | View | View,E,Tmpl | -- | View | -- | View,E,Tmpl | -- | -- | -- | -- | -- | -- |
| Autopsy | View | View,E,Sched | -- | View | -- | View,E,Sched | -- | -- | -- | -- | -- | -- |
| Admin | -- | -- | -- | -- | -- | All | -- | -- | -- | -- | -- | Config |
| Provisioning | X | -- | -- | -- | -- | Admin | -- | -- | -- | -- | -- | -- |
| Marketing | -- | -- | -- | -- | -- | Dash | -- | -- | E,Dash | -- | -- | -- |
| Active Projects | -- | -- | -- | -- | View | View,Sync | -- | -- | -- | -- | -- | -- |
| Compliance Log | -- | -- | -- | -- | View | View | -- | View | -- | -- | -- | -- |
| Meetings | Sched,R | R | R | R | R | Sched,R | R | R | R | R | R | R |
| Hub Nav | -- | Precon,Proj | -- | -- | Proj | Precon,Proj | -- | -- | -- | -- | -- | -- |

---

## Appendix B: Document Library Permissions

Project sites contain 13 document libraries provisioned via `site-template.json`. By default, all libraries inherit site-level permissions. The following libraries should have **broken inheritance** for additional security:

| Library | Restricted Access | Rationale |
|---------|------------------|-----------|
| `05_Budget` | _Owners + Operations Team (Contribute); _Visitors (No Access) | Cost reports and pay applications contain sensitive financial data |
| `30_Subcontracts` | _Owners + Operations Team (Contribute); _Visitors (Read on Contract subfolder only) | Subcontractor proposals contain competitive pricing |
| `02_Safety/Incidents` | _Owners + Safety role (Contribute); all others (No Access) | Safety incidents may involve legal liability |
| `40_Closeout` | _Owners + Operations Team (Contribute); _Visitors (Read) | Lien waivers and financial closeout documents |
| `00_Project_Admin/Insurance` | _Owners + Legal + Risk Management (Contribute); _Members (Read) | Insurance certificates and coverage details |

---

## Appendix C: Feature Flags Reference

Feature flags control module visibility independently of role permissions. A disabled feature flag hides the module from all users regardless of their roles.

| ID | Feature Name | Controls | Default |
|----|-------------|----------|---------|
| 1 | `PipelineDashboard` | Pipeline dashboard on hub | Enabled |
| 2 | `LeadIntake` | Lead creation form | Enabled |
| 3 | `GoNoGoScorecard` | Go/No-Go scoring module | Enabled |
| 14 | `ExecutiveDashboard` | Executive dashboard with KPIs and charts | Enabled |
| 18 | `ProjectStartup` | Startup checklist and responsibility matrices | Enabled |
| 19 | `MarketingProjectRecord` | Marketing project record and dashboard | Enabled |
| 20 | `ProjectManagementPlan` | PMP module with approval workflow | Enabled |
| 21 | `MonthlyProjectReview` | Monthly project review workflow | Enabled |
