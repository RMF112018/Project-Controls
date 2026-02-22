---
name: CLAUDE.md | description: Master blueprint, live status, and central coordinator for HBC Project Controls SPFx application | triggers: all | updated: 2026-02-21
---

**CLAUDE.md — HBC Project Controls Blueprint (Lean Edition)**

**Performance Rule (Critical)**  
This file must stay under 40,000 characters. Never allow it to grow large again. When it approaches the limit, archive older content to CLAUDE_ARCHIVE.md.

**Update Rules (Mandatory)**  
- After every completed data service chunk → update §7 and §15  
- After major architecture/pattern changes → update relevant sections (§4, §16)  
- After adding, consolidating, or updating .claude/ instruction files or Skills → update §0, §0b, and §16  
- After any Memory entry is added/updated → verify §0 Memory Usage Rule remains accurate  
- Every 3–4 major updates or when approaching 35 k characters → prune non-essential history to CLAUDE_ARCHIVE.md  
- Always keep focused on: current status, active rules, verification gates, and live references.

For full historical phase logs (SP-1 through SP-7), complete 221-method table, old navigation, and detailed past pitfalls → see **CLAUDE_ARCHIVE.md**.

**Last Updated:** 2026-02-21 — Agent Enhancement Package deployed (.claude/ files + 8 consolidated Skills + SKILLS_OVERVIEW.md). TanStack Router + Query + Table migration active. Sprint 3 performance hardening + Schedule v2.0 preparation. Claude Memories integrated as dynamic layer.

**MANDATORY:** After any code change that affects the data layer, architecture, performance, UI/UX, testing, or security, update this file, verify against the current sprint gate, confirm relevant Skills were followed, and check project memory (`MEMORY.md`) before ending the session.

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
- Testing: Jest (2 projects: `sp-services` + `components`) + Playwright + Storybook 8.5 + Chromatic
- Coverage Enforcement: Phased thresholds in `jest.config.js` + `jest.config.components.js`; CI gate via `pr-validation.yml` (`--coverage --ci`); target >95% (see §15c)
- Bundle Governance: Hard fail on main via `scripts/verify-bundle-size.js`  

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

- **PillarTabBar must use `useAppNavigate`** — never `useTransitionNavigate`. The `useAppNavigate` hook returns a ref-stable callback (empty deps). `useTransitionNavigate` wraps it in `startTransition`, but TanStack Router's Transitioner already does this — double-wrapping causes concurrent scheduler deadlock. PillarTabBar is `React.memo`; `visibleTabs` memoized via `useMemo`; click handler uses `data-path` attribute for stable identity (no per-button closures).
- **Late-Router rendering audit rule**: When adding new providers, contexts, or hooks to AppShell.tsx, the backing files MUST exist and compile before the import is added. Never commit phantom imports. The route tree's RootLayout renders AppShell which wraps `<Outlet />` — any broken provider in AppShell kills the entire route outlet.
- **useTransitionNavigate eliminated**: All consumers migrated to `useAppNavigate` (ref-stable, empty deps). `useTransitionNavigate.ts` deleted. TanStack Router's Transitioner handles startTransition internally — no component should double-wrap. If new navigation hooks are needed, extend `useAppNavigate`, never wrap it in startTransition.

**Navigation UX Architecture (uxEnhancedNavigationV1)**
4-pillar tab bar (Hub|Precon|Ops|Admin) in AppShell header, driven by `PillarTabBar` component using `useAppNavigate` (ref-stable adapter). Sidebar filters NavGroups to active pillar. `EnhancedProjectPicker` replaces ProjectPicker behind feature flag — Fluent Popover with Recent/Favorites/All sections, fuzzy search, KPI hover preview via `ProjectPreviewPane`. `MacBarStatusPill` in header shows selected project health. `ShellHydrationOverlay` during project switch (max 400ms). `useNavProfile` hook manages localStorage favorites/recent. All gated by FeatureGate. No router creation changes.

- **No keyed main container**: `<main>` does NOT use `key={selectedProject?.projectCode}` — removed to prevent thundering-herd remount. ShellHydrationOverlay + routeTransition CSS provide visual feedback.
- **Region filter persistence**: useNavProfile manages favorites/recent in localStorage. EnhancedProjectPicker initializes from persisted values on open.

See `CODE_ARCHITECTURE_GUIDE.md` for full folder and dependency rules.

---

## §7 Service Methods Status (Live)

**Total methods**: 250  
**Implemented**: 250  
**Remaining stubs**: 0 — **DATA LAYER COMPLETE**

Last major additions: GitOps Provisioning (Feb 18) + Constraints/Permits/Schedule modules.

---

## §15 Current Phase Status (Active)

**Focus (Feb 21, 2026):** TanStack Router + Query + Table migration completion, performance hardening (Top-10 high-ROI optimizations), Schedule v2.0 preparation, integration testing, and deployment readiness.  

- TanStack Query Wave-1 complete on hub/buyout/compliance domains  
- TanStack Router runtime full migration (hash history)  
- TanStack Table Wave-2 complete (legacy DataTable removed for new surfaces)  
- Consolidated 8 Skills deployed for performance and Schedule v2.0 domains  

- Navigation UX enhancement complete: PillarTabBar, EnhancedProjectPicker, MacBarStatusPill, ContextKPIStrip, HbcCommandPalette unification (Phases 0-6, feature-flagged under `uxEnhancedNavigationV1`)
- EnhancedProjectPicker polished: keyboard nav (arrow/Home/End/Escape), favorites reorder (up/down buttons), region/division quick-filters, enhanced context menu, Storybook coverage (6 variants)
- MacBarStatusPill: live health pulse animation (Yellow/Red), click-to-navigate
- ProjectPreviewPane: extended KPIs (billings, fee%, schedule variance), alert indicators, sync hint

- Optimistic project switch: useSwitchProject hook with KPI enrichment, rollback, "Switching to..." skeleton in MacBarStatusPill + ShellHydrationOverlay label
- Cmd+K unification: Projects section first in palette, favorites/recent priority ordering (25 commands max)

- Rollout readiness: MobileBottomNav (4-pillar + project pill), region filter persistence, favorites stagger animation, full a11y pass (ARIA live regions), dev toggle for uxEnhancedNavigationV1 (mock mode only)
- Storybook coverage: HbcCommandPalette WithProjectCommands, HbcInsightsPanel (existing). EnhancedProjectPicker and PillarTabBar stories not yet created.
- PillarTabBar + AppShell freeze fix: (1) PillarTabBar switched to useAppNavigate + React.memo + useMemo visibleTabs + data-path click pattern. (2) AppShell.tsx phantom imports removed (MobileBottomNav, useSwitchProject, NavigationServicesContext, ProjectService/UserProfileService never created) — flattened to single component, useNavProfile replaces NavigationServicesContext, useAppNavigate replaces useTransitionNavigate.
- Post-V2 QC & cleanup audit: useTransitionNavigate eliminated (3 consumers migrated to useAppNavigate, hook deleted). NavigationSidebar filter callbacks stabilized with useCallback. insightsItems useMemo switched from isFeatureEnabled function ref to primitive boolean. aria-live added to ShellHydrationOverlay (assertive) and MacBarStatusPill (polite). CLAUDE.md false Storybook claims corrected.

**Test Coverage Hardening (Feb 21, 2026):**
- Gap analysis complete. Baseline: sp-services 53.3% stmts (29 suites, 627 tests) / components 11.0% stmts (22 suites, 99 tests).
- Phase 1 thresholds enforced in CI: sp-services 48/37/44/50, components 9/5/6/10.
- `jest.config.components.js` now has `collectCoverageFrom` + `coverageThreshold` (previously had neither).
- `pr-validation.yml` updated: runs both Jest projects with `--coverage --ci`, uploads lcov artifacts.
- New test suites: DataServiceError (100%), createDelegatingService (100%), mutationCatalog+buildMutationPlan+defaultPlan (100%), optimisticPatchers (100%).
- High-risk 0% files identified: SignalRService, usePermissionEngine, AppContext, NavigationSidebar, EnhancedProjectPicker.
- Top-20 prioritized test suites documented in `.claude/plans/dreamy-wiggling-cookie.md`.
- Target: Phase 2 (Sprint 4) sp 65%/comp 35%, Phase 3 (Sprint 5) sp 80%/comp 60%, 95% on new files via per-file overrides.
- SharePointDataService PnP mock infrastructure deferred to Sprint 5.

**Next steps:** High-risk gap closure (SignalR, queryKeys, permissionEngine, PillarTabBar, useNavProfile), then presentation layer foundation tests.

See `FEATURE_DEVELOPMENT_BLUEPRINT.md` for new domain patterns, `PERFORMANCE_OPTIMIZATION_GUIDE.md` for optimization framework, and `SKILLS_OVERVIEW.md` for active Skills.

### §15c Coverage Targets & Enforcement Strategy

**Mandate:** All measured source files must reach >95% statement/branch/function/line coverage. Achieved via phased global thresholds plus per-file overrides on new code.

**Jest Project Structure (2 projects)**

| Project | Config | Environment | Scope |
|---------|--------|-------------|-------|
| `sp-services` | `packages/hbc-sp-services/jest.config.js` | node | Data layer: services, utils, mutations |
| `components` | `jest.config.components.js` | jsdom | Presentation: components, hooks, contexts, router, TanStack Query/Table |

**Phased Global Thresholds**

| Phase | Sprint | sp-services (stmt/br/fn/line) | components (stmt/br/fn/line) | Trigger |
|-------|--------|-------------------------------|------------------------------|---------|
| **1 (active)** | 3 | 48 / 37 / 44 / 50 | 9 / 5 / 6 / 10 | Ratchet — no regression from baseline |
| **2** | 4 | 65 / 55 / 60 / 65 | 35 / 20 / 25 / 35 | After Top-20 gap closure |
| **3** | 5 | 80 / 75 / 80 / 80 | 60 / 45 / 55 / 60 | After PnP mock infra + page tests |
| **4 (final)** | 6+ | 95 / 90 / 95 / 95 | 95 / 90 / 95 / 95 | After excluded files brought in |

**Per-File Override for New Code (effective immediately)**
Every new `.ts`/`.tsx` file must ship with ≥95% coverage. Add per-file thresholds in the relevant `jest.config`:
```js
coverageThreshold: {
  global: { /* phase thresholds */ },
  './src/path/to/NewFile.ts': { statements: 95, branches: 90, functions: 95, lines: 95 },
}
```

**CI Enforcement** (`.github/workflows/pr-validation.yml`)
- Both projects run with `--coverage --ci` — Jest exits non-zero on threshold violation.
- Coverage artifacts (`lcov.info`) uploaded per run (14-day retention).
- Threshold bumps happen only via explicit PR to jest.config files — never silently lowered.

**Excluded Files (Sprint 5 Infrastructure Required)**
These are excluded from `collectCoverageFrom` and do NOT count toward global thresholds:
- `SharePointDataService.ts` (9,394 lines) — needs PnP mock chain
- `ExportService.ts` — needs DOM mocks (html2canvas, jsPDF, XLSX)
- `GraphService.ts`, `HubNavigationService.ts`, `OfflineQueueService.ts`, `PowerAutomateService.ts`
- `columnMappings.ts`, `breadcrumbs.ts`, `formatters.ts`, `riskEngine.ts`, `siteDetector.ts`

Bringing these files into coverage is the gating prerequisite for Phase 4 (>95% global).

**Exception Process**
1. Document the reason in a PR description.
2. Add the file to the relevant `collectCoverageFrom` exclusion list with a `// Excluded:` comment explaining why.
3. Create a follow-up issue tracking the eventual coverage addition.
No silent exclusions — every `!` pattern must have a dated comment.

**Gap Report Artifact**
Full prioritized gap report with top-20 test suites, high-risk paths, and effort estimates: `.claude/plans/dreamy-wiggling-cookie.md`.
4 suites delivered at 100%: `DataServiceError`, `createDelegatingService`, `mutationCatalog`+`buildMutationPlan`+`defaultPlan`, `optimisticPatchers`.

**Cross-References**
- Jest configs: `packages/hbc-sp-services/jest.config.js`, `jest.config.components.js`
- CI pipeline: `.github/workflows/pr-validation.yml`
- Testing patterns & pyramid: `TESTING_STRATEGY.md` §0–§3
- Security/permission test requirements: `SECURITY_PERMISSIONS_GUIDE.md` §2

---

## §16 Active Pitfalls & Rules (Lean – Reference Only)

- **Router singleton — NEVER recreate:** `TanStackPilotRouter` uses `useRef` to create the router once. Dynamic values injected via `router.update()` + `RouterProvider context={}`. Adapter hooks (`useAppNavigate`, `useAppLocation`, `useAppParams`) return memoised/ref-stable values. `ProjectPicker.handleSelect` closes popover before `startTransition(() => onSelect(project))`. Adding dynamic values to any dep array that creates the router will cause full-app freeze.
- **TanStackAdapterBridge:** `useMemo` for `adapterValue` must depend ONLY on primitive/stable values (`pathname`, `searchStr`, `params`). NEVER depend on `state.matches` — it changes reference on every router state transition and causes full-app re-render cascades via AppShell. The `navigate` function must be ref-backed (`useCallback` + `useRef`) for identity stability.
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

- **useTransitionNavigate is DELETED — never recreate**: All navigation must use `useAppNavigate` (ref-stable, empty deps). TanStack Router's Transitioner handles startTransition internally. Double-wrapping causes concurrent scheduler deadlock. If new navigation patterns are needed, extend useAppNavigate or use router.navigate() directly.
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

**Keep CLAUDE.md lean** — archive aggressively to CLAUDE_ARCHIVE.md.

---

**For complete history, full method tables, and detailed past phases → see CLAUDE_ARCHIVE.md**