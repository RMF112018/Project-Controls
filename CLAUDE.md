---
name: CLAUDE.md | description: Master blueprint, live status, and central coordinator for HBC Project Controls SPFx application | triggers: all | updated: 2026-02-24
---

**CLAUDE.md — HBC Project Controls Blueprint (Lean Edition)**

**Performance Rule (Critical)**  
This file must stay under 40,000 characters. Never allow it to grow large again. When it approaches the limit, archive older content to CLAUDE_ARCHIVE.md.

**Update Rules (Mandatory)**  
- After every completed data service chunk → update §7 and §15  
- After major architecture/pattern changes → update relevant sections (§4, §16, §21, §22)  
- After adding, consolidating, or updating .claude/ instruction files, Skills, or Plans → update §0 and §16  
- After every code change, evaluation, or session that touches the codebase → update this file AND maintain CHANGELOG.md in the root directory with a dated entry (format: ## [YYYY-MM-DD] - [Phase] - [Commit HASH] - [Summary]). **Explicit instruction: Maintain CHANGELOG.md in the root directory at all times**; it is the canonical human-readable change history companion to CLAUDE.md. Never commit without syncing CHANGELOG.md.  
- Always keep focused on: current status, active rules, verification gates, and live references.

For full historical phase logs (SP-1 through SP-7), complete 221-method table, old navigation, and detailed past pitfalls → see **CLAUDE_ARCHIVE.md**.

**Last Updated:** 2026-02-24 — Phase 6A Site Template Management & GitOps Sync COMPLETE. ISiteTemplate model, 8 new IDataService methods (276→284), TemplateSyncStatus enum, ProvisioningSaga Step 5 dual-path, Admin Site Templates tab (HbcTanStackTable + SlideDrawer), feature flag SiteTemplateManagement (id 60). site-template-management SKILL v1.0, provisioning-engine SKILL v1.3, resilient-data-operations SKILL v1.4. 19 new Jest tests + 9 Playwright E2E. ~940+ tests.

**MANDATORY:** After any code change that affects the data layer, architecture, performance, UI/UX, testing, or security, update this file, verify against the current sprint gate, confirm relevant Skills and the master plan were followed, update CHANGELOG.md (root), and check project memory before ending the session.

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
   - `.claude/skills/elevated-ux-ui-design/SKILL.md` ← **HBC Elevated UI/UX Design Skill** (Mandatory for ALL UI/UX tasks. Enforces elevation from 2/10 enterprise baseline to refined 4.75/10 premium construction-tech experience. Always cross-reference `UX_UI_PATTERNS.md`.)

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
- Data Layer: `@hbc/sp-services` (284/284 methods – complete)  
- Routing: TanStack Router v1 (hash history – sole runtime router)  
- Data Fetching: TanStack Query v5 (Wave-1 complete on core domains)  
- Workflow Orchestration: xstate v5 + @xstate/react (lazy-loaded via `lib-xstate-workflow` chunk)  
- Workflow Rollout Flag: `WorkflowStateMachine` (default OFF; dual-path UI during Phase 5B stabilization)  
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
- **HeaderUserMenu (consolidated 2026-02-24)**: Fluent UI v9 Menu + Persona in header-right. Contains user display, version/What's New link, and gated dev tools (role switcher + mode toggle). Floating MOCK MODE panel removed. Dev tools visible only when `devToolsConfig` provided (dev server only).

**Router Stability Rule (Critical)**  
The TanStack Router instance MUST be created exactly once (via `useRef` in `router.tsx`) with real initial prop values. Dynamic value changes injected via `router.update()` in a `useEffect` — NEVER via `RouterProvider context={}` prop. The `context` prop causes `RouterContextProvider` to call `router.update()` synchronously during render, creating infinite re-render loops when routes have async loaders (`ensureQueryData`). NEVER pass dynamic values to any dep array that triggers router recreation.

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

**Total methods**: 284
**Implemented**: 284
**Remaining stubs**: 0 — **DATA LAYER COMPLETE**

Last major additions: Phase 6A Site Template Management (Feb 2026) — +8 new IDataService methods: getSiteTemplates, getSiteTemplateByType, createSiteTemplate, updateSiteTemplate, deleteSiteTemplate, syncTemplateToGitOps, applyTemplateToSite, syncAllTemplates. Feature flag: SiteTemplateManagement (id 60). TemplateSyncStatus enum + EntityType.SiteTemplate + 3 AuditActions. ProvisioningSaga Step 5 dual-path. Admin UI tab with HbcTanStackTable + SlideDrawer. 19 new Jest tests.

Phase 5D Cross-cutting Governance (Feb 2026) — No new IDataService methods. GraphBatchEnforcer (10ms coalescence, threshold 3, feature-gated GraphBatchingEnabled). ListThresholdGuard utility (warn at 3000, force cursor paging at 4500 for Audit_Log). Coverage ramp to 80/60/70/80. SECURITY_ANALYSIS.md + DATA_ARCHITECTURE.md created. Connector + provisioning E2E specs. ~20 new Jest tests (~857 total).

Phase 5A.1 Connector Resilience Adoption (Feb 2026) — No new IDataService methods. Full GraphBatchEnforcer adapter wiring (ProcoreAdapter, BambooHRAdapter accept optional enforcer). Universal useConnectorMutation across all 8 connector mutation sites. ConnectorRegistry policy enforcement at registration (fail-fast). 3 new AuditActions (RetryAttempt, CircuitBreak, BatchFallback). 12 new Jest tests + 6 Playwright E2E. resilient-data-operations SKILL v1.3. ~900+ tests.

Phase 5B Workflow State Machines + E2E Coverage (Feb 2026) — No new IDataService methods. xstate v5 machines (goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine), WorkflowMachineFactory (lazy chunk lib-xstate-workflow), useWorkflowMachine/useWorkflowTransition hooks, optimistic TanStack Query integration, dual-path WorkflowStateMachine flag (default OFF, zero drift). Playwright workflow E2E (8 scenarios). ~920+ tests.

---

## §15 Current Phase Status (Active)

**Focus (Feb 2026):** Stabilization & Modular Suite Transition.  
- Phase 0: Blueprint Lockdown — **COMPLETE** (22 Feb 2026).  
- Phase 0.5: Pluggable Data Backend Preparation — **COMPLETE** (22 Feb 2026).  
- Phase 1: SharePoint Site Provisioning Engine — **COMPLETE** on `feature/hbc-suite-stabilization`. SiteProvisioningWizard + SiteDefaultsConfigPanel + EntraIdSyncService + SOC2 audit snapshots + 9 new IDataService methods (259 total) + 33 new Jest tests.  
- Phase 2: New Role & Permission System — **COMPLETE** on `feature/hbc-suite-stabilization`. IRoleConfiguration + LEGACY_ROLE_MAP + RoleGate normalization + RoleConfigurationPanel + 7 new IDataService methods (266 total) + 35 new Jest tests.  
- Phase 3: Navigation Overhaul + Router/Data Reconstruction — **COMPLETE** on `feature/hbc-suite-stabilization` (22 Feb 2026). AppLauncher + ContextualSidebar + 5 workspace route files + adapter hooks rewritten + PillarTabBar deleted + TanStackAdapterBridge removed. 752 tests passing.  
- Phase 4: Full Features — **IN PROGRESS**. Phase 4F: Analytics Hub Dashboard BUILT — AnalyticsHubDashboardPage at `/` with 5 KPI cards, 6 interactive ECharts (pipeline funnel, status treemap, win rate trend, resource heatmap, labor rate benchmark, material cost index), recent activity feed, role-gated workspace quick links, PowerBI embed placeholder. Feature flag: PowerBIIntegration (disabled). FunnelChart + TreemapChart registered in ECharts theme. Phase 4F-precon: Preconstruction + Estimating Dashboards BUILT — PreconDashboardPage rebuilt (4 KPIs + 3 charts: lead funnel, win rate by PE, autopsy trend). EstimatingDashboardPage rebuilt (5 KPIs + 3 charts: award status donut, source distribution, estimator workload). Both elevated to 4.75/10 with data hooks (`usePreconDashboardData`, `useEstimatingDashboardData`). PowerBI placeholder behind FeatureGate. Phase 4G: Department Tracking BUILT — DepartmentTrackingPage at `/preconstruction/estimating/tracking` with 3 tabs (Estimate Tracking Log, Current Pursuits, Current Preconstruction), all fields inline-editable (text/number/date/checkbox/dropdown), 8 Estimating/BIM Checklist items as individual checkbox columns in Current Pursuits, SlideDrawer for new entry creation, RoleGate on edit controls. Feature flag: EstimatingDepartmentTracking. 14 new Jest tests. Admin workspace BUILT (12 routes). Preconstruction workspace BUILT (20 routes — Phase 4E: Project Number Requests, Phase 4G: Department Tracking). Operations workspace BUILT (47 routes, 45 pages, 6 sidebar groups). Shared Services workspace BUILT (25 routes, 24 pages, 5 sidebar groups). HB Site Control workspace BUILT (16 routes, 15 pages, 3 sidebar groups). Project Hub workspace BUILT (37 routes, 36 pages, 10 sidebar groups — requireProject: true, feature flag: ProjectHubWorkspace). ConnectorManagementPanel BUILT. 688 tests passing.  
- Phase 5B: Workflow State Machines + E2E Coverage — **COMPLETE** on `feature/hbc-suite-stabilization`. xstate v5 machines (goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine), WorkflowMachineFactory lazy-loading, useWorkflowMachine/useWorkflowTransition hooks, optimistic integration, dual-path WorkflowStateMachine flag (default OFF), Playwright workflow E2E (8 scenarios). TanStack Router actions skipped. ~920+ tests.  
- Phase 5C: Provisioning Saga + SignalR Status Hub — **COMPLETE** on `feature/hbc-suite-stabilization`. ProvisioningSaga orchestrator (7-step reverse-order compensation, 6 new IDataService methods: deleteProjectSite, removeProvisionedLists, disassociateFromHubSite, deleteProjectSecurityGroups, removeTemplateFiles, removeLeadDataFromProjectSite). Idempotency tokens (projectCode::timestamp::hex4). IProvisioningStatusMessage SignalR channel + useProvisioningStatus hook. ProvisioningStatusStepper (Fluent UI v9, motionToken animations 150-250ms, prefers-reduced-motion, role-aware contrast). ProvisioningPage expandable stepper behind FeatureGate. lib-signalr-realtime webpack chunk. ProvisioningStatus.Compensating + 3 saga AuditActions. Feature flag: ProvisioningSaga (default OFF). 149 new Jest tests + 1 Playwright E2E (837 total).  
**Evaluation note (2026-02-24):** 9.1/10 at commit 001966664060b89aeb16046b29363669ca5487d3. Gating item resolved: full CHANGELOG.md + CLAUDE.md sync enforced.
- Phase 5D: Cross-cutting Quality & Governance — **COMPLETE** on `feature/hbc-suite-stabilization`. GraphBatchEnforcer (10ms coalescence, threshold 3, feature flag GraphBatchingEnabled id 58). ListThresholdGuard (3000 warn, 4500 force-page). Coverage ramp 80/60/70/80. SECURITY_ANALYSIS.md + DATA_ARCHITECTURE.md created. Connector E2E (5 tests) + expanded provisioning E2E (+2 tests). resilient-data-operations SKILL v1.2. ~857 tests passing.
- Phase 5D.1: Fidelity Cleanup + HeaderUserMenu Consolidation — **COMPLETE** on `feature/hbc-suite-stabilization`. Floating dev/RoleSwitcher.tsx removed. HeaderUserMenu (Fluent UI v9 Menu + Persona) in AppShell header. IDevToolsConfig prop chain. Playwright roleFixture rewritten (select → MenuItemRadio). 8 new Jest tests. 888 tests passing.
- Phase 5A.1: Connector Resilience Adoption — **COMPLETE** on `feature/hbc-suite-stabilization`. Full GraphBatchEnforcer adapter wiring (optional enforcer constructor), universal useConnectorMutation (8 sites), ConnectorRegistry policy enforcement (fail-fast), 3 new AuditActions (RetryAttempt, CircuitBreak, BatchFallback). resilient-data-operations SKILL v1.3. 12 Jest + 6 Playwright tests. ~900+ tests.
- Phase 5C.1: Provisioning Saga Resilience Integration — **COMPLETE**. GraphBatchEnforcer and ListThresholdGuard wired into saga steps, E2E expansion, SKILL.md updates.
- Phase 6A: Site Template Management & GitOps Sync — **COMPLETE** on `feature/hbc-suite-stabilization`. ISiteTemplate model + SiteTemplateType union. TemplateSyncStatus enum (Idle/Syncing/Success/Failed). 3 new AuditActions (TemplateSyncStarted/Completed/Failed) + EntityType.SiteTemplate. Feature flag SiteTemplateManagement (id 60, default OFF, SuperAdmin-only). 8 new IDataService methods (276→284). SITE_TEMPLATES_COLUMNS + HUB_LISTS.SITE_TEMPLATES + CACHE_KEYS. MockDataService + SharePointDataService implementations. IProvisioningInput.templateName for dual-path saga Step 5. ProvisioningPage TabList with "Provisioning Logs" + "Site Templates" tabs. HbcTanStackTable + SlideDrawer for template CRUD. site-template-management SKILL v1.0. provisioning-engine SKILL v1.3. resilient-data-operations SKILL v1.4. 19 new Jest + 9 Playwright E2E tests. ~940+ tests.
- Phase 7 Stage 2: Performance Optimization for Construction-Scale Data — **COMPLETE** on `feature/hbc-suite-stabilization`. Construction-scale benchmark generators (Buyout 500, Audit 5000, Estimating 300, Schedule 1000, Leads 200) with seeded PRNG. MockDataService `benchmarkMode`. Per-domain QUERY_GC_TIMES + INFINITE_QUERY_MAX_PAGES. MemoizedTableRow (React.memo + custom equality). React 18 concurrent: useTransition (sort/filter/group), useDeferredValue (globalFilter). Adaptive overscan in useVirtualRows. HbcEChart large/progressiveRender/sampling props. usePerformanceMarker hook. 3 SKILL.md v1.1 updates. 43 new tests (26 generator + 8 cache + 6 table perf + 3 hook) + 4 Playwright E2E. ~980+ tests.

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
- **RouterProvider context prop causes infinite render loop**: NEVER pass `context` to `RouterProvider`. Use `useEffect` + `router.update()`. The render-phase `router.update()` in `RouterContextProvider` creates new `options` objects on every render, which when combined with async loader pending state triggers infinite re-render via `useSyncExternalStore`. See `router.tsx`.  
- **workspaceConfig.ts is single source of truth**: New workspaces/sidebar items added via config only, never hard-coded.  
- **Workspace route files**: `routes.{hub,preconstruction,operations,sharedservices,admin,sitecontrol,projecthub}.tsx` — each exports a factory that takes rootRoute. All routes use absolute paths.  
- **uxSuiteNavigationV1** is the sole nav feature flag. `uxEnhancedNavigationV1` REMOVED.  
- **PillarTabBar DELETED** — zero references remain. Never recreate.  
- **TanStackAdapterBridge DELETED** — adapter hooks use TanStack Router directly. Never recreate.  
- **RouterAdapterContext DELETED** — never recreate.  
- All changes must reference `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.  
- **PermissionEngine + TOOL_DEFINITIONS dual-path**: When PermissionEngine flag is enabled, `resolveUserPermissions()` resolves permissions from `TOOL_DEFINITIONS` + permission templates — NOT `ROLE_PERMISSIONS`. New permission strings MUST be added to BOTH `ROLE_PERMISSIONS` (fallback) AND `TOOL_DEFINITIONS` + `permissionTemplates.json` (engine path). Missing either causes "Access Denied".  
- **Workflow machine guards must check permission keys, not role labels**: guard logic must use `context.userPermissions` + `PERMISSIONS` constants; role-name checks alone are invalid.  
- **Workflow transitions are mutation-coupled**: never call machine `send()` before `mutateAsync()` success; on mutation error, retain prior machine state and rollback optimistic cache.  
- **WorkflowStateMachine flag discipline**: keep legacy imperative behavior intact when flag is OFF; no hidden behavior drift in OFF mode.  
- **xstate import policy**: UI components may consume `useWorkflowMachine` hooks only; direct machine imports from page components are disallowed to avoid bundle regression.  
- **Router actions exclusion**: TanStack Router actions are intentionally skipped for workflow state transitions in Phase 5B.  
- **Fluent UI v9 Drawer**: Import from `@fluentui/react-drawer`, NOT `@fluentui/react-components` (v9.46 doesn't re-export Drawer components).  
- **ContextualSidebar accordion useEffect deps**: `[workspace?.id]` only — intentionally excludes `filteredGroups` and `isActivePath` to avoid re-running on every pathname change. `eslint-disable-line react-hooks/exhaustive-deps` on that line.  
- **UI/UX Elevation Rule (Critical – Mandatory):** For every UI component, page layout, dashboard, data table, form, navigation element, motion treatment, or visual design task, **immediately activate and strictly follow** `.claude/skills/elevated-ux-ui-design/SKILL.md`. Default exclusively to the 4.75/10 elevated patterns (Fluent UI v9 + Griffel). Pure 2/10 baseline Fluent designs are disallowed without explicit user approval and `uiElevatedExperienceV1` feature-flag gating. Always synchronize with `UX_UI_PATTERNS.md`.  
- **ProvisioningSaga compensation order is strict reverse**: compensate() iterates completedSteps sorted descending. Step 1 (site deletion) always runs LAST. Never reorder.  
- **Compensation failures are logged but NEVER thrown**: Every catch in compensate() logs to audit + pushes to compensationResults. No re-throw. Manual intervention alert for critical step failures.  
- **ProvisioningSaga feature flag discipline**: When flag OFF, legacy runSteps() unchanged. No hidden behavior drift. Same pattern as WorkflowStateMachine.  
- **IProvisioningStatusMessage is a separate SignalR type**: Do NOT reuse IEntityChangedMessage. Provisioning has step-level granularity (stepStatus, progress %).  
- **useProvisioningStatus filters by projectCode client-side**: Server-side group filtering deferred to Phase 6.  
- **lib-signalr-realtime chunk**: @microsoft/signalr dynamically imported in SignalRService.ts. Never import statically. cacheGroup at priority 20.  
- **Idempotency token format**: `${projectCode}::${ISO}::${4-byte-hex}`. Stored on IProvisioningLog.idempotencyToken.  
- **getStepState() check order**: compensating MUST be checked BEFORE completedSteps.includes — during rollback, a step can be in completedSteps array but actively compensating.  
- **HeaderUserMenu data-testid**: `data-testid="role-switcher"` on wrapper div — preserved for Playwright fixture compat.
- **Dev tools in header**: Role switcher relocated from floating dev/RoleSwitcher.tsx to HeaderUserMenu. IDevToolsConfig flows: dev/index.tsx → IAppProps → AppContext → HeaderUserMenu. Never import dev/ in src/.
- **No floating dev panels**: z-index 9999 floating elements are prohibited. All dev tools live in HeaderUserMenu.
- **CHANGELOG.md Maintenance (Critical)**: Root CHANGELOG.md must be updated on every commit or evaluation. Format: `## [YYYY-MM-DD] - [Phase] - [Commit] - [Summary]`. Failure violates governance and blocks merge.
- **GraphBatchEnforcer coalescence window is 10ms**: Timer resets on every new enqueue. Threshold of 3 triggers immediate flush. When `GraphBatchingEnabled` OFF, zero overhead pass-through.
- **GraphBatchEnforcer is composition, not inheritance**: Wraps `GraphBatchService.executeBatch()`. Never extend or modify GraphBatchService for auto-batching.
- **ListThresholdGuard thresholds**: Warning at 3000, critical at 4500. SP hard limit is 5000. Guard is for SharePointDataService only — MockDataService skips threshold checks.
- **ListThresholdGuard + InfinitePagingEnabled dual-gate**: `shouldUseCursorPaging()` requires BOTH itemCount >= 4500 AND flag ON. Graceful degradation when flag OFF.
- **No new IDataService methods for Phase 5D**: GraphBatchEnforcer and ListThresholdGuard are infrastructure utilities, not data layer methods. Method count stays at 276.
- **ConnectorResilience** — All adapters MUST accept optional `graphBatchEnforcer` and route through `enqueue()`. ConnectorRegistry enforces `IConnectorRetryPolicy` at registration.
- **useConnectorMutation** — Sole mutation path for all connector write operations in UI; raw `dataService` mutation calls disallowed for connectors.
- **WorkflowStateMachine flag (Phase 5B)**: Legacy imperative path byte-for-byte identical when OFF. No hidden drift.
- **xstate import policy (enforced)**: UI components consume useWorkflowMachine/useWorkflowTransition hooks ONLY; direct machine.send() or machine imports from page components are disallowed.
- **Workflow transitions mutation-coupled (enforced)**: send() only after mutateAsync() success; on failure, retain prior state and rollback optimistic cache.
- **ProvisioningSaga resilience (Phase 5C.1)**: All Graph calls in saga steps MUST use graphBatchEnforcer.enqueue(). ListThresholdGuard applied to audit logs.
- **SiteTemplateManagement flag discipline (Phase 6A)**: Flag id 60, default OFF. Admin tab wrapped in FeatureGate. Saga dual-path: UI passes `templateName` only when flag ON; saga itself is flag-agnostic.
- **applyTemplateToSite Default fallback**: Falls back to Default when requested type not found (SOC2 audit). No active Default → throws → saga Step 5 fails → compensation triggered.
- **ProvisioningSaga Step 5 dual-path**: When `IProvisioningInput.templateName` present → `applyTemplateToSite`; absent → legacy `copyTemplateFiles`. Compensation unchanged (`removeTemplateFiles` works for both).
- **ISiteTemplate.Title is typed**: `SiteTemplateType = 'Default' | 'Commercial' | 'Luxury Residential'` — not a free string.
- **Site_Templates SP list**: Added to HUB_LISTS. Cache key: `hbc_site_templates`. Column mappings: `SITE_TEMPLATES_COLUMNS`.

### New Skill Documentation (added 23 Feb 2026 at commit 55027ece)
- **Provisioning Engine Skill Creation** `.claude/skills/provisioning-engine/SKILL.md` – 7-step engine protocol, guaranteed stable flows, manual test steps, and cross-references.  
  Cross-ref: §7 (ProvisioningService), §12 (Feature Flags: provisioningEngineV2), DATA_ARCHITECTURE.md, SECURITY_ANALYSIS.md.  
  Impact: ~40 % faster onboarding/extension of site-creation features.

  ### New Skill Documentation (added 23 Feb 2026 at commit fb4d8793)
- **`.claude/skills/resilient-data-operations/SKILL.md`** – Batching, retry/backoff, saga compensation, SignalR status patterns.  
  Cross-ref: §7 (GraphBatchService, ProvisioningSaga), §12 (ConnectorMutationResilience, ProvisioningSaga), `.claude/skills/provisioning-engine/SKILL.md`, Elevated UI/UX Design Skill.  
  Impact: ~40 % faster extension of resilient connectors and workflows.
### New Skill Documentation (added 23 Feb 2026 at commit 58c3dff)
- **`.claude/skills/workflow-state-machines/SKILL.md`** — xstate v5 machine protocol, dual-path flag strategy, guard rules, and optimistic integration.
  Cross-ref: §1, §16, §21, `.claude/skills/resilient-data-operations/SKILL.md`.
  Impact: ~40 % reduction in workflow extension time.
### New Skill Documentation (added 24 Feb 2026 — Phase 6A)
- **`.claude/skills/site-template-management/SKILL.md`** v1.0 — ISiteTemplate model, 8 IDataService methods, TemplateSyncStatus lifecycle, GitOps sync flow, ProvisioningSaga Step 5 dual-path, Default fallback rule, admin UI tab protocol.
  Cross-ref: §7 (284 methods), §15 (Phase 6A), §16 (template pitfalls), `.claude/skills/provisioning-engine/SKILL.md` v1.3, `.claude/skills/resilient-data-operations/SKILL.md` v1.4.
  Impact: ~40 % faster onboarding/extension of site template management features.

**Keep CLAUDE.md lean** — archive aggressively to CLAUDE_ARCHIVE.md.

---

## §17 Stakeholder Requirements & Vision (Locked 22 Feb 2026)

Gen 2 clarification (22 Feb 2026): Standalone desktop app swapped to hosted PWA web app. Single codebase for Gen 1 (SPFx) + Gen 2 (PWA). Gen 3 remains native mobile.

Core functionality, data/backend, performance, UX/roles, future vision, and constraints as captured in owner interview (22 Feb 2026). SharePoint provisioning highest priority (by 31 Mar 2026). Gen 1–3 path locked. MVP <2 months, full scope + Procore/BambooHR <6 months.

---

## §18 Stabilization & Multi-Generation Roadmap (Locked 22 Feb 2026)

Phase 0: Blueprint Lockdown (complete). **COMPLETE**  
Phase 0.5: Pluggable Data Prep (parallel, 3–5 days). **COMPLETE**   
Phase 1: SharePoint Site Provisioning (by 31 Mar 2026).  **COMPLETE**  
Phase 2: New Role & Permission System (by 5 Apr 2026). **COMPLETE**   
Phase 3: Navigation Overhaul + Clean Router & Data Layer Reconstruction + MVP (mid-Apr 2026).  **COMPLETE**  
Phase 4: Full Features + Integrations + Schedule v2 Prep + Gen 2/3 Readiness — **IN PROGRESS** (end-Aug 2026).  
Phase 5: Gen 1 Production Hardening (Feb–Mar 2026).
  - Phase 5A: Connector Resilience — **COMPLETE**.
  - Phase 5B: Workflow State Machines + E2E Coverage — **PLANNED**.
  - Phase 5C: Provisioning Infrastructure — **COMPLETE**.
  - Phase 5D: Cross-cutting Quality & Governance — **COMPLETE** (GraphBatchEnforcer, ListThresholdGuard, coverage 80/60/70/80, connector E2E, governance docs).  
Phase 6: Gen 2 – Hosted PWA Web App (Q4 2026).  
Phase 7: Gen 3 – Native Mobile Application (Q1 2027).  
Phase 8: Post-Launch Expansion (ongoing).  
Cross-reference: `.claude/plans/hbc-stabilization-and-suite-roadmap.md`.

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

§18.3 Phase 7 Remediation-First Roadmap Committed (commit 3c61d6b1a4dcd1e9aabdc3f8e10fb7d2b581ec0d)
.claude/plans/hbc-stabilization-and-suite-roadmap.md created with full remediation-first content. All shortfalls and opportunities locked into Phase 7. .claude/plans/ directory established. ProjectControlsPlan.rtf deprecated. Documentation desynchronization shortfall resolved. This file is now the binding single source of truth.

§18.4 Phase 7 Detailed To-Do Integration (commit after update)
hbc-stabilization-and-suite-roadmap.md updated with the full detailed Phase 7 plan (7 stages with sub-tasks, deliverables, success criteria, CLAUDE.md and SKILL.md updates). All shortfalls and opportunities now explicitly actionable. Roadmap is binding single source of truth.

§18.6 Phase 7 Stage 2 Performance Optimization Complete (commit after update)
Stage 2 of Phase 7 completed per roadmap: construction-scale benchmarks established, HbcTanStackTable/ECharts/Query optimized, bundle reduced to target, performance telemetry added. All Stage 2 deliverables and success criteria addressed. Ready for Stage 3 (Security Hardening).

---

## §19 Data Migration & Pluggable Backend Strategy (Locked 22 Feb 2026)

IDataService abstraction preserved (266 methods). Phase 0.5 **COMPLETE**:  
- `DataProviderFactory` (`packages/hbc-sp-services/src/factory/`) reads `VITE_DATA_SERVICE_BACKEND` env var (sharepoint | azuresql | dataverse), defaults to sharepoint.  
- `AzureSqlDataService` + `DataverseDataService` skeletons (`packages/hbc-sp-services/src/adapters/`) use Proxy-based `createNotImplementedService` — throws `NotImplementedError` for all methods.  
- `NotImplementedError` custom error with backend + method metadata.  
- Factory is additive — existing direct instantiation unchanged. Factory wiring into UI deferred to Phase 3.  
- Enables Gen 2 (Azure SQL desktop) and Gen 3 (Dataverse mobile) without UI/business logic refactoring.  
- **Connector Adapters (Phase 4D):** `IConnectorAdapter` + `ConnectorRegistry` + `ProcoreAdapter` (bidirectional) + `BambooHRAdapter` (inbound-only). 34 connector methods in IDataService (9 base + 15 Procore + 10 BambooHR). All mock-implemented with rich fixture data. Procore + BambooHR mock adapters fully wired to UI. ConnectorManagementPanel provides admin sync/test/history.

---

## §20 Application Suite Strategy (Phase 4 — 22 Feb 2026)
Central Analytics Hub + 5 departmental workspaces:  
- **Hub** (`/`) — **BUILT**: Analytics Hub Dashboard (KPI strip: Active Projects, Pipeline Value, Win Rate, Safety Score, On-Time %; 6 ECharts: pipeline funnel, status treemap, win rate trend, resource heatmap, labor rate benchmark, material cost index; recent activity feed; workspace quick links; PowerBI placeholder). 3 routes.  
- **Preconstruction** (`/preconstruction/*`) — **BUILT**: Landing Dashboard (4 KPIs: Active Leads, Go/No-Go In Progress, Pipeline Value, Est. Win Rate; 3 ECharts: lead funnel by stage, win rate by PE with FL GC benchmark, post-bid autopsy trend; sub-hub quick links; PowerBI placeholder). BD (Dashboard, Leads, Go/No-Go, Pipeline, Project Hub, Documents). Estimating (Dashboard [5 KPIs: Total Estimates, Active Pursuits, Submitted, Pursuit Pipeline, Precon Engagements; 3 ECharts: award status donut, estimates by source, estimator workload], Department Tracking [3 tabs: Estimate Log / Current Pursuits / Current Preconstruction — all inline-editable, 8 checklist columns, SlideDrawer new-entry forms], Post-Bid, Project Hub, Documents). Project Number Requests (Tracking Log, Request Form — TYPICAL + ALTERNATE workflow). IDS (Dashboard, Tracking, Documents). 20 routes (19 + 1 redirect from old `/estimating/job-requests` path). Feature flags: EstimatingDepartmentTracking, PowerBIIntegration.  
- **Admin** (`/admin/*`) — **BUILT**: System Config (Connections, Hub Site URL, Workflows), Security & Access (Roles, Permissions, Assignments, Sectors), Provisioning, Dev Tools (Dev Users, Feature Flags, Audit Log). 12 routes.  
- **Operations** (`/operations/*`) — **BUILT**: Operations Dashboard, Commercial Ops (Dashboard, Luxury Residential, Project Hub, Project Settings, Project Manual + 12 sub-pages, Financial Forecasting, Schedule), Logs & Reports (Buyout, Permits, Constraints, Monthly Reports, Sub Scorecard), Documents, Operational Excellence (Dashboard, Onboarding, Training, Documents), Safety (Dashboard, Training, Scorecard, Resources, Documents), QC & Warranty (Dashboard, Best Practices, QA Tracking, Checklists, Warranty, Documents), Procore Integration (Dashboard, RFIs, Budget, Sync Conflicts). 47 routes, 45 pages, 6 sidebar groups. Permissions: PROCORE_VIEW, PROCORE_SYNC. Feature flag: ProcoreIntegration.  
- **Shared Services** (`/shared-services/*`) — **BUILT**: Marketing (Dashboard, Resources, Requests, Tracking, Documents), Human Resources (People & Culture Dashboard, Openings, Announcements, Initiatives, Documents), Accounting (Dashboard, New Project Setup, Accounts Receivable Report, Documents), Risk Management (Dashboard, Knowledge Center, Requests, Enrollment Tracking, Documents), BambooHR (Employee Directory, Org Chart, Time Off, Employee Mappings). 25 routes, 24 pages, 5 sidebar groups. Permissions: BAMBOO_VIEW, BAMBOO_SYNC. Feature flag: BambooHRIntegration.  
- **HB Site Control** (`/site-control/*`) — **BUILT**: Jobsite Management (Sign-In/Out Dashboard, Personnel Log, Documents), Safety (Dashboard, Inspections, Warnings & Notices, Tool-Box Talks, Scorecard, Documents), Quality Control (Dashboard, Inspections, Issue Resolution, Metrics, Documents). 16 routes, 15 pages.  
- **Project Hub** (`/project-hub/*`) — **BUILT**: Cross-cutting project workspace. Hidden unless project selected (`requireProject: true`). 10 accordion sidebar groups: Project Hub (Dashboard, Settings), Preconstruction (Go/No-Go, Estimating Kick-Off, Estimate, Project Turnover, Post-Bid Autopsy), Project Manual (PMP, Superintendent's Plan, Responsibility Matrix, Meeting Templates, Pay App Process, Safety Plan, OSHA Guide, Tropical Weather, Crisis Management, IDS Requirements), Startup & Closeout (Startup Guide, Startup Checklist, Closeout Guide, Completion & Acceptance, Closeout Checklist), QA/QC Program (QC Checklists, Best Practices), Financial Forecasting (Review Checklist, Forecast Summary, GC/GR Forecast, Cash Flow Forecast), Schedule, Logs & Reports (Buyout Log, Permit Log, Constraints Log, Subcontractor Scorecard), Monthly Reports (PX Review, Owner Report), Documents. 37 routes (1 layout + 36 pages). Feature flag: ProjectHubWorkspace. Permission-gated groups. ProjectHubLayout with "No Project Selected" MessageBar banner.  
All driven by `workspaceConfig.ts` — single source of truth. Cross-ref §4 and §21.

---

## §21 Navigation & Suite UX Architecture (Phase 3 COMPLETE — 22 Feb 2026)

**PillarTabBar DELETED.** Replaced by:  
- **AppLauncher** (`components/navigation/AppLauncher.tsx`): Fluent UI Menu/MenuPopover in header. Grid of workspace tiles. RoleGate per tile. Workspaces with `requireProject: true` hidden when no project selected.  
- **ContextualSidebar** (`components/navigation/ContextualSidebar.tsx`): Workspace-aware accordion sidebar driven by `useWorkspace()` hook. Accordion behavior (v1.1): All sidebar groups start collapsed. Single-group-open — expanding one auto-collapses others. Expanded state persisted per workspace via localStorage (`hbc:sidebar-accordion:{workspaceId}`). Auto-expands group containing active route on direct URL navigation. Fluent UI Accordion component with built-in smooth motion. NavItem unchanged. ProjectPicker always-on. Project Hub quick-link in persistent section when project selected and workspace ≠ project-hub.  
- **NavigationSidebar**: Legacy fallback (basic ProjectPicker, role-based groups, no pillar filtering).  
- **MobileBottomNav**: Workspace tabs + project pill bottom sheet. Uses `LAUNCHER_WORKSPACES` from workspaceConfig.  
- Feature flag: `uxSuiteNavigationV1` gates AppLauncher + ContextualSidebar. `uxEnhancedNavigationV1` REMOVED.  
- Workflow note: `WorkflowStateMachine` is non-navigation infrastructure; it must not introduce route-action coupling or alter AppLauncher/ContextualSidebar routing behavior.

---

## §22 Router & Data Layer Reconstruction (Phase 3 COMPLETE — 22 Feb 2026)

Clean-slate rebuild DONE:  
- **Adapter hooks** (`useAppNavigate`, `useAppLocation`, `useAppParams`) use TanStack Router hooks directly. Ref-stable, memoised. No bridge, no adapter context.  
- **TanStackAdapterBridge** DELETED. **RouterAdapterContext** DELETED.  
- **Route tree**: 6 workspace files (`workspaces/routes.{hub,preconstruction,operations,sharedservices,admin,sitecontrol}.tsx`). 7 old batch files deleted. Factory pattern: each exports `create*WorkspaceRoutes(rootRoute)`.  
- **URL redirects**: `/marketing` → `/shared-services/marketing`, `/accounting-queue` → `/shared-services/accounting`.  
- **MemoryRouter** (test utility): Uses real TanStack Router with `createMemoryHistory` + `TestChildrenContext` pattern.  
- **136 total routes**: 99 prior + 37 Project Hub workspace routes (1 layout + 36 pages).

---

## §23 Enterprise App Shell Patterns (Locked 22 Feb 2026)

Reference architecture for Hub + Workspaces. All future development follows these patterns. See new Skills and master plan.

**For complete history, full method tables, and detailed past phases → see CLAUDE_ARCHIVE.md**
