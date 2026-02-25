# Plan: Preconstruction > Estimating > Department Tracking Page

## Context

The Preconstruction workspace Estimating section currently has a frozen “New Job Requests” link. This plan implements the **Department Tracking** page at `/preconstruction/estimating/department-tracking` as a fresh, fully functional module.

The page contains three editable HbcTanStackTable tabs with **inline editing on all fields** and slide-out panels for creating/editing entries. Data and columns are taken directly from the "Master Sheet 2026" worksheet of the provided Excel workbook. The "Estimating / BIM Checklist" items are expanded into their own individual columns for quick inline editing.

All work on `feature/hbc-suite-stabilization`.

## Deliverables

### 1. Page Structure
- PageHeader title="Department Tracking" subtitle="Estimating & Preconstruction Tracking"
- Three tabs at the top (Fluent UI TabList):
  1. **Estimate Tracking Log**
  2. **Current Pursuits**
  3. **Current Preconstruction**
- Each tab displays a full-width editable HbcTanStackTable with **inline editing enabled on every field**.
- Floating "New Entry" button opens a slide-out Drawer (Fluent UI Drawer) with form fields matching the sheet columns.

### 2. Tab 1: Estimate Tracking Log
Columns (exact from Master Sheet 2026):
- Project #
- Project Name
- Estimate Type
- Cost per GSF
- Cost per Unit
- Submitted
- Pending
- Awarded W/O Precon
- Not Awarded
- Awarded W/ Precon
- Lead Estimator
- Notes

**All fields inline editable.**

### 3. Tab 2: Current Pursuits
Columns (exact from Master Sheet 2026, with Estimating/BIM Checklist expanded into individual columns):
- Project #
- Project Name
- Source
- Deliverable
- Sub Bids Due
- Presubmission Review
- Win Strategy Meeting
- Due Date (Out the Door)
- Lead Estimator
- Contributors
- PX
- Bid Bond (Wanda) – checkbox column
- P&P Bond – checkbox column
- Schedule – checkbox column
- Logistics – checkbox column
- BIM Proposal – checkbox column
- Precon Proposal (Ryan) – checkbox column
- Proposal Tabs (Wanda/Christina) – checkbox column
- Coor. w/ Marketing Prior to Sending – checkbox column
- Business Terms

**All fields inline editable.** Checklist items are separate boolean/checkbox columns for quick inline editing.

### 4. Tab 3: Current Preconstruction
Columns (exact from Master Sheet 2026):
- Project #
- Project Name
- Current Stage (as of date)
- Precon Budget
- Design Budget
- Billed to Date
- Lead Estimator

**All fields inline editable.**

### 5. Data & Workflow
- All data stored via IDataService (new methods for CRUD on each table).
- Every inline edit and new entry triggers audit logging (logAuditWithSnapshot).
- Feature flag: `EstimatingDepartmentTracking`.

### 6. Role & Permission
- RoleGate: Estimating Coordinator, Project Executive, Project Manager, Leadership, Admin.
- Permission: ESTIMATING_DEPARTMENT_TRACKING_EDIT / VIEW.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Inline editing | All fields editable directly in table | Allows quick changes as requested |
| Estimating/BIM Checklist | Each item its own column | Matches owner request for individual columns |
| Slide-out panel | For new entries | Keeps table clean while allowing full form entry |
| Data source | New IDataService methods + audit snapshots | Aligns with permission-system and pluggable-data skills |

## Verification

- All three tabs load with data matching the Excel structure
- Inline editing works on every field in all tables
- Slide-out forms for new entries
- RoleGate restricts access correctly
- `npm run verify:sprint3` + a11y pass

## Post-Implementation

- Update CLAUDE.md §20 with Department Tracking module details
- Update master plan to mark this module as COMPLETE

**Governance Note**: This plan is the single source of truth for the Department Tracking module. Any deviation requires owner approval and immediate CLAUDE.md update.