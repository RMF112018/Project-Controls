# Stage 17 Project Number Request Workflow Runbook

> Last updated: 2026-02-27  
> Scope: Stage 17 Steps 1-9 (including mandatory Step 9 documentation closure)

## 1. Purpose, Audience, and Scope

This runbook is the operational reference for the Stage 17 Project Number Request workflow in HBC Project Controls.

Primary audiences:
- End users: Estimator and Accounting Manager roles
- Administrators: role/identity administrators managing Entra ID mappings
- Developers and QA: implementation verification and release support

This document covers:
- Stage 17 capability overview
- Role configuration and Entra mapping administration
- Estimator and Accounting Manager user procedures
- End-to-end handoff workflow
- Standalone vs production behavior differences
- Testing, verification, operations, audit, and rollback guidance

---

## 2. Stage 17 Change Overview

Stage 17 delivered the following workflow-critical capabilities:

1. Dual-role permissions hardening
- Accounting Manager and Estimator dev roles were hardened for correct read/write behavior and guard enforcement.

2. Entra ID -> App Role Mapping Admin UI
- Admin-facing mapping UI supports identity-to-role assignment management for production and dev preview workflows.

3. Project Number Requests page completion
- Request analysis and creation UI were completed, including optimistic update behavior for better responsiveness.

4. Accounting New Project Setup completion
- `AccountingNewProjectSetupPage` now supports queue-driven setup, full financial coding and budget entry, provisioning action, and `SetupComplete` flow.

5. Full Estimator -> Accounting orchestration and notifications
- Cross-role handoff and completion notifications are wired in service-centric workflow paths with in-app toast feedback.

---

## 3. Role Configuration and Entra Mapping Guide (Admin)

### 3.1 Required role outcomes

For Stage 17 workflow success:
- Estimator user can create project number requests.
- Accounting Manager user can view pending setup queue, edit setup form, and finalize/provision.

Reference permission keys:
- `job_number_request:create`
- `job_number_request:finalize`
- `accounting_queue:view`

### 3.2 Entra mapping administration flow

1. Open Admin area and navigate to Entra mapping management UI.
2. Select the Entra principal (user or group).
3. Assign the intended application role.
4. Save mapping changes.
5. Validate effective access by signing in as a mapped user (or using approved dev-role switching process in non-production).

### 3.3 Dev-role behavior (RoleSwitcher)

In development/non-production validation flows:
- Use RoleSwitcher to simulate Estimator and Accounting Manager role contexts.
- Validate routing, guards, and action availability per role.
- Do not treat RoleSwitcher behavior as a production authorization mechanism; production authority remains App_Roles + SharePoint boundary enforcement.

---

## 4. Estimator User Guide: Create Project Number Request

### 4.1 Preconditions
- User is mapped to an Estimator-capable role for job number request creation.
- Required project details are available (name, address, executive, office/division, etc.).

### 4.2 Steps

1. Navigate to Project Number Requests list page.
2. Click `New Request`.
3. Complete required form fields:
- Project Name
- Street Address
- City/State
- Zip Code
- County
- Project Executive
- Office & Division
4. Submit the request.
5. Confirm return to the request list and visibility of the new request row.

### 4.3 Expected results
- Request is created without access-denied redirect.
- Status appears in the queue/list according to current workflow state.
- Request becomes available to Accounting Manager in setup queue.

---

## 5. Accounting Manager User Guide: Complete Setup and Provisioning

### 5.1 Preconditions
- User is mapped to Accounting Manager role.
- Pending request exists in accounting setup queue.

### 5.2 Steps

1. Navigate to Accounting New Project Setup page.
2. In the queue, click a pending request row.
3. Confirm Financial Coding & Budget form becomes editable immediately.
4. Complete required fields:
- Assigned Job Number
- Cost Center
- Division Code
- Phase Code
- Initial Budget
5. Complete optional fields as needed:
- Contingency Budget
- Budget Notes
6. Choose action:
- `Save Setup` to save coding without immediate provisioning
- `Save + Provision Site` to finalize and trigger provisioning
7. Confirm success toast and updated status behavior.

### 5.3 Expected results
- No row-click freeze.
- No form typing freeze.
- Submit action completes and reflects updated workflow status.

---

## 6. End-to-End Workflow Runbook (Estimator -> Accounting)

### 6.1 State progression

Typical progression:
1. Estimator submits request.
2. Accounting queue receives pending item.
3. Accounting Manager selects item and enters financial coding.
4. Accounting Manager saves and optionally provisions site.
5. Request reaches completion state (`SetupComplete` path when finalized/provisioned).
6. Estimator sees refreshed status and completion notification.

### 6.2 Expected user feedback

- Accounting side:
  - `Financial setup saved. Provisioning can be triggered when ready.`
  - or `Setup complete and site provisioning triggered.`
- Estimator side:
  - completion status update and completion toast/message on list refresh.

### 6.3 Screenshot placeholders (capture in your environment)

Use these placeholders when assembling release documentation artifacts:

1. `Screenshot A - Estimator request creation form`
- Capture point: New Request form before submit.
- Caption: "Estimator enters required project details for Project Number Request."

2. `Screenshot B - Accounting setup queue with pending request`
- Capture point: Accounting queue page with target request visible.
- Caption: "Accounting Manager queue showing pending project setup requests."

3. `Screenshot C - Accounting selected row + editable form`
- Capture point: After clicking queue row, with active editable inputs.
- Caption: "Selected request opens editable financial coding and budget form without freeze."

4. `Screenshot D - Save + Provision success confirmation`
- Capture point: Success toast and/or updated status after submit.
- Caption: "Accounting setup finalized and provisioning trigger confirmed."

5. `Screenshot E - Estimator completion state`
- Capture point: Estimator list page showing completed setup status.
- Caption: "Estimator view reflects accounting completion and handoff closure."

---

## 7. Standalone vs Production (Explicit Differences)

### 7.1 Authentication and identity

- Standalone:
  - Browser MSAL flow.
  - Graph-assisted group resolution may require explicit consent (`Group.Read.All`).
  - RoleSwitcher may be used in dev workflows.
- Production (SPFx/SharePoint):
  - SPFx context-driven identity.
  - Role resolution via configured role mappings and SharePoint-integrated services.
  - No RoleSwitcher-based authorization in production.

### 7.2 Environment and setup

- Standalone:
  - Requires environment variables (`VITE_*`) and standalone mode readiness checks.
- Production:
  - Deployed SPFx package with tenant/site configuration and SharePoint permissions.

### 7.3 Workflow behavior parity and caveats

Expected parity:
- Estimator request creation flow
- Accounting queue selection and form editability
- Save/provision user path and status progression

Caveats:
- Notification/provisioning dependencies may vary by environment wiring.
- Admin consent and identity mapping readiness can affect standalone role-resolution outcomes.

---

## 8. Testing and Verification Procedures

### 8.1 Core workflow verification (required)

Run targeted handoff coverage:

```bash
npx playwright test playwright/project-number-handoff.e2e.spec.ts --reporter=line
```

Pass criteria:
- Accounting Manager can click pending queue rows without freeze.
- Form fields are editable and accept typing.
- Submit (`Save + Provision Site`) succeeds.
- Estimator sees completion status and notification.
- No actionable console errors in run output.

### 8.2 Standalone verification (recommended)

```bash
npm run validate:standalone-env
npm run verify:standalone
```

Then re-run the workflow E2E in standalone-ready environment and confirm parity outcomes.

### 8.3 Production-oriented verification (recommended)

- Validate role mappings in admin UI.
- Execute Estimator -> Accounting workflow with production-like identities.
- Confirm status updates and audit expectations in operational logs.

---

## 9. Operational Notes, Audit Expectations, and Rollback

### 9.1 Operational notes

- Treat role mapping and queue responsiveness as release-critical.
- Validate both role views (Estimator and Accounting Manager) before sign-off.
- Keep runbook screenshots refreshed when UI labels or paths change.

### 9.2 Audit trail expectations

Expected audit posture for this workflow includes:
- Role/config changes logged through configuration/audit channels.
- Job number request update actions logged through request update paths.
- Provisioning triggers and completions reflected through service/audit events where configured.

### 9.3 Rollback sequence (workflow regression)

If workflow-critical regression is detected:
1. Pause release progression and classify severity.
2. Revert to last known-good deployment package/config.
3. Re-run targeted workflow verification commands.
4. Confirm Estimator submission and Accounting finalization paths are restored.
5. Record incident summary and follow-up corrective action in release governance artifacts.

---

## 10. Quick Sign-Off Checklist (Release/Ops)

- [ ] Entra mappings verified for Estimator and Accounting Manager identities.
- [ ] Estimator can submit Project Number Request end-to-end.
- [ ] Accounting Manager can select queue row and edit form without freeze.
- [ ] Save/provision action completes and status updates correctly.
- [ ] Standalone vs production caveats reviewed and accepted.
- [ ] Workflow verification command(s) passed and evidence captured.
- [ ] Audit expectations reviewed with operations/admin stakeholders.
- [ ] Rollback owner and procedure confirmed for release window.

