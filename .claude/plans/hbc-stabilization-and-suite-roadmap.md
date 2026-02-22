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

### 6. Phase 3: New App Shell + Router & Data Layer Reconstruction (mid-Apr 2026)
- Complete removal of PillarTabBar and all legacy navigation hooks.
- Implement Option 1: Global App Shell + Top Fluent UI App Launcher + Contextual Left Sidebar.
- Clean-slate reconstruction of TanStack Router wiring and data consumption (declarative loaders, proper Context providers, no adapters or router.update() hacks).
- Central Analytics Hub + Preconstruction / Operations / Leadership / Admin workspaces with preliminary dashboards and critical daily tasks for all 6 roles.

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `CLAUDE.md` | Major edit | Populate §§5, 17–23 and update cross-referenced sections |
| `.claude/plans/hbc-stabilization-and-suite-roadmap.md` | Create | This master reference for all code agents |
| `.claude/SKILL-*.md` (4 files) | Create | Capture patterns for 40–60 % faster future work |
| `packages/hbc-sp-services/src/` | Add/edit | DataProviderFactory + adapter skeletons |
| `src/webparts/hbcProjectControls/` | Major refactor | New AppShell, router tree, hooks (Phase 3) |

## Verification

1. CLAUDE.md contains all new sections (§5, §§17–23) with locked dates of 22 Feb 2026 and correct cross-references to this plan file.
2. This plan file exists in `.claude/plans/` and is referenced in §18.
3. All 4 new SKILL files exist with proper structure, examples, and CLAUDE.md cross-references.
4. Phase 1 (SharePoint provisioning) is delivered and approved by owner + rollout team by 31 Mar 2026.
5. PillarTabBar and all legacy TanStack migration adapters are fully removed; new App Shell runs with Option 1 navigation and shows measurable performance improvement on 100+ projects.
6. Router & data layer reconstruction follows `.claude/SKILL-CleanTanStackIntegration.md` patterns with zero re-render cascades or navigation freezes.
7. Every subsequent code change updates CLAUDE.md and references this plan file (governance enforced).

**Governance Note**: This plan is the single source of truth for the stabilization effort. Any deviation requires owner approval and immediate update to CLAUDE.md §18.