# Plan: Preconstruction Hub Features

## Context

The Preconstruction workspace is one of the four departmental hubs in the HBC suite (per child-app-structure skill and owner outline 22 Feb 2026). It contains three sub-hubs: Business Development, Estimating, and Innovation & Digital Services (IDS).  

This plan defines the exact features, components, and data interactions for the Preconstruction Hub. No routing changes, no external connectors, and no navigation elements are included — focus is strictly on the UI features and IDataService calls.

All work occurs on `feature/hbc-suite-stabilization`.

## Deliverables – Features to Include

### 1. Preconstruction Dashboard
- KPI cards (Active Leads, Go/No-Go in Progress, Pipeline Value, Win Rate)
- Quick links to BD, Estimating, and IDS hubs
- Recent activity feed (new leads, recent estimates)

### 2. Hub: Business Development
- Business Development Dashboard (lead funnel chart, win rate trend)
- Modules:
  - Lead Management (HbcTanStackTable with status filters)
  - Go/No-Go (workflow tracker)
  - Pipeline (forecast table)
  - Project Hub (link to Operations Project Hub for won projects)
  - Documents (embedded SharePoint library)

### 3. Hub: Estimating
- Estimating Dashboard (department tracking, backlog value)
- Modules:
  - Department Tracking (Estimating Tracking, Preconstruction Tracking)
  - New Job Requests
  - Post-Bid Autopsies
  - Project Hub
  - Documents (embedded SharePoint library)

### 4. Hub: Innovation & Digital Services (IDS)
- IDS Dashboard (deliverables status, service request queue)
- Modules:
  - IDS Tracking (deliverables, new service requests)
  - Project Hub
  - Documents (embedded SharePoint library)

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Three sub-hubs | Separate collapsible sections under Preconstruction sidebar | Matches owner outline and Phase 3 contextual sidebar |
| Documents | Consistent embedded viewer | Reusable component; Graph API via DataProviderFactory |
| Project Hub | Link to Operations Project Hub for won projects | Avoids duplication |

## Verification

- All dashboards and modules render without errors for permitted roles
- All tables and charts function
- RoleGate and FeatureGate work correctly
- `npm run verify:sprint3` + `npm run test:a11y` pass

## Post-Implementation

- Update CLAUDE.md §20 with Preconstruction Hub details
- Update master plan to mark Preconstruction Hub features as COMPLETE

**Governance Note**: This plan is the single source of truth for the Preconstruction Hub features. Any deviation requires owner approval and immediate CLAUDE.md update.