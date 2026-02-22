---
name: CLAUDE.md | description: Master blueprint, live status, and central coordinator for HBC Project Controls SPFx application | triggers: all | updated: 2026-02-22
---

**CLAUDE.md — HBC Project Controls Blueprint (Lean Edition)**

**Performance Rule (Critical)**  
This file must stay under 40,000 characters. Never allow it to grow large again. When it approaches the limit, archive older content to CLAUDE_ARCHIVE.md.

**Update Rules (Mandatory)**  
- After every completed data service chunk → update §7 and §15  
- After major architecture/pattern changes → update relevant sections (§4, §16, §21, §22)  
- After adding, consolidating, or updating .claude/ instruction files, Skills, or Plans → update §0 and §16  
- Always keep focused on: current status, active rules, verification gates, and live references.

For full historical phase logs (SP-1 through SP-7), complete 221-method table, old navigation, and detailed past pitfalls → see **CLAUDE_ARCHIVE.md**.

**Last Updated:** 2026-02-22 — Phase 3 COMPLETE: Navigation Overhaul + Router Reconstruction. PillarTabBar deleted. App Launcher + ContextualSidebar active behind `uxSuiteNavigationV1`. Adapter hooks rewritten to use TanStack Router directly (no bridge). 5 workspace route files replace 7 batch files. 62 routes (58 original + 2 redirects + 2 placeholders). 752 tests passing.

**MANDATORY:** After any code change that affects the data layer, architecture, performance, UI/UX, testing, or security, update this file, verify against the current sprint gate, confirm relevant Skills and the master plan were followed, and check project memory before ending the session.

---

## §0 Development Workflow Rules

**Agent Knowledge Base – Mandatory Consultation Order (Critical)**  
Before any analysis, code change, review, or response, consult the following files **in exact order**:

1. **CLAUDE.md** (this file) – Master status and rules  
2. **PERFORMANCE_OPTIMIZATION_GUIDE.md** – Performance, TanStack Query/Router, React 18, bundle, and virtualization rules  
3. **UX_UI_PATTERNS.md** – Fluent UI v9, construction UX, accessibility, and Griffel styling  
4. **FEATURE_DEVELOPMENT_BLUEPRINT.md** – New features, domains, routes, and schedule-v2 replacement patterns  
5. **CODE_ARCHITECTURE_GUIDE.md** – Layered architecture, folder structure, and dependency rules  
6. **TESTING_STRATEGY.md** – Testing pyramid, Jest, Playwright, Storybook, and a11y coverage  
7. **DATA_LAYER_GUIDE.md** – IDataService, caching, mocks, and PnP integration  
8. **SECURITY_PERMISSIONS_GUIDE.md** – RBAC, RoleGate/FeatureGate, Feature flags, and audit rules  
9. **SKILLS_OVERVIEW.md** – Index of all active Skills and triggers  
10. **.claude/plans/hbc-stabilization-and-suite-roadmap.md** – Master development plan for all code agents
11. **New Skills (consult most specific first):**  
   - `.claude/skills/permission-system/SKILL.md`  
   - `.claude/skills/clean-tanstack-integration/SKILL.md`  
   - `.claude/skills/enterprise-navigation/SKILL.md`  
   - `.claude/skills/pluggable-data-backends/SKILL.md`

All files reside in the `.claude/` directory.  
**Agent Rule:** Quote only the exact rule, checklist item, protocol, or section that applies. Never repeat full sections.

**Skills Activation Rule**  
After consulting the core guides, automatically activate the most specific Skill(s) from `.claude/skills/` based on task triggers (see SKILLS_OVERVIEW.md). Skills operate via progressive disclosure (frontmatter always available; full content loaded on-demand).

**Memory Usage Rule (Dynamic Layer)**  
- Static architecture, performance, UX, feature, and security rules → core `.claude/` files + Skills (never duplicate here).  
- Evolving decisions, performance baselines, user preferences, recent architectural choices, and session-specific facts → project memory (`MEMORY.md` in Claude Code project memory folder).  
- Always check project memory after the core guides and before responding.  
- Populate via “Remember that…” statements or `/memory` command.  
- Keep entries concise (< 200 characters) and actionable.

### Core Workflow Commands (Unchanged)
- After any meaningful code change → run `/verify-changes` and show full output.  
- Never mark work complete until verification passes (TypeScript, ESLint, tests, a11y).  
- Before commits and PRs → run `/verify-full-build` + `npm run verify:sprint3`.  
- After completing a data service chunk → run `/review-chunk`.  

**Key Verification Commands**  
- `npm run verify:sprint3` → Current sprint gate (lint + TS + tests + e2e/a11y + standalone report + hard bundle cap)  
- `npm run verify:standalone` → Standalone + PWA validation  
- `npm run test:a11y` → WCAG 2.2 AA (required before marking complete)  
- `npm run verify:bundle-size:fail` → Hard bundle budget enforcement  

---

## §0a Three-Mode Architecture (Locked — Do Not Change)

| # | Mode        | Trigger                                      | Data Service                     | Auth                  |
|---|-------------|----------------------------------------------|----------------------------------|-----------------------|
| 1 | **mock**    | Default (no .env)                            | MockDataService                  | None                  |
| 2 | **standalone** | VITE_DATA_SERVICE_MODE=standalone + login | StandaloneSharePointDataService  | MSAL 5.x browser OAuth|
| 3 | **sharepoint** | SPFx onInit()                             | SharePointDataService            | SPFx implicit         |

**Immutable Constraints**  
- MSAL packages imported **only** in `dev/auth/` — never in `src/` or `@hbc/sp-services`.  
- Mock mode is the absolute default.  
- See `SECURITY_PERMISSIONS_GUIDE.md` for RBAC and `DATA_LAYER_GUIDE.md` for service patterns.

---

## §1 Tech Stack & Build (Current)

- Framework: SPFx 1.22.2 + React 18.2 + Fluent UI v9 (Griffel + tokens)  
- Data Layer: `@hbc/sp-services` (250/250 methods – complete)  
- Routing: TanStack Router v1 (hash history – sole runtime router)  
- Data Fetching: TanStack Query v5 (Wave-1 complete on core domains)  
- Tables: HbcTanStackTable + virtualisation (threshold ≥ 200 rows)  
- Charts: HbcEChart (lazy ECharts chunk)  
- Testing: Jest + Playwright + Storybook 8.5 + Chromatic  
- Bundle Governance: Hard fail on main via `scripts/verify-bundle-size.js`  
- Data backends: Pluggable via `DataProviderFactory` (SharePoint default; Azure SQL / Dataverse skeletons in Phase 0.5).

See `PERFORMANCE_OPTIMIZATION_GUIDE.md` §5 for detailed bundle and chunk rules.

---

## §4 Core Architecture Patterns (Active)

- Strict layered architecture: Data → Domain → Presentation (no upward dependencies)  
- All data access through `IDataService` abstraction  
- TanStack Query + Router loaders preferred over useEffect fetches  
- RoleGate + FeatureGate required on every sensitive surface  
- Griffel `makeStyles` for all styling  

**Router Stability Rule (Critical)**
The TanStack Router instance MUST be created exactly once (via `useRef` in `router.tsx`) with static-only values (`queryClient`, `dataService`). Dynamic values injected via `router.update()` + `RouterProvider context={}`. NEVER pass dynamic values to `createHbcTanStackRouter`. NEVER add dynamic values to any dep array that triggers router recreation.

**Adapter Hooks (Phase 3 — Clean TanStack Direct)**
- `useAppNavigate`: Imports `useNavigate` from `@tanstack/react-router`, ref-backs it, returns stable `useCallback` (empty deps). No `startTransition` wrapper — TanStack Router's Transitioner handles transitions natively.
- `useAppLocation`: Uses `useRouterState` with selector for `pathname` + `searchStr`. Returns memoised object.
- `useAppParams`: Uses `useRouterState` with selector + `JSON.stringify` for stable params identity.
- Consumer-facing API unchanged — zero migration cost for consuming files.
- **TanStackAdapterBridge REMOVED** — adapter hooks consume TanStack primitives directly.
- **RouterAdapterContext DELETED** — no longer needed.

**Navigation Architecture (Phase 3 — uxSuiteNavigationV1)**
- **AppLauncher**: Fluent UI `Menu`/`MenuPopover` in AppShell header. Grid of workspace tiles (Preconstruction, Operations, Shared Services, Admin). RoleGate per tile.
- **ContextualSidebar**: Replaces NavigationSidebar. Reads `useWorkspace()` to derive active workspace from pathname. Renders workspace-specific sidebar groups from `workspaceConfig.ts`.
- **NavigationSidebar**: Retained as legacy fallback (no pillar filtering, pure role-based visibility).
- **workspaceConfig.ts**: Single source of truth for all workspaces, sidebar items, roles. Configuration-driven per §23.
- **WorkspaceContext** (`useWorkspace()`): Pure pathname-based derivation. No state, no context overhead.
- **Feature flag**: `uxSuiteNavigationV1` (enabled in MockDataService). `uxEnhancedNavigationV1` REMOVED.
- **PillarTabBar DELETED** — fully replaced by AppLauncher.

**Route Structure (Phase 3)**
5 workspace route files under `tanstack/router/workspaces/`: `routes.hub.tsx`, `routes.preconstruction.tsx`, `routes.operations.tsx`, `routes.sharedservices.tsx`, `routes.admin.tsx`. 7 old batch files deleted. URL redirects: `/marketing` → `/shared-services/marketing`, `/accounting-queue` → `/shared-services/accounting`.

- **Late-Router rendering audit rule**: Backing files MUST exist and compile before import is added to AppShell. Any broken provider kills the route outlet.
- **useFullScreen.toggleFullScreen must have stable identity**: Uses `isFullScreenRef.current` (ref) instead of state closure.
- **No keyed `<main>`**: ShellHydrationOverlay + routeTransition CSS handle visual transition.
- All future work follows `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.

See `CODE_ARCHITECTURE_GUIDE.md` for full folder and dependency rules.

---

## §5 Roles & Permissions Matrix (Locked 22 Feb 2026)

Core roles (6 total – config-driven via IRoleConfiguration, Phase 2 COMPLETE):
- Admin: Full system control (site provisioning, user management, feature flags, defaults, audit logs).
- Business Development Manager: Lead creation, Go/No-Go workflow.
- Estimating Coordinator: New Job Number Requests, Estimate Tracking Log, Project Turnover.
- Project Manager: Buyout Log & Contract Approvals, Schedule tasks, Constraints Log.
- Leadership: Global read/write access to ALL projects and ALL departments.
- Project Executive: Scoped access ONLY to assigned projects and assigned departments.

Permission model: Configuration-driven via IRoleConfiguration (SP list-backed). RoleConfigurationPanel in AdminPanel provides zero-code CRUD for roles and default permissions. LEGACY_ROLE_MAP normalizes all 14 prior RoleName values to 6 canonical roles. RoleGate enhanced with bidirectional normalization. SOC2 audit snapshots on every mutation.

Cross-reference: §18 Roadmap (Phase 2), §21, §22, `.claude/plans/hbc-stabilization-and-suite-roadmap.md`, `.claude/skills/permission-system/SKILL.md`.

---

## §7 Service Methods Status (Live)

**Total methods**: 266
**Implemented**: 266
**Remaining stubs**: 0 — **DATA LAYER COMPLETE** (9 Phase 1 provisioning + 7 Phase 2 role configuration methods added)

Last major additions: Phase 2 Role Configuration Engine (Feb 22) — getRoleConfigurations, getRoleConfiguration, createRoleConfiguration, updateRoleConfiguration, deleteRoleConfiguration, seedDefaultRoleConfigurations, resolveRolePermissions.

---

## §15 Current Phase Status (Active)

**Focus (Feb 2026):** Stabilization & Modular Suite Transition.
- Phase 0: Blueprint Lockdown — **COMPLETE** (22 Feb 2026).
- Phase 0.5: Pluggable Data Backend Preparation — **COMPLETE** (22 Feb 2026).
- Phase 1: SharePoint Site Provisioning Engine — **COMPLETE** on `feature/hbc-suite-stabilization`. SiteProvisioningWizard + SiteDefaultsConfigPanel + EntraIdSyncService + SOC2 audit snapshots + 9 new IDataService methods (259 total) + 33 new Jest tests.
- Phase 2: New Role & Permission System — **COMPLETE** on `feature/hbc-suite-stabilization`. IRoleConfiguration + LEGACY_ROLE_MAP + RoleGate normalization + RoleConfigurationPanel + 7 new IDataService methods (266 total) + 35 new Jest tests.
- Phase 3: Navigation Overhaul + Router/Data Reconstruction — **COMPLETE** on `feature/hbc-suite-stabilization` (22 Feb 2026). AppLauncher + ContextualSidebar + 5 workspace route files + adapter hooks rewritten + PillarTabBar deleted + TanStackAdapterBridge removed. 752 tests passing.

---

## §16 Active Pitfalls & Rules (Lean – Reference Only)

- **Router singleton — NEVER recreate:** `useRef` in `router.tsx`. Dynamic values via `router.update()` + `RouterProvider context={}`. Adding dynamic values to creation deps causes full-app freeze.
- Always use `columnMappings.ts` — never hard-code column names.
- Call `this.logAudit()` on every mutation.
- Use `_getProjectWeb()` for project-site lists.
- Cross-reference guides: `PERFORMANCE_OPTIMIZATION_GUIDE.md`, `UX_UI_PATTERNS.md`, `FEATURE_DEVELOPMENT_BLUEPRINT.md`, `CODE_ARCHITECTURE_GUIDE.md`, `TESTING_STRATEGY.md`, `DATA_LAYER_GUIDE.md`, `SECURITY_PERMISSIONS_GUIDE.md`, `SKILLS_OVERVIEW.md`, project memory (`MEMORY.md`).
- **useAppNavigate** — ref-stable callback (empty deps). No `startTransition` wrapper. TanStack Router handles transitions natively. Double-wrapping `startTransition` causes React concurrent scheduler deadlock with `useSyncExternalStore`.
- **useFullScreen.toggleFullScreen — ref-stable**: Uses `isFullScreenRef.current` (ref) instead of state closure.
- **EnhancedProjectPicker uses Fluent Popover** (portal-based) — never Dialog. Popover `onOpenChange` closes before `startTransition(() => onSelect(project))`.
- **useNavProfile localStorage key**: `hbc:nav-profile:{email}` — scope to user email. Max 5 recent (FIFO), unlimited favorites.
- **ShellHydrationOverlay**: dismiss via `useIsFetching`. Minimum 200ms display.
- **ARIA live regions**: MacBarStatusPill `aria-live="polite"`, ShellHydrationOverlay `aria-live="assertive"`.
- **Dev toggle (devNavOverride)**: Only when `dataServiceMode === 'mock'`. Toggles `uxSuiteNavigationV1` behavior.
- **AppShell must not import non-existent modules**: Always create files FIRST, then import.
- **NavigationSidebar filter callbacks must be useCallback**: Prevents re-render cascade through NAV_STRUCTURE.map().
- **insightsItems useMemo must use primitive deps**: Extract boolean flag before useMemo.
- **isFeatureEnabled** uses `[featureFlags, userRoles]` deps — stable across permission-only updates.
- **RouterProvider context is memoized**: `useMemo` prevents unnecessary `router.update()` calls.
- **workspaceConfig.ts is single source of truth**: New workspaces/sidebar items added via config only, never hard-coded.
- **Workspace route files**: `routes.{hub,preconstruction,operations,sharedservices,admin}.tsx` — each exports a factory that takes rootRoute. All routes use absolute paths.
- **uxSuiteNavigationV1** is the sole nav feature flag. `uxEnhancedNavigationV1` REMOVED.
- **PillarTabBar DELETED** — zero references remain. Never recreate.
- **TanStackAdapterBridge DELETED** — adapter hooks use TanStack Router directly. Never recreate.
- **RouterAdapterContext DELETED** — never recreate.
- All changes must reference `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.

**Keep CLAUDE.md lean** — archive aggressively to CLAUDE_ARCHIVE.md.

---

## §17 Stakeholder Requirements & Vision (Locked 22 Feb 2026)

Core functionality, data/backend, performance, UX/roles, future vision, and constraints as captured in owner interview (22 Feb 2026). SharePoint provisioning highest priority (by 31 Mar 2026). Gen 1–3 path locked. MVP <2 months, full scope + Procore/BambooHR <6 months.

---

## §18 Stabilization & Multi-Generation Roadmap (Locked 22 Feb 2026)

Phase 0: Blueprint Lockdown (complete).  
Phase 0.5: Pluggable Data Prep (parallel, 3–5 days).  
Phase 1: SharePoint Site Provisioning (by 31 Mar 2026).  
Phase 2: New Role & Permission System (by 5 Apr 2026).  
Phase 3: Navigation Overhaul + Clean Router & Data Layer Reconstruction + MVP (mid-Apr 2026).  
Phase 4: Full Features + Integrations (end-Aug 2026).  

Master reference: `.claude/plans/hbc-stabilization-and-suite-roadmap.md`

§18.1 Branching Strategy (Locked 22 Feb 2026)
All Stabilization & Suite Transition work (Phases 0–4) occurs on the dedicated branch `feature/hbc-suite-stabilization`.  
Main branch remains stable for hotfixes only.  
Merge to main only after owner + rollout team approval and full verification gates.
Cross-reference: `.claude/plans/hbc-stabilization-and-suite-roadmap.md`
Phase 0.5 committed on `feature/hbc-suite-stabilization` — DataProviderFactory, adapter skeletons, 13 Jest tests.
Phase 1 committed on `feature/hbc-suite-stabilization` — Site Provisioning Engine with EntraIdSyncService, SOC2 audit snapshots, wizard UI, 33 tests.
Phase 2 committed on `feature/hbc-suite-stabilization` — Role Configuration Engine with IRoleConfiguration, LEGACY_ROLE_MAP, RoleGate normalization, RoleConfigurationPanel, 35 tests.
Phase 3 committed on `feature/hbc-suite-stabilization` — Navigation Overhaul + Router Reconstruction. AppLauncher, ContextualSidebar, 5 workspace route files, adapter hooks rewritten, PillarTabBar deleted, TanStackAdapterBridge removed, 752 tests.

---

## §19 Data Migration & Pluggable Backend Strategy (Locked 22 Feb 2026)

IDataService abstraction preserved (250 methods). Phase 0.5 **COMPLETE**:
- `DataProviderFactory` (`packages/hbc-sp-services/src/factory/`) reads `VITE_DATA_SERVICE_BACKEND` env var (sharepoint | azuresql | dataverse), defaults to sharepoint.
- `AzureSqlDataService` + `DataverseDataService` skeletons (`packages/hbc-sp-services/src/adapters/`) use Proxy-based `createNotImplementedService` — throws `NotImplementedError` for all 250 methods.
- `NotImplementedError` custom error with backend + method metadata.
- Factory is additive — existing direct instantiation unchanged. Factory wiring into UI deferred to Phase 3.
- Enables Gen 2 (Azure SQL desktop) and Gen 3 (Dataverse mobile) without UI/business logic refactoring.

---

## §20 Application Suite Strategy (Phase 3 COMPLETE — 22 Feb 2026)
Central Analytics Hub + 4 departmental workspaces (IMPLEMENTED):
- **Preconstruction** (`/preconstruction/*`, `/lead/*`, `/job-request/*`) — BD, Estimating, IDS hubs
- **Operations** (`/operations/*`) — Project Hub, Commercial Ops, Safety, QC & Warranty sub-groups
- **Shared Services** (`/shared-services/*`) — Marketing, Accounting, HR (placeholder), Risk Management (placeholder)
- **Admin** (`/admin/*`) — Admin Panel, Performance, Application Support, Telemetry
- **QA/QC & Safety** — workspace defined in config, mobile-first treatment deferred to Phase 4
All driven by `workspaceConfig.ts` — single source of truth. Cross-ref §4 and §21.

---

## §21 Navigation & Suite UX Architecture (Phase 3 COMPLETE — 22 Feb 2026)

**PillarTabBar DELETED.** Replaced by:
- **AppLauncher** (`components/navigation/AppLauncher.tsx`): Fluent UI Menu/MenuPopover in header. Grid of workspace tiles. RoleGate per tile.
- **ContextualSidebar** (`components/navigation/ContextualSidebar.tsx`): Workspace-aware sidebar driven by `useWorkspace()` hook. EnhancedProjectPicker always-on. NavPrimitives extracted from old NavigationSidebar.
- **NavigationSidebar**: Legacy fallback (basic ProjectPicker, role-based groups, no pillar filtering).
- **MobileBottomNav**: Workspace tabs + project pill bottom sheet. Uses `LAUNCHER_WORKSPACES` from workspaceConfig.
- Feature flag: `uxSuiteNavigationV1` gates AppLauncher + ContextualSidebar. `uxEnhancedNavigationV1` REMOVED.

---

## §22 Router & Data Layer Reconstruction (Phase 3 COMPLETE — 22 Feb 2026)

Clean-slate rebuild DONE:
- **Adapter hooks** (`useAppNavigate`, `useAppLocation`, `useAppParams`) use TanStack Router hooks directly. Ref-stable, memoised. No bridge, no adapter context.
- **TanStackAdapterBridge** DELETED. **RouterAdapterContext** DELETED.
- **Route tree**: 5 workspace files (`workspaces/routes.{hub,preconstruction,operations,sharedservices,admin}.tsx`). 7 old batch files deleted. Factory pattern: each exports `create*WorkspaceRoutes(rootRoute)`.
- **URL redirects**: `/marketing` → `/shared-services/marketing`, `/accounting-queue` → `/shared-services/accounting`.
- **MemoryRouter** (test utility): Uses real TanStack Router with `createMemoryHistory` + `TestChildrenContext` pattern.
- **62 total routes**: 58 original + 2 redirects + 2 new placeholders (HR, Risk Management).

---

## §23 Enterprise App Shell Patterns (Locked 22 Feb 2026)

Reference architecture for Hub + Workspaces. All future development follows these patterns. See new Skills and master plan.

**For complete history, full method tables, and detailed past phases → see CLAUDE_ARCHIVE.md**