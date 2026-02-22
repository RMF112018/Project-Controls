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

**Last Updated:** 2026-02-22 — Owner-approved blueprint lockdown: 6-role model (Admin, Business Development Manager, Estimating Coordinator, Project Manager, Leadership (global), Project Executive (scoped)), Application Suite architecture (Analytics Hub + Departmental Workspaces), PillarTabBar deprecated and to be fully removed, full clean-slate Router & Data Layer reconstruction, pluggable data strategy (Azure SQL / Dataverse readiness), Stabilization & Multi-Generation Roadmap locked in `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.

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
The TanStack Router instance MUST be created exactly once (via `useRef` in `router.tsx`) with static-only values (`queryClient`, `dataService`). Dynamic values (`currentUser`, `selectedProject`, `isFeatureEnabled`, `scope`) are injected via `React.useEffect` → `router.update()` + `RouterProvider context={}`. Adapter hooks (`useAppNavigate`, `useAppLocation`, `useAppParams`) return memoised/ref-stable values to prevent downstream re-render cascades. `ProjectPicker.handleSelect` MUST close the popover before firing `setSelectedProject` (via `React.startTransition` deferral). NEVER pass dynamic values to `createHbcTanStackRouter`. NEVER add dynamic values to any dependency array that would trigger router recreation.

- NavigationSidebar: `NavItemComponent` MUST be `React.memo` with stable `onNavigate` prop (never pass `() => navigate(path)` — pass `navigate` directly and let child invoke with its `path` prop). Route preloading via `router.preloadRoute()` on hover.

- **PillarTabBar must use `useAppNavigate`** — never `useTransitionNavigate`. The `useAppNavigate` hook returns a ref-stable callback (empty deps). PillarTabBar is `React.memo`; `visibleTabs` memoized via `useMemo`; click handler uses `data-path` attribute for stable identity (no per-button closures).
- **Late-Router rendering audit rule**: When adding new providers, contexts, or hooks to AppShell.tsx, the backing files MUST exist and compile before the import is added. Never commit phantom imports. The route tree's RootLayout renders AppShell which wraps `<Outlet />` — any broken provider in AppShell kills the entire route outlet.
- **useTransitionNavigate eliminated**: All consumers migrated to `useAppNavigate` (ref-stable, empty deps). `useTransitionNavigate.ts` deleted. If new navigation hooks are needed, extend `useAppNavigate`, never wrap it in startTransition.
- **TanStackAdapterBridge.stableNavigate MUST wrap in React.startTransition**: TanStack Router's Transitioner calls `setIsTransitioning(true)` synchronously BEFORE its internal `React.startTransition`. Without an outer `startTransition` from the caller, this forces a synchronous high-priority re-render mid-click-handler, causing `useSyncExternalStore` tearing with pending router `__store` mutations. This is NOT double-wrapping — nested `startTransition` calls are batched by React 18.
- **useFullScreen.toggleFullScreen must have stable identity**: Uses `isFullScreenRef.current` (ref) instead of `isFullScreen` (state) in its closure, so deps are `[enterFullScreen, exitFullScreen]` only. Without this, every toggle changes `toggleFullScreen` identity → AppContext.value recreated → cascade through all consumers.

**Navigation UX Architecture (uxEnhancedNavigationV1)**  
4-pillar tab bar (Hub|Precon|Ops|Admin) in AppShell header, driven by `PillarTabBar` component using `useAppNavigate` (ref-stable adapter). Sidebar filters NavGroups to active pillar. `EnhancedProjectPicker` replaces ProjectPicker behind feature flag — Fluent Popover with Recent/Favorites/All sections, fuzzy search, KPI hover preview via `ProjectPreviewPane`. `MacBarStatusPill` in header shows selected project health. `ShellHydrationOverlay` during project switch (max 400ms). `useNavProfile` hook manages localStorage favorites/recent. All gated by FeatureGate. No router creation changes.

- **No keyed main container**: `<main>` does NOT use `key={selectedProject?.projectCode}` — removed to prevent thundering-herd remount. ShellHydrationOverlay + routeTransition CSS provide visual feedback.
- **Region filter persistence**: useNavProfile manages favorites/recent in localStorage. EnhancedProjectPicker initializes from persisted values on open.

- Navigation: PillarTabBar (uxEnhancedNavigationV1) **deprecated and will be fully removed**. Replaced by Option 1 Global App Shell + Top App Launcher + Contextual Left Sidebar (see §21).  
- Router & Data Layer: Full clean-slate reconstruction per §22 (legacy TanStack migration patterns removed).  
- New reference: All future work follows `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.

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
- Phase 3: Navigation Overhaul + Router/Data Reconstruction — mid-Apr 2026.

All prior TanStack migration and PillarTabBar content remains for reference; new direction overrides per §§21–22.

---

## §16 Active Pitfalls & Rules (Lean – Reference Only)

- **Router singleton — NEVER recreate:** `TanStackPilotRouter` uses `useRef` to create the router once. Dynamic values injected via `router.update()` + `RouterProvider context={}`. Adapter hooks (`useAppNavigate`, `useAppLocation`, `useAppParams`) return memoised/ref-stable values. `ProjectPicker.handleSelect` closes popover before `startTransition(() => onSelect(project))`. Adding dynamic values to any dep array that creates the router will cause full-app freeze.
- **TanStackAdapterBridge:** `useMemo` for `adapterValue` must depend ONLY on primitive/stable values (`pathname`, `searchStr`, `params`). NEVER depend on `state.matches` — it changes reference on every router state transition and causes full-app re-render cascades via AppShell. The `navigate` function must be ref-backed (`useCallback` + `useRef`) for identity stability. `stableNavigate` MUST wrap `navigateRef.current()` in `React.startTransition()` — Transitioner's synchronous `setIsTransitioning(true)` causes store tearing without it.
- Always use `columnMappings.ts` — never hard-code column names.  
- Call `this.logAudit()` on every mutation.  
- Use `_getProjectWeb()` for project-site lists.  
- TanStack Query/Router/Table, React 18, bundle, and performance rules → `PERFORMANCE_OPTIMIZATION_GUIDE.md` + `spfx-performance-diagnostics-and-bundle`, `react-context-and-concurrent`, `tanstack-query-and-virtualization` Skills  
- UI/UX, Fluent styling, accessibility, and construction patterns → `UX_UI_PATTERNS.md`  
- New features, domains, schedule-v2 replacement → `FEATURE_DEVELOPMENT_BLUEPRINT.md` + schedule-* Skills  
- Architecture, layering, and dependencies → `CODE_ARCHITECTURE_GUIDE.md`  
- Testing, coverage, and a11y → `TESTING_STRATEGY.md`  
- IDataService, caching, mocks, PnP → `DATA_LAYER_GUIDE.md`  
- RBAC, permissions, guards, audit → `SECURITY_PERMISSIONS_GUIDE.md`  
- Full Skills index and triggers → `SKILLS_OVERVIEW.md`  
- Evolving decisions and session facts → project memory (`MEMORY.md`)  

- **useTransitionNavigate is DELETED — never recreate**: All navigation must use `useAppNavigate` (ref-stable, empty deps). The `startTransition` wrapper lives in `TanStackAdapterBridge.stableNavigate` — it is required because Transitioner calls `setIsTransitioning(true)` synchronously before its own `startTransition`. This is NOT double-wrapping; React 18 batches nested transitions. Never remove this wrapper.
- **useFullScreen.toggleFullScreen — ref-stable pattern**: Uses `isFullScreenRef.current` instead of `isFullScreen` closure. Deps are `[enterFullScreen, exitFullScreen]` only. This prevents `toggleFullScreen` identity change on every toggle, which would cascade through AppContext.value → all consumers.
- **PillarTabBar stability pattern**: `React.memo`; `visibleTabs` memoized via `useMemo([isPillarVisible])`; click handler uses `data-path` + single `useCallback` (no per-button closures). Tab bar reads `location.pathname` via `useAppLocation()` for active state.
- **EnhancedProjectPicker uses Fluent Popover** (portal-based) — never Dialog (would steal focus from sidebar context). Popover `onOpenChange` must close before `startTransition(() => onSelect(project))` to prevent click-outside race.
- **EnhancedProjectPicker keyboard nav**: Uses `useArrowNavigationGroup({ axis: 'vertical', circular: true })` from Fluent v9 tabster. Home/End jump to first/last. Escape closes popover.
- **Favorites reorder**: Move-up/move-down buttons (no DnD library). `IUserProfileService.reorderFavorites()` persists order to localStorage. Zero new npm deps.
- **EnhancedProjectPicker region/division filters**: Only shown when projects have >1 unique region. Filters apply BEFORE fuzzy search to avoid empty-state confusion. Filters persist via INavProfile (not reset on close).
- **MacBarStatusPill pulse**: Uses Griffel keyframe animation with `@media (prefers-reduced-motion: reduce)` guard. Never pulse on Green health.
- **useNavProfile localStorage key**: `hbc:nav-profile:{email}` — always scope to user email. Max 5 recent (FIFO), unlimited favorites.
- **ShellHydrationOverlay**: dismiss via `useIsFetching` (never global). Minimum 200ms display to prevent flash.
- **MacBarStatusPill skeleton with name**: Shows selectedProject.projectName (already set optimistically by onMutate) truncated to 16 chars. Falls back to generic skeleton if selectedProject is null during switch.
- **Region filter persistence**: Persisted in same INavProfile localStorage object. Reset to null means "All Regions" — never remove the key, set to null explicitly.
- **uxEnhancedNavigationV1 default ON**: MockDataService sets `Enabled: true`. SharePoint/standalone modes read from SP list (admin-controlled). Dev toggle in AppShell allows bidirectional override in mock mode only.
- **Dev toggle (devNavOverride)**: Only available when `dataServiceMode === 'mock'`. Replaces FeatureGate for nav components in AppShell only — child components like NavigationSidebar still use their own isFeatureEnabled checks.
- **ARIA live regions on project switch**: MacBarStatusPill uses `aria-live="polite"`, ShellHydrationOverlay uses `aria-live="assertive"`. Never use "assertive" on frequently-changing elements — overlay is transient (200ms-400ms max).
- **setSelectedProject skipSwitchingFlag**: KPI enrichment in `onSuccess` uses `{ skipSwitchingFlag: true }` to avoid restarting the isProjectSwitching timer. Only the initial optimistic call in `onMutate` sets the switching flag.
- **Permission re-resolution debounced**: 300ms debounce on `selectedProject?.projectCode` (primitive dep, not object ref). Prevents third AppContext cascade on project switch.
- **No keyed `<main>`**: Removed `key={selectedProject?.projectCode}` to prevent thundering-herd query refetch on project switch. ShellHydrationOverlay + routeTransition CSS handle the visual transition.
- **AppShell must not import non-existent modules**: Never add imports for files/exports that don't exist yet. Commit 8bc978f introduced imports for MobileBottomNav, useSwitchProject, NavigationServicesContext, and ProjectService/UserProfileService before those files were created, preventing compilation and killing the route outlet. Always create files FIRST, then import.
- **NavigationSidebar filter callbacks must be useCallback**: `isGroupVisible`, `isItemVisible`, `isActivePath` must be wrapped in React.useCallback to prevent unstable function references from triggering downstream re-renders through NAV_STRUCTURE.map() iterations.
- **insightsItems useMemo must use primitive deps**: Extract `isHelpSystemEnabled = isFeatureEnabled('EnableHelpSystem')` as a boolean before the useMemo. Never pass `isFeatureEnabled` function ref as a useMemo dependency — its identity changes on featureFlags/userRoles updates.
- **isFeatureEnabled uses `userRoles` not `currentUser`**: Deps are `[featureFlags, userRoles]` where `userRoles = currentUser?.roles`. The roles array reference is stable across permission-only updates, preventing identity cascade through routerProps → RouterProvider → entire route tree.
- **RouterProvider context is memoized**: `useMemo` on the context object prevents RouterProvider from calling `router.update()` on every render. No separate useEffect for router.update() — RouterProvider handles it during render.
- **envConfig useEffect uses boolean dep**: `permissionEngineEnabled` (primitive) instead of `isFeatureEnabled` (function ref) prevents unnecessary re-fetches.

- PillarTabBar: Fully deprecated — remove all references during Phase 3.  
- TanStack migration wiring: Legacy adapters and complex patterns declared obsolete per §22. Use clean declarative loaders only.  
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

---

## §19 Data Migration & Pluggable Backend Strategy (Locked 22 Feb 2026)

IDataService abstraction preserved (250 methods). Phase 0.5 **COMPLETE**:
- `DataProviderFactory` (`packages/hbc-sp-services/src/factory/`) reads `VITE_DATA_SERVICE_BACKEND` env var (sharepoint | azuresql | dataverse), defaults to sharepoint.
- `AzureSqlDataService` + `DataverseDataService` skeletons (`packages/hbc-sp-services/src/adapters/`) use Proxy-based `createNotImplementedService` — throws `NotImplementedError` for all 250 methods.
- `NotImplementedError` custom error with backend + method metadata.
- Factory is additive — existing direct instantiation unchanged. Factory wiring into UI deferred to Phase 3.
- Enables Gen 2 (Azure SQL desktop) and Gen 3 (Dataverse mobile) without UI/business logic refactoring.

---

## §20 Application Suite Strategy (Locked 22 Feb 2026, updated with owner child-app outline)
Central Analytics Hub + 4 departmental workspaces:
- Preconstruction
- Operations
- Share Services
- QA/QC & Safety (mobile-first)
Top Fluent UI App Launcher grid + contextual Left Sidebar per workspace. Cross-ref master plan and §21.

---

## §21 Navigation & Suite UX Architecture (Locked 22 Feb 2026)

PillarTabBar deprecated and will be fully removed. New: Global App Shell + Top Fluent UI App Launcher (grid) + Contextual Left Sidebar (Option 1). Mobile drawer + bottom nav.

---

## §22 Router & Data Layer Reconstruction (Locked 22 Feb 2026 – Critical)

Full clean-slate rebuild of TanStack Router wiring and data consumption. Legacy migration patterns removed. Declarative loaders and stable Context providers only.

---

## §23 Enterprise App Shell Patterns (Locked 22 Feb 2026)

Reference architecture for Hub + Workspaces. All future development follows these patterns. See new Skills and master plan.

**For complete history, full method tables, and detailed past phases → see CLAUDE_ARCHIVE.md**