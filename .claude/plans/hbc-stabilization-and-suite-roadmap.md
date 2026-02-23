# Plan: HBC Project Controls Stabilization, Role Reset & Modular Suite Transition

## Context

The HBC Project Controls application has strong foundational elements (@hbc/sp-services data layer, TanStack Router v1, Fluent UI v9) but carries technical debt in navigation (PillarTabBar) and the TanStack migration wiring that the owner has labeled a "catastrophic failure." The owner (non-technical) has directed a shift to a modern enterprise suite architecture: Central Analytics Hub + Departmental Workspaces. This plan locks the target state, resets roles to 6 core roles, ditches the PillarTabBar, performs a clean-slate reconstruction of the router and data-layer integration, and prepares pluggable backends for Gen 2/3 (Azure SQL / Dataverse). 

All changes are configuration-driven to eliminate future migrations. Highest priority: SharePoint Site Provisioning ships by 31 Mar 2026. MVP (new navigation + core tasks for all roles) mid-Apr 2026. Full scope + Procore/BambooHR by end-Aug 2026.

Working branch: `feature/hbc-suite-stabilization` (created 22 Feb 2026). Main branch protected.

## Current State
- Repository commit: a9adcfe9f4c385b415372c1bfbfd651badf8db9f (22 Feb 2026)
- Architecture: Single SPFx web part monorepo with TanStack Router (58 routes), Query v5, and @hbc/sp-services (250/250 methods complete)
- Navigation: PillarTabBar active (deprecated per owner decision) and documented in §16 as source of pain
- Roles: 14 legacy roles → being reset to 6 (Admin, Business Development Manager, Estimating Coordinator, Project Manager, Leadership (global), Project Executive (scoped))
- Data layer: Strong abstraction but requires DataProviderFactory for future Azure SQL / Dataverse
- CLAUDE.md: Only 7 of 23 sections populated; no roadmap, no suite strategy, no role matrix
- .claude/plans/: Directory ready for master plans

## Child-App Structure (Owner-provided 22 Feb 2026, locked for Phase 3):
- Preconstruction (BD + Estimating + IDS Hubs)
- Operations (Commercial/Luxury, Operational Excellence, Safety, QC & Warranty)
- Share Services (Marketing, HR, Accounting, Risk Management)
- QA/QC & Safety (mobile field app)
All use top App Launcher + contextual Left Sidebar. Documents via Fluent/Graph.

## Deliverables (6 major items)

### 1. Phase 0: Blueprint Lockdown & Documentation
- Insert full §5 (Roles & Permissions Matrix) and §§17–23 (Vision, Roadmap, Data Strategy, Suite Strategy, Navigation, Router Reconstruction, App Shell Patterns) into CLAUDE.md with exact wording.
- Update §§1, 4, 16 with cross-references and deprecation notes.

### 2. Create Skill & Plan Artifacts
- Create this master plan file (`.claude/plans/hbc-stabilization-and-suite-roadmap.md`).
- Create `.claude/SKILL-PermissionSystem.md`, `.claude/SKILL-CleanTanStackIntegration.md`, `.claude/SKILL-EnterpriseNavigation.md`, `.claude/SKILL-PluggableDataBackends.md`.

### 3. Phase 0.5: Pluggable Data Backend Preparation (parallel, 3–5 days)
- Implement `DataProviderFactory` in `@hbc/sp-services`.
- Add empty adapter skeletons (`AzureSqlDataService.ts`, `DataverseDataService.ts`).
- Update IDataService and configuration for runtime backend selection.
- **STATUS: COMPLETE** — Committed on `feature/hbc-suite-stabilization`. DataProviderFactory + AzureSql/Dataverse stubs + 13 Jest tests. (22 Feb 2026)

### 4. Phase 1: SharePoint Site Provisioning Engine (by 31 Mar 2026)
- Full Admin tools for site creation, template application, user provisioning, defaults, and Entra ID audit logging (SOC2 foundations).
- **STATUS: COMPLETE** — Committed on `feature/hbc-suite-stabilization`. SiteProvisioningWizard + SiteDefaultsConfigPanel + EntraIdSyncService + ISiteProvisioningDefaults + IAuditSnapshot + 9 new IDataService methods (259 total) + 33 Jest tests. (22 Feb 2026)

### 5. Phase 2: New Role & Permission System (by 5 Apr 2026)
- Configuration-driven role engine (SharePoint list backed).
- Admin UI for creating/editing roles and granular defaults with global vs. scoped access.
- **STATUS: COMPLETE** — Committed on `feature/hbc-suite-stabilization`. IRoleConfiguration + LEGACY_ROLE_MAP (14→6 role normalization) + RoleGate bidirectional normalization + RoleConfigurationPanel + resolvePermissionsFromConfig/hasGlobalAccess/resolveNavGroupAccess utilities + 7 new IDataService methods (266 total) + 35 Jest tests.

### 6. Phase 3: New App Shell + Router & Data Layer Reconstruction (mid-Apr 2026)
- Complete removal of PillarTabBar and all legacy navigation hooks.
- Implement Option 1: Global App Shell + Top Fluent UI App Launcher + Contextual Left Sidebar.
- Clean-slate reconstruction of TanStack Router wiring and data consumption (declarative loaders, proper Context providers, no adapters or router.update() hacks).
- Central Analytics Hub + Preconstruction / Operations / Leadership / Admin workspaces with preliminary dashboards and critical daily tasks for all 6 roles.
- **STATUS: COMPLETE** — Committed on `feature/hbc-suite-stabilization` (22 Feb 2026). Deliverables: AppLauncher + ContextualSidebar + workspaceConfig.ts + WorkspaceContext + NavPrimitives (Phase 3A). 5 workspace route files replacing 7 batch files, 62 routes total (Phase 3B). Adapter hooks rewritten to use TanStack Router directly, TanStackAdapterBridge + RouterAdapterContext deleted (Phase 3C). PillarTabBar deleted, uxEnhancedNavigationV1 flag removed, uxSuiteNavigationV1 is sole nav flag (Phase 3D). 752 tests passing, TypeScript clean (Phase 3E).

### 4. Phase 2: New Role & Permission System (by 5 Apr 2026)
- Configuration-driven role engine (SharePoint list) with Admin CRUD panel, global vs scoped access, Entra ID sync, SOC2 audit.
- **STATUS: COMPLETE** (22 Feb 2026)

### 5. Phase 3: New App Shell + Router & Data Layer Reconstruction (mid-Apr 2026)
- Removed PillarTabBar entirely. Implemented Global App Shell + Top App Launcher + Contextual Left Sidebar.
- Clean-slate TanStack Router reconstruction (declarative loaders, no adapters/bridge).
- **STATUS: COMPLETE** (22 Feb 2026)

### 6. Phase 4: Full Features + Integrations + Schedule v2 Prep + Gen 2/3 Readiness (end-Aug 2026)
- Procore & BambooHR connectors (mock-first, bidirectional/one-way), QA/QC & Safety mobile-first workspace, Schedule v2 enhancements (virtualization, Gantt, drag-drop, What-If), DataProviderFactory UI wiring, Azure SQL/Dataverse core methods, PWA polish.
- **STATUS: IN PROGRESS** (executing on `feature/hbc-suite-stabilization`)
- **Phase 4D (23 Feb 2026)**: Procore/BambooHR connector UI complete — 8 pages (4 Procore + 4 BambooHR), ConnectorManagementPanel with sync-history drawer, routes + sidebar config, 8 Storybook stories, PermissionEngine tool definitions + templates for procore/bamboo permissions, Drawer import fix. 47 Operations routes, 25 Shared Services routes.
- **Phase 4E (23 Feb 2026)**: Project Number Requests module BUILT — ProjectNumberRequestsPage (7-column tracking table with KPI cards) + ProjectNumberRequestForm (9 required + 4 optional fields, dual-workflow). 3 new routes + 1 redirect (old `/estimating/job-requests`). 4 new IDataService methods (270 total). TYPICAL workflow (PendingController → number assignment → provisioning → Completed) + ALTERNATE workflow (immediate placeholder + provisioning). Feature flag: ProjectNumberRequestsModule. Permission: PROJECT_NUMBER_REQUEST_VIEW. 13 new Jest tests (674 total). 20 Preconstruction routes.

### 7. Phase 5: Gen 1 Production Release & Handover (Sep–Oct 2026)
- End-to-end testing with rollout team, SOC2 final audit, production SPFx deployment, training, documentation, monitoring/hotfix process.

### 8. Phase 6: Gen 2 – Hosted PWA Web App (Q4 2026)
- Hosted PWA (Azure Static Web Apps recommended) as the full-screen installable version. Full reuse of existing codebase + DataProviderFactory (Azure SQL focus) + enhanced offline capabilities. (Standalone desktop swapped per owner decision 22 Feb 2026.)

### 9. Phase 7: Gen 3 – Native Mobile Application (Q1 2027)
- Dedicated native mobile app (React Native) with QA/QC & Safety as flagship workspace. Full offline sync, photo/GPS, push notifications.

### 10. Phase 8: Post-Launch Expansion (Ongoing)
- SAGE Intact integration, advanced analytics/AI, new modules, continuous enhancements.

## Verification

1. CLAUDE.md contains all sections with correct cross-references and phase statuses.
2. This plan file is the single source of truth and is referenced in CLAUDE.md §18.
3. All SKILL files exist and are followed.
4. Every phase update includes git commit on `feature/hbc-suite-stabilization` and CLAUDE.md synchronization.
5. Full sprint gate (`npm run verify:sprint3`) passes after each phase.

**Governance Note**: This plan is the single source of truth for the entire effort. Any deviation requires owner approval and immediate update to CLAUDE.md §18. Phase 4 must complete before marking overall stabilization done.