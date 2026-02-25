---
name: HBC Child-App Structure
description: Modular departmental workspace architecture for the HBC Project Controls suite using Global App Shell + Top App Launcher + Contextual Left Sidebar (Option 1) with Preconstruction, Operations, Share Services, and QA/QC & Safety workspaces
version: 1.0
category: suite-architecture
triggers: child-app, workspace, departmental hub, preconstruction, operations, share services, qa/qc safety, app launcher, contextual sidebar, project hub, documents module, mobile field app
updated: 2026-02-22
---

# HBC Child-App Structure Skill

**Activation**  
Implementing, modifying, or extending any departmental workspace, child-app, App Launcher entry, contextual sidebar, or navigation between Preconstruction, Operations, Share Services, or QA/QC & Safety modules after the new suite architecture (Phase 3).

**Protocol**  
1. All workspaces are lazy-loaded TanStack Router route groups under the Global App Shell.  
2. Each workspace appears as a tile in the top Fluent UI CommandBar App Launcher grid.  
3. Contextual Left Sidebar is driven by route metadata and shows only relevant Hubs/Modules for the active workspace.  
4. Documents modules use Fluent DocumentCard + Graph API integration via DataProviderFactory for embedded viewing or library sync.  
5. QA/QC & Safety workspace is mobile-first (full Gen 3 readiness with offline support).  
6. Every workspace and major module is wrapped in RoleGate + FeatureGate.  
7. New workspaces or modules are added via route metadata (no hard-coded navigation).  
8. Post-change verification: update CLAUDE.md §20/§21, master plan, run full sprint gate + a11y.

**6 Critical Flows Guaranteed Stable**  
1. App Launcher → Preconstruction workspace → contextual sidebar shows BD/Estimating/IDS hubs.  
2. Operations workspace → Commercial/Luxury split with shared Project Hub (Project Manual, Cost & Time, Logs & Reports).  
3. Share Services workspace → Marketing/HR/Accounting/Risk Management hubs.  
4. QA/QC & Safety workspace → full mobile field experience with drawer + bottom nav.  
5. Documents modules across all workspaces → consistent embedded viewer or synced library access.  
6. Role-based visibility: Leadership sees everything; Project Executive sees only assigned projects/departments.

**Manual Test Steps**  
1. Open App Launcher → click Preconstruction → verify BD, Estimating, and IDS modules appear in sidebar.  
2. Switch to Operations → verify Commercial Operations, Safety, QC & Warranty, and shared Project Hub.  
3. Log in as Project Executive → confirm only scoped workspaces and modules are visible.  
4. Navigate to any Documents module → verify embedded SharePoint library view loads correctly.  
5. Resize to mobile viewport → confirm drawer + bottom nav for QA/QC & Safety.  
6. Run full E2E + a11y suite for all workspaces and roles.

**Reference**  
- `CLAUDE.md` §20 (Application Suite Strategy), §21 (Navigation & Suite UX Architecture)  
- `.claude/plans/hbc-stabilization-and-suite-roadmap.md` (Child-App Structure section)  
- `.claude/skills/enterprise-navigation/SKILL.md` (App Shell + Launcher + Sidebar foundation)  
- `.claude/skills/permission-system/SKILL.md` (Role-based workspace visibility)  
- `UX_UI_PATTERNS.md` (Fluent UI Documents and workspace patterns)  
- Owner child-app outline (22 Feb 2026)