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

**Next steps:** Full E2E coverage expansion and Sprint 3 gate enforcement.  

See `FEATURE_DEVELOPMENT_BLUEPRINT.md` for new domain patterns, `PERFORMANCE_OPTIMIZATION_GUIDE.md` for optimization framework, and `SKILLS_OVERVIEW.md` for active Skills.

---

## §16 Active Pitfalls & Rules (Lean – Reference Only)

- **Router singleton — NEVER recreate:** `TanStackPilotRouter` uses `useRef` to create the router once. Dynamic values injected via `router.update()` + `RouterProvider context={}`. Adapter hooks (`useAppNavigate`, `useAppLocation`, `useAppParams`) return memoised/ref-stable values. `ProjectPicker.handleSelect` closes popover before `startTransition(() => onSelect(project))`. Adding dynamic values to any dep array that creates the router will cause full-app freeze.
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

**Keep CLAUDE.md lean** — archive aggressively to CLAUDE_ARCHIVE.md.

---

**For complete history, full method tables, and detailed past phases → see CLAUDE_ARCHIVE.md**