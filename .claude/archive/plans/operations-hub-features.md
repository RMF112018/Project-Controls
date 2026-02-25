# Plan: Operations Hub Features

## Context

The Operations workspace is one of the four departmental hubs in the HBC suite (per child-app-structure skill and owner outline 22 Feb 2026). It serves Commercial Operations and Luxury Residential under a single contextual hub, with content conditionally rendered based on user role/permissions (e.g., Luxury Residential sections hidden for non-Luxury users).  

This plan defines the exact features, components, and data interactions for the Operations Hub. No routing changes, no external connectors, and no navigation elements are included — focus is strictly on the UI features and IDataService calls.

All work occurs on `feature/hbc-suite-stabilization`.

## Deliverables – Features to Include

### 1. Operations Dashboard
- KPI cards (Active Projects, On-Time Completion, Safety Score, Budget Variance)
- Quick links to Project Hub, Safety, QC & Warranty
- Recent activity feed (last 5 provisioning logs, safety incidents)
- Role-gated Luxury Residential KPI strip

### 2. Commercial Operations Dashboard
- Project list (HbcTanStackTable with status, division, region filters)
- Luxury Residential toggle (visible only to permitted roles)
- Quick stats: Open Buyouts, Pending Permits, Active Constraints

### 3. Project Hub (shared)
- Project Dashboard (overview cards, status timeline)
- Project Settings (basic metadata edit)
- Project Manual (sub-sections: Project Management Plan, Superintendent’s Plan, Responsibility Matrix, Startup & Closeout, Meeting Agenda Templates, Pay Application Process, Safety Plan, OSHA Guide, Tropical Weather Guide, Crisis Management, QA/QC Program, IDS Requirements)

### 4. Cost & Time
- Financial Forecasting (Review Checklist, Forecast Summary, GC/GR Forecast, Cash Flow Forecast)
- Schedule (Reference Schedule v2 placeholder – links to Schedule module)

### 5. Logs & Reports
- Buyout Log
- Permit Log
- Constraints Log
- Monthly Reports (PX Review, Owner Report)
- Subcontractor Scorecard

### 6. Documents
- Embedded SharePoint library viewer (Fluent DocumentCard + Graph integration via DataProviderFactory)

### 7. Operational Excellence Dashboard
- Onboarding checklist
- Training tracker
- Documents section

### 8. Safety Dashboard
- Training & Certification tracker
- Safety Scorecard
- Resources (Tool-Box Talks, Updates)
- Documents section

### 9. Quality Control & Warranty Dashboard
- Best Practices library
- Quality Assurance Tracking
- Quality Control Checklists (smart populated)
- Warranty (Guides, Tracking, Client Portal)
- Documents section

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single contextual hub | One Operations workspace with conditional Luxury Residential content | Simpler navigation; matches Phase 3 contextual sidebar and child-app-structure skill |
| Luxury Residential visibility | Role/permission gated | Aligns with permission-system skill (scoped access for Project Executive) |
| Documents | Consistent embedded viewer across all modules | Reusable component; Graph API via DataProviderFactory |
| Schedule | Placeholder link to Schedule v2 | Phase 4E will enhance Schedule; no duplication |

## Verification

- All dashboards and modules render without errors for permitted roles
- Luxury Residential sections hidden for non-Luxury users
- All tables, checklists, and document viewers function
- RoleGate and FeatureGate work correctly
- `npm run verify:sprint3` + `npm run test:a11y` pass

## Post-Implementation

- Update CLAUDE.md §20 with Operations Hub details
- Update master plan to mark Operations Hub features as COMPLETE

**Governance Note**: This plan is the single source of truth for the Operations Hub features. Any deviation requires owner approval and immediate CLAUDE.md update.