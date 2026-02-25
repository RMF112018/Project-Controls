# Plan: Shared Services Workspace Features

## Context

The Shared Services workspace is one of the four departmental workspaces in the HBC suite (per child-app-structure skill and owner outline 22 Feb 2026). It contains four hubs: Marketing, Human Resources, Accounting, and Risk Management.  

This plan defines the exact features, components, and IDataService interactions for the Shared Services workspace. No routing changes, no external connectors, and no navigation elements are included — focus is strictly on the UI features and data interactions via IDataService.

All work occurs on `feature/hbc-suite-stabilization`.

## Deliverables – Features to Include

### 1. Shared Services Dashboard (Landing Page)
- Overview KPI cards (Marketing Campaigns Active, Open HR Requests, AR Aging, Risk Items Open)
- Quick links to the four hubs
- Recent activity feed (last 5 items from each hub)

### 2. Contextual Sidebar Groups (4 hubs)

**Hub: Marketing**  
- Marketing Dashboard  
- Resources  
- Requests  
- Tracking  
- Documents (embedded SharePoint library viewer)

**Hub: Human Resources**  
- People & Culture Dashboard  
- Openings  
- Announcements (birthdays, anniversaries, promotions)  
- Initiatives  
- Documents (embedded SharePoint library viewer)

**Hub: Accounting**  
- Accounting Dashboard  
- New Project Setup  
- Accounts Receivable Report  
- Documents (embedded SharePoint library viewer)

**Hub: Risk Management**  
- Risk Management Dashboard  
- Knowledge Center  
- Requests (certificates of insurance, subcontractor enrollment, license renewals)  
- Enrollment Tracking  
- Documents (embedded SharePoint library viewer)

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Four separate hubs | Collapsible sidebar groups | Matches owner outline and Phase 3 contextual sidebar pattern |
| Documents | Consistent embedded viewer | Reusable component; Graph API via DataProviderFactory |
| Fresh implementation | No reuse of existing pages | Required per clean-tanstack-integration and child-app-structure skills |

## Verification

- All 4 hubs render correctly when Shared Services workspace is active  
- All dashboards and modules function  
- RoleGate and FeatureGate enforce access  
- Documents viewer loads embedded libraries  
- `npm run verify:sprint3` + `npm run test:a11y` pass

## Post-Implementation

- Update CLAUDE.md §20 with Shared Services workspace details  
- Update master plan to mark Shared Services workspace features as COMPLETE

**Governance Note**: This plan is the single source of truth for the Shared Services workspace. Any deviation requires owner approval and immediate CLAUDE.md update.