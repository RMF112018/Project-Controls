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
- Testing: Jest + Playwright + Storybook 8.5 + Chromatic  
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

**Navigation UX Architecture (uxEnhancedNavigationV1)**
4-pillar tab bar (Hub|Precon|Ops|Admin) in AppShell header, driven by `PillarTabBar` component using `useAppNavigate` (ref-stable adapter). Sidebar filters NavGroups to active pillar. `EnhancedProjectPicker` replaces ProjectPicker behind feature flag — Fluent Popover with Recent/Favorites/All sections, fuzzy search, KPI hover preview via `ProjectPreviewPane`. `MacBarStatusPill` in header shows selected project health. `ShellHydrationOverlay` during project switch (max 400ms). `useNavProfile` hook manages localStorage favorites/recent. All gated by FeatureGate. No router creation changes.

- **useSwitchProject hook**: TanStack Query v5 mutation for project switching. onMutate sets selectedProject optimistically + addRecent. onError rolls back to previousProject. onSuccess enriches with KPI data via ProjectService. Uses useTransitionNavigate for post-switch navigation. Never touches router creation.
- **No keyed main container**: `<main>` does NOT use `key={selectedProject?.projectCode}` — removed to prevent thundering-herd remount. ShellHydrationOverlay + routeTransition CSS provide visual feedback.
- **MobileBottomNav**: Fixed 4-pillar bottom bar for mobile (<768px), reuses PILLARS + getActivePillar from PillarTabBar. env(safe-area-inset-bottom) aware. Renders only when isMobile && uxEnhancedNavigationV1. Uses useTransitionNavigate.
- **Region filter persistence**: IUserProfileService.setRegionFilter/setDivisionFilter persist to localStorage via INavProfile.preferredRegion/preferredDivision. EnhancedProjectPicker initializes from persisted values on open.

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
- Storybook coverage: EnhancedProjectPicker WithRegionFilters + SwitchingState, HbcCommandPalette WithProjectCommands
- PillarTabBar freeze fix: switched to `useAppNavigate` (stable identity), `React.memo`, `useMemo` visibleTabs, `data-path` click pattern — eliminates double-startTransition deadlock

**Next steps:** Full E2E coverage expansion and Sprint 3 gate enforcement.  

See `FEATURE_DEVELOPMENT_BLUEPRINT.md` for new domain patterns, `PERFORMANCE_OPTIMIZATION_GUIDE.md` for optimization framework, and `SKILLS_OVERVIEW.md` for active Skills.

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

- **PillarTabBar must use `useAppNavigate`** — never `useTransitionNavigate` or `router.navigate()` directly. `useAppNavigate` returns a ref-stable callback; `useTransitionNavigate` double-wraps in `startTransition` (TanStack Router Transitioner already handles it), causing concurrent scheduler deadlock. PillarTabBar is `React.memo`; `visibleTabs` memoized via `useMemo([isPillarVisible])`; click handler uses `data-path` + single `useCallback` (no per-button closures). Tab bar reads `location.pathname` via `useAppLocation()` for active state.
- **EnhancedProjectPicker uses Fluent Popover** (portal-based) — never Dialog (would steal focus from sidebar context). Popover `onOpenChange` must close before `startTransition(() => onSelect(project))` to prevent click-outside race.
- **EnhancedProjectPicker keyboard nav**: Uses `useArrowNavigationGroup({ axis: 'vertical', circular: true })` from Fluent v9 tabster. Home/End jump to first/last. Escape closes popover.
- **Favorites reorder**: Move-up/move-down buttons (no DnD library). `IUserProfileService.reorderFavorites()` persists order to localStorage. Zero new npm deps.
- **EnhancedProjectPicker region/division filters**: Only shown when projects have >1 unique region. Filters apply BEFORE fuzzy search to avoid empty-state confusion. Filters persist via INavProfile (not reset on close).
- **MacBarStatusPill pulse**: Uses Griffel keyframe animation with `@media (prefers-reduced-motion: reduce)` guard. Never pulse on Green health.
- **useNavProfile localStorage key**: `hbc:nav-profile:{email}` — always scope to user email. Max 5 recent (FIFO), unlimited favorites.
- **ShellHydrationOverlay**: dismiss via `useIsFetching` (never global). Minimum 200ms display to prevent flash.
- **useSwitchProject must NOT touch router creation**: Uses useTransitionNavigate only. Never passes dynamic values to createHbcTanStackRouter. The mutation is local state + KPI enrichment, not a server mutation.
- **MacBarStatusPill skeleton with name**: Shows selectedProject.projectName (already set optimistically by onMutate) truncated to 16 chars. Falls back to generic skeleton if selectedProject is null during switch.
- **MobileBottomNav safe-area**: Must use `paddingBottom: env(safe-area-inset-bottom)` for iOS notch. Height is 56px + safe area. Hidden via CSS >= 768px (not JS breakpoint) for SSR safety.
- **Region filter persistence**: Persisted in same INavProfile localStorage object. Reset to null means "All Regions" — never remove the key, set to null explicitly.
- **uxEnhancedNavigationV1 default ON**: MockDataService sets `Enabled: true`. SharePoint/standalone modes read from SP list (admin-controlled). Dev toggle in AppShell allows bidirectional override in mock mode only.
- **Dev toggle (devNavOverride)**: Only available when `dataServiceMode === 'mock'`. Replaces FeatureGate for nav components in AppShell only — child components like NavigationSidebar still use their own isFeatureEnabled checks.
- **ARIA live regions on project switch**: MacBarStatusPill uses `aria-live="polite"`, ShellHydrationOverlay uses `aria-live="assertive"`. Never use "assertive" on frequently-changing elements — overlay is transient (200ms-400ms max).
- **setSelectedProject skipSwitchingFlag**: KPI enrichment in `onSuccess` uses `{ skipSwitchingFlag: true }` to avoid restarting the isProjectSwitching timer. Only the initial optimistic call in `onMutate` sets the switching flag.
- **Permission re-resolution debounced**: 300ms debounce on `selectedProject?.projectCode` (primitive dep, not object ref). Prevents third AppContext cascade on project switch.
- **No keyed `<main>`**: Removed `key={selectedProject?.projectCode}` to prevent thundering-herd query refetch on project switch. ShellHydrationOverlay + routeTransition CSS handle the visual transition.
- **switchProject identity**: Uses `mutation.mutate` (stable) not `mutation` (unstable) in useCallback deps.
- **No `React.startTransition` in stableNavigate**: TanStack Router's Transitioner already wraps `router.load()` in startTransition. Double-wrapping causes React concurrent scheduler deadlock with useSyncExternalStore. stableNavigate calls navigateRef.current() directly.
- **isFeatureEnabled uses `userRoles` not `currentUser`**: Deps are `[featureFlags, userRoles]` where `userRoles = currentUser?.roles`. The roles array reference is stable across permission-only updates, preventing identity cascade through routerProps → RouterProvider → entire route tree.
- **RouterProvider context is memoized**: `useMemo` on the context object prevents RouterProvider from calling `router.update()` on every render. No separate useEffect for router.update() — RouterProvider handles it during render.
- **envConfig useEffect uses boolean dep**: `permissionEngineEnabled` (primitive) instead of `isFeatureEnabled` (function ref) prevents unnecessary re-fetches.

**Keep CLAUDE.md lean** — archive aggressively to CLAUDE_ARCHIVE.md.

---

**For complete history, full method tables, and detailed past phases → see CLAUDE_ARCHIVE.md**