# Plan: Project Number Requests Module (Preconstruction Workspace)

## Context

The “New Job Requests” link in the Preconstruction sidebar currently causes a freeze. This plan replaces it with a new, fully functional **Project Number Requests** module titled exactly as specified. The module includes a read-only tracking log and a styled request form that triggers the detailed workflow provided by the owner.

All work on `feature/hbc-suite-stabilization`. No routing changes outside the Preconstruction workspace.

## Deliverables

### 1. Sidebar Link Update
- Rename the existing Preconstruction sidebar link from “New Job Requests” to **“Project Number Requests”**.
- Link points to `/preconstruction/project-number-requests`.

### 2. Project Number Requests Tracking (Read-Only Log)
- Enhanced HbcTanStackTable with columns:
  - Project Name
  - Project Number
  - Status
  - Request Date (mm/dd/yyyy)
  - Required by Date (mm/dd/yyyy)
  - Requested By (display name of user who submitted associated request form)
  - Ball in Court (display name of user who’s action is currently pending)
- Each record row is clickable → opens the New Project Request Form pre-populated with the record.
- RoleGate: visible to Estimating Coordinator, Project Executive, Project Manager, Leadership.

### 3. New Project Request Form
Fresh Fluent UI v9 form styled to match the application (not Google Forms). Exact fields and options from the source Google Form:

**Required fields:**
- **Email** – Text input (pre-filled with current user email)
- **Date** – Date picker (default to today)
- **Project Name** – Text input
- **Street Address** – Text input
- **City, State** – Text input
- **Zip Code** – Text input
- **County** – Text input
- **Project Executive** – Dropdown with options:
  - Bob Cashin
  - Joe Keating
  - Duke Snyder
  - Joe Morin
  - Art Miller
  - Dale Hedrick
  - Gene Parker
  - Burk Hedrick
  - Ryan Hutchins - Commercial Estimating
  - Chai Banthia - Residential Estimating
  - Robin Lunsford
  - Paul Faulks
  - Matt Zaryk
  - Bobby Fetting
- **Office & Division** – Dropdown with options:
  - Luxury Residential (01-10)
  - HB HQ Aerospace (01-41)
  - HB HQ General Commercial (01-43)
  - HB HQ Country Clubs & Hospitality (01-44)
  - HB HQ Educational & Municipal (01-45)
  - HB HQ Multi-Family (01-48)
  - South Aerospace (01-51)
  - South General Commercial (01-53)
  - South Country Clubs & Hospitality (01-44)
  - South Educational & Municipal (01-55)
  - South Multi-Family (01-58)
  - Central Aerospace (01-61)
  - Central General Commercial (01-63)
  - Central Country Clubs & Hospitality (01-64)
  - Central Educational & Municipal (01-65)
  - Central Multi-Family (01-68)
  - Space Coast Aerospace (01-31)
  - Space Coast General Commercial (01-33)
  - Space Coast Country Clubs & Hospitality (01-34)
  - Space Coast Educational & Municipal (01-35)
  - Space Coast Multi-Family (01-38)

**Optional fields:**
- **Project Manager** – Text input
- **Will this project be managed in Procore?** – Radio buttons (Yes/No)
- **In addition to the above PX & PM, who else needs access to this project in SAGE?** – Text input
- **Who will approve Timberscan invoices/pay apps?** – Text input

**Submit buttons (two distinct actions):**
- “Submit (recommended)” – triggers TYPICAL workflow
- “Submit and Create Site” – triggers ALTERNATE workflow

### 4. Workflow Engine
- **TYPICAL WORKFLOW** (“Submit” button)
  1. Submit → notification to Controller (email + Teams) + entry in Accounting > New Project Setup queue.
  2. Controller completes setup (MVP: external; Future: in-app SAGE/Procore).
  3. Controller enters Project Number → “Save”.
  4. SharePoint Site Provisioning triggered.
  5. Completion notifications to Estimator, Project Executive, Project Manager.

- **ALTERNATE WORKFLOW** (“Submit and Create Site” button)
  1. Submit → placeholder Project Number {yy}-999-01 created.
  2. SharePoint Site Provisioning triggered immediately.
  3. Simultaneous notification to Controller.
  4. Controller assigns real Project Number later → site title updated.
  5. Final notifications to Estimator, Project Executive, Project Manager.

### 5. Supporting Infrastructure
- New IDataService methods for request CRUD and workflow state transitions.
- Audit logging on every state change (logAuditWithSnapshot).
- Feature flag: `ProjectNumberRequestsModule`.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module title | “Project Number Requests” | Exact owner specification |
| Form fields | Exact match to Google Form | Ensures identical data collection |
| Submit buttons | Two distinct actions | Directly implements TYPICAL and ALTERNATE workflows |
| Table | Enhanced HbcTanStackTable | Reuses existing polished component |

## Verification

- Sidebar link renamed and navigates correctly
- Tracking table loads and rows are clickable
- Form renders with all fields and two submit buttons
- Both workflows trigger correct notifications and provisioning (mock mode)
- RoleGate restricts access correctly
- `npm run verify:sprint3` + a11y pass

## Post-Implementation

- Update CLAUDE.md §20 with Project Number Requests module details
- Update master plan to mark this module as COMPLETE

**Governance Note**: This plan is the single source of truth for the Project Number Requests module. Any deviation requires owner approval and immediate CLAUDE.md update.