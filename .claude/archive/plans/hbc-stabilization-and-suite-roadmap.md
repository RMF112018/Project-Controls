# Plan: HBC Project Controls Stabilization, Role Reset & Modular Suite Transition — Remediation-First Implementation Plan

## Context
The HBC Project Controls application has strong foundational elements (@hbc/sp-services data layer with DataProviderFactory, TanStack Router v1, Fluent UI v9) but carries technical debt identified in the analysis against commit d0d69195d8a4408c5f8287024a2c19ab41ddffb0. Owner (non-technical) direction: Central Analytics Hub + Departmental Workspaces architecture, reset to 6 core roles, complete PillarTabBar removal (already executed), clean-slate router/data-layer integration, pluggable backends for Gen 2/3 (Azure SQL / Dataverse). All changes are configuration-driven.

**Highest priority:** Stabilized SharePoint Site Provisioning (Phase 6A delivered).  
**MVP targets (remediation-adjusted):** Robust, performant, secure, fully documented foundation by 31 Mar 2026; full modular suite on remediated stack by end-Aug 2026.

Working branch: `feature/hbc-suite-stabilization` (main protected).

## Current State (Verifiy at remote repo)
- Architecture: Single SPFx web part monorepo with TanStack Router, Query v5, @hbc/sp-services (IDataService + DataProviderFactory + AzureSql/Dataverse stubs complete).
- Navigation: Global App Shell + Top Fluent UI App Launcher + Contextual Left Sidebar (PillarTabBar fully removed).
- Roles: LEGACY_ROLE_MAP active (14 → 6 core roles: Admin, Business Development Manager, Estimating Coordinator, Project Manager, Leadership (global), Project Executive (scoped)).
- Provisioning: Phase 6A complete (ISiteTemplate, dual-path saga, GitOps sync, FeatureGate 60).
- Documentation: CLAUDE.md partially populated; roadmap.md absent (shortfall resolved by this file); .claude/plans/ directory absent.
- Shortfalls present: Documentation desynchronization, performance risk on >500-line-item datasets, GitOps security gaps, incomplete 6-role/70+ permission test matrix, a11y/feature-flag debt, scalability limits.
- Opportunities to be realized in Phase 7: Full SKILL.md activation, resilient-data-operations extensions, permission linking, RTF deprecation, hbc-ui-components seed, CI gates.

## Locked Child-App Structure (Owner-provided 22 Feb 2026)
- Preconstruction (BD + Estimating + IDS Hubs)
- Operations (Commercial/Luxury, Operational Excellence, Safety, QC & Warranty)
- Shared Services (Marketing, HR, Accounting, Risk Management)
- QA/QC & Safety (mobile field app)

All use top App Launcher + contextual Left Sidebar. Documents via Fluent/Graph.

## Implementation Phases (Remediation-First — No Features Until Phase 7 Exit Criteria Met 100%)

**Phases 0–3 & 6A:** Complete (as evidenced in HEAD and prior commits).

**Phase 7: Comprehensive Remediation (remediation-first mandate)**
All shortfalls and opportunities addressed here. Zero tolerance for partial completion. No feature work or original Phase 4 scope permitted until 100% exit criteria. Every sub-task must close a verified gap or harden an existing capability before any new feature work proceeds (Phases 8+).

The codebase has reached a mature state (284/284 IDataService methods, 940+ tests, 22 Skills, 136 routes, 52 shared components) but several cross-cutting concerns remain unresolved: documentation desynchronization between guides and actual code, no validated performance at construction-scale data volumes (500+ line items), GitOps provisioning security gaps (backend stubs only), incomplete permission test coverage across the 6-role/70+ permission matrix, accessibility and feature-flag debt, scalability limits from in-tree component architecture, and missing CI quality gates for performance regression.

### Stage 1: Documentation Hygiene

#### Sub-Tasks

1. **Fix SKILLS_OVERVIEW filename typo**: Rename `.claude/SILLS_OVERVIEW.md` to `.claude/SKILLS_OVERVIEW.md`. Update all cross-references in CLAUDE.md `§0` and any guide files referencing the old name.

2. **Sync SKILLS_OVERVIEW skill count**: The overview header states "19 Active Skills" but 22 skill directories exist. Audit all 22 skill folders under `.claude/skills/`, verify each has a current `SKILL.md`, update the overview table to reflect accurate names, versions, and trigger conditions.

3. **Archive stale CLAUDE.md content**: CLAUDE.md is at the 40,000-character governance limit. Move completed phase details (Phases 0–3, 5A–5D, 6A narrative paragraphs from `§15`) to `CLAUDE_ARCHIVE.md`. Retain only current-phase status summaries and forward-looking references.

4. **Sync 8 core guide files with codebase state**: Each guide was last updated 2026-02-21 (pre-Phase 5B through 6A). Cross-reference actual code for:
   - `PERFORMANCE_OPTIMIZATION_GUIDE.md` — Add GraphBatchEnforcer coalescence rules, ListThresholdGuard thresholds, bundle baseline (2.01 MB entrypoint)
   - `UX_UI_PATTERNS.md` — Add HeaderUserMenu consolidation pattern, ProvisioningStatusStepper motion tokens
   - `FEATURE_DEVELOPMENT_BLUEPRINT.md` — Add Site Template Management domain, TemplateSyncStatus lifecycle
   - `CODE_ARCHITECTURE_GUIDE.md` — Add ProvisioningSaga 7-step architecture, xstate lazy chunk pattern
   - `TESTING_STRATEGY.md` — Add Playwright spec inventory (23 files), coverage thresholds (80/60/70/80), Storybook a11y integration
   - `DATA_LAYER_GUIDE.md` — Update method count to 284, add Phase 6A template methods, saga compensation methods
   - `SECURITY_PERMISSIONS_GUIDE.md` — Add dual-path PermissionEngine pattern, 9 role templates, ConnectorRegistry policy enforcement
   - `SKILLS_OVERVIEW.md` — Full resync (see sub-task 2)

5. **Deprecate ProjectControlsPlan.rtf**: The 4,034-line RTF file is legacy and not machine-parseable. Extract any remaining requirements not captured in `.claude/plans/hbc-stabilization-and-suite-roadmap.md`, then mark it deprecated with a pointer to the markdown master plan.

6. **CHANGELOG.md completeness audit**: Verify every commit on `feature/hbc-suite-stabilization` since Phase 0 has a corresponding CHANGELOG.md entry. Fill any gaps.

#### Deliverables
- Renamed and accurate `SKILLS_OVERVIEW.md` (22 skills, correct versions)
- CLAUDE.md under 35,000 characters (5K headroom)
- All 8 core guides synced to post-6A codebase state
- `ProjectControlsPlan.rtf` marked deprecated
- CHANGELOG.md with zero missing entries

#### Success Criteria
- `SKILLS_OVERVIEW.md` lists exactly 22 skills matching `.claude/skills/*/SKILL.md` files
- CLAUDE.md character count < 35,000 (verified via `wc -c`)
- Every guide file references at least one Phase 5+ artifact
- Zero broken cross-references between CLAUDE.md, guides, and Skills

#### CLAUDE.md Sections to Update
- `§0` (workflow rules, guide list, SKILLS_OVERVIEW filename)
- `§7` (confirm 284 final count, archive old method history)
- `§15` (archive completed phases, keep only active/next)
- `§16` (prune pitfalls for completed phases)

#### SKILL.md Files
- No new Skills. Update version on all 22 existing Skills whose referenced codebase artifacts changed since their last update.

---

### Stage 2: Performance Optimization for Construction-Scale Data

#### Sub-Tasks

1. **Establish construction-scale benchmarks**: Define benchmark datasets:
   - Buyout Log: 500+ line items (typical large commercial project)
   - Audit Log: 5,000+ entries (approaching SP threshold)
   - Estimating Tracker: 300+ active pursuits
   - Schedule Activities: 1,000+ activities (P6 import)
   - Leads Master: 200+ leads with full Go/No-Go history

2. **Profile and optimize HbcTanStackTable at 500+ rows**: The current virtualization threshold is 200 rows (`useVirtualRows.ts`, estimateRowHeight: 44px, overscan: 8). Validate that:
   - Initial render < 200ms at 500 rows
   - Scroll jank < 16ms frame budget at 1,000 rows
   - Inline-edit responsiveness < 100ms at 500 rows (Department Tracking use case)
   - If benchmarks fail: increase overscan adaptively, profile React re-renders, memoize row components

3. **Optimize TanStack Query cache for large datasets**: Validate staleTime/gcTime per domain at construction scale. Ensure cursor-paged queries (ListThresholdGuard dual-gate at 4,500) don't cause memory bloat from accumulated page caches. Add `gcTime` ceiling for infinite queries.

4. **Profile ECharts rendering at scale**: Test all 6 Analytics Hub charts and 6 workspace-specific charts with realistic data volumes (200+ data points per series). Validate render < 500ms. If slow: enable ECharts progressive rendering, reduce data resolution for initial load.

5. **Bundle size optimization pass**: Current entrypoint is 2.01 MB raw (near 2 MB hard cap). Audit:
   - Fluent UI v9 tree-shaking (verify no barrel imports)
   - ECharts registered components (only registered charts should be in bundle)
   - xstate chunk isolation (verify lib-xstate-workflow stays lazy)
   - SignalR chunk isolation (verify lib-signalr-realtime stays lazy)
   - Target: entrypoint < 1.9 MB raw (5% reduction)

6. **Add runtime performance telemetry hooks**: Create `usePerformanceMarker(label)` hook that uses `performance.mark()` / `performance.measure()` for key user flows: page load, table render, chart render, form submit. Wire to telemetry service for CI-visible metrics.

#### Deliverables
- Benchmark dataset fixtures in MockDataService (500+ items per key domain)
- Performance test suite (Jest + Playwright) validating construction-scale thresholds
- Bundle reduction to < 1.9 MB entrypoint raw
- `usePerformanceMarker` hook in shared components
- Updated `PERFORMANCE_OPTIMIZATION_GUIDE.md` with benchmark results

#### Success Criteria
- HbcTanStackTable renders 500 rows in < 200ms (measured via `performance.measure()`)
- Scroll at 1,000 rows maintains < 16ms frame budget (Playwright `--trace` analysis)
- ECharts charts render < 500ms with 200+ data points
- Entrypoint bundle < 1.9 MB raw, total gzip < 4.5 MB
- Audit Log query at 5,000 items uses cursor paging (ListThresholdGuard active)
- No memory leaks after 10 page navigations with large datasets (heap snapshot delta < 5 MB)

#### CLAUDE.md Sections to Update
- `§1` (bundle baselines)
- `§16` (add performance pitfalls for construction-scale data)

#### SKILL.md Files
- Update `spfx-performance-diagnostics-and-bundle/SKILL.md` with construction-scale benchmarks
- Update `tanstack-query-and-virtualization/SKILL.md` with cursor paging validation rules
- Update `schedule-performance-optimization/SKILL.md` with 1,000+ activity thresholds

---

### Stage 3: Security Hardening (GitOps & Provisioning)

#### Sub-Tasks

1. **Implement server-side feature flag enforcement**: Currently all 60 feature flags are evaluated client-side only (SECURITY_ANALYSIS.md identifies this as deferred). Add server-side validation in `SharePointDataService` mutation methods: before executing gated operations, verify the flag is enabled server-side (read from SP list, not just client cache). Priority flags: `ProvisioningSaga`, `SiteTemplateManagement`, `WorkflowStateMachine`.

2. **Harden GitOps template sync security**: Phase 6A added `syncTemplateToGitOps` and `syncAllTemplates` methods but the backend is stub-only. Define and enforce:
   - Input validation on template content (no script injection in template JSON)
   - Sync status state machine (TemplateSyncStatus transitions: Idle → Syncing → Success/Failed → Idle)
   - Rate limiting on sync operations (max 1 concurrent sync per template)
   - Audit trail for every sync attempt (already wired via AuditAction.TemplateSyncStarted/Completed/Failed)

3. **Add GraphBatchEnforcer backpressure**: Current implementation has no queue size limit. At extreme burst (e.g., 100+ concurrent Graph calls during bulk provisioning), add:
   - Maximum queue depth (configurable, default 50)
   - Backpressure signal (reject with `BackpressureError` when queue full)
   - Metrics: queue depth high-water mark logged to audit

4. **Secure provisioning idempotency tokens**: Current format `${projectCode}::${ISO}::${4-byte-hex}` is adequate. Add:
   - Token expiry validation (reject tokens older than 24 hours)
   - Token replay detection (check Provisioning_Log for duplicate tokens before executing)
   - Token format validation (regex enforcement in `validateProvisioningInput`)

5. **Permission escalation prevention**: Add defensive checks in `RoleGate` and `PermissionEngine`:
   - Prevent self-role-assignment (user cannot grant themselves Admin)
   - Log all permission changes as SOC2 audit events (already partially done)
   - Add rate limiting on permission mutations (max 10 per minute per user)

6. **Validate OWASP top-10 posture**: Audit all user-facing inputs:
   - OData filter injection in SharePointDataService (verify parameterized queries)
   - XSS in template content rendering (verify Fluent UI's built-in sanitization)
   - CSRF in standalone mode MSAL flows (verify token binding)

#### Deliverables
- Server-side flag validation middleware for critical operations
- GitOps sync input validation and state machine enforcement
- GraphBatchEnforcer backpressure with configurable queue depth
- Idempotency token expiry + replay detection
- Permission escalation prevention guards
- Updated `SECURITY_ANALYSIS.md` with remediation status
- Updated `SECURITY_PERMISSIONS_GUIDE.md` with escalation prevention rules

#### Success Criteria
- Zero server-side flag bypass possible on gated mutations (test with mock flag=OFF + direct API call)
- GitOps sync rejects malformed template JSON (test with script-injection payloads)
- GraphBatchEnforcer rejects at queue depth > 50 (unit test)
- Duplicate idempotency tokens rejected with 409 Conflict (unit test)
- Self-role-assignment blocked and logged (unit + Playwright test)
- No OWASP top-10 findings in manual audit (documented in SECURITY_ANALYSIS.md)

#### CLAUDE.md Sections to Update
- `§5` (permission escalation prevention)
- `§16` (add security pitfalls: flag enforcement, backpressure, token replay)

#### SKILL.md Files
- Update `resilient-data-operations/SKILL.md` v1.5 with backpressure rules
- Update `provisioning-engine/SKILL.md` v1.4 with idempotency hardening
- Update `permission-system/SKILL.md` v1.1 with escalation prevention
- Update `site-template-management/SKILL.md` v1.1 with GitOps security rules

---

### Stage 4: Testing & Permission Completeness

#### Sub-Tasks

1. **6-role permission matrix E2E coverage**: Currently 23 Playwright specs cover ~17% of 136 routes. Create a systematic permission matrix test:
   - For each of 6 canonical roles: verify access to every workspace landing page
   - For each role: verify denial on unauthorized routes (at least 3 negative tests per role)
   - Total new E2E tests: ~36 (6 roles x 6 workspace landings) + 18 denial tests = 54 minimum

2. **Permission dual-path parity tests**: The PermissionEngine (flag ON) and ROLE_PERMISSIONS (flag OFF) paths must produce identical results. Create:
   - Jest test that runs every permission key through both paths for all 9 role templates
   - Assert zero divergence (9 templates x 65 permissions = 585 assertions)

3. **Expand Jest coverage to 90%+ on critical paths**: Current thresholds are 80/60/70/80. Target 90/80/85/90 for:
   - `ProvisioningSaga.ts` (7-step + compensation)
   - `GraphBatchEnforcer.ts` (coalescence + backpressure)
   - `permissions.ts` + `toolPermissionMap.ts` (all 65 keys)
   - `ListThresholdGuard.ts` (all threshold levels)
   - Workflow machines (goNoGoMachine, pmpApprovalMachine, commitmentApprovalMachine)

4. **Storybook coverage expansion**: Currently 9 story files for 52 shared components (17% coverage). Add stories for:
   - HbcTanStackTable (with virtualization states: empty, loading, 500+ rows)
   - ProvisioningStatusStepper (all step states + compensation)
   - HeaderUserMenu (with/without dev tools)
   - RoleGate / FeatureGate (permitted/denied states)
   - SlideDrawer (open/closed, form variants)
   - Target: 25+ story files (48% coverage of shared components)

5. **Mutation testing pilot**: Introduce Stryker or equivalent on `ProvisioningSaga.ts` and `GraphBatchEnforcer.ts` to validate test quality beyond line coverage. Target: 80%+ mutation score on these two critical files.

6. **E2E route completeness audit**: Map all 136 routes to Playwright coverage. Identify untested routes, prioritize by risk (provisioning, admin, workflow routes first). Target: 60%+ route coverage in E2E.

#### Deliverables
- Permission matrix E2E suite (54+ new Playwright tests)
- Dual-path parity test suite (585 assertions)
- Jest coverage ramp to 90/80/85/90 on critical paths
- 25+ Storybook stories (up from 9)
- Mutation testing report for saga + enforcer
- Route coverage audit document

#### Success Criteria
- All 6 roles tested against all 6 workspace landings (36 E2E tests passing)
- Zero permission divergence between PermissionEngine and ROLE_PERMISSIONS fallback
- Jest coverage: statements 90%, branches 80%, functions 85%, lines 90% on critical path files
- Storybook: 25+ story files with Chromatic visual regression active
- Mutation score > 80% on ProvisioningSaga + GraphBatchEnforcer
- E2E route coverage > 60% (82+ of 136 routes touched)
- Total test count > 1,100 (up from ~940)

#### CLAUDE.md Sections to Update
- `§7` (test count update)
- `§15` (Phase 7 test metrics)
- `§16` (add testing pitfalls for permission dual-path)

#### SKILL.md Files
- Update `hbc-testing-coverage-enforcement-spfx/SKILL.md` with 90%+ targets and mutation testing
- Update `tanstack-jest-testing-patterns-spfx/SKILL.md` with permission matrix patterns
- Update `permission-system/SKILL.md` with dual-path parity test requirements

---

### Stage 5: Accessibility & Feature-Flag Debt Cleanup

#### Sub-Tasks

1. **Expand axe WCAG 2.2 AA coverage**: Currently 8 routes tested. Expand to:
   - All workspace landing pages (6 workspaces = 6 new route tests)
   - All form-heavy pages (Lead Detail, Estimating Kick-Off, SiteProvisioningWizard, template CRUD)
   - All modal/drawer interactions (SlideDrawer, ConfirmDialog, CommandPalette)
   - Target: 20+ routes with axe scans

2. **Resolve aria-hidden-focus suppression**: The `aria-hidden-focus` rule is globally disabled due to Fluent UI Tabster false positives. Investigate:
   - Which specific components trigger the false positive
   - File Fluent UI issue or apply targeted `data-tabster` attributes
   - Re-enable the rule with targeted exclusions instead of global suppression

3. **Keyboard navigation audit**: Test all critical workflows keyboard-only:
   - Tab order through AppLauncher → ContextualSidebar → main content
   - Enter/Space on all interactive table cells (inline edit)
   - Escape to close SlideDrawer, CommandPalette, ConfirmDialog
   - Arrow keys in accordion sidebar groups

4. **Feature flag debt cleanup**: 19 flags are disabled by default. Audit each:
   - **Candidates for removal** (dead flags): Flags that gate completed features with no rollback risk
   - **Candidates for enabling**: `VirtualizedListsV1` (virtualization is production-ready), `GraphBatchingEnabled` (enforcer is production-ready)
   - **Candidates for consolidation**: Multiple `InfinitePaging_*` flags could merge into single `InfinitePagingEnabled`
   - **Document each flag's lifecycle status** in a flag registry table

5. **Responsive accessibility**: Add Playwright viewport tests:
   - Mobile (375x812): Verify MobileBottomNav renders, sidebar collapses
   - Tablet (768x1024): Verify sidebar overlay mode
   - Verify touch targets >= 44x44px on mobile viewport

6. **Color contrast audit**: Verify all HBC_COLORS tokens meet WCAG 2.2 AA contrast ratios (4.5:1 text, 3:1 UI components) against both light and dark backgrounds.

#### Deliverables
- 20+ routes with axe WCAG 2.2 AA scans (up from 8)
- aria-hidden-focus resolution (targeted exclusions, not global suppression)
- Keyboard navigation test suite
- Feature flag registry document with lifecycle status per flag
- Responsive a11y Playwright tests (mobile + tablet)
- Color contrast audit report

#### Success Criteria
- Zero axe violations on 20+ routes (WCAG 2.2 AA)
- aria-hidden-focus rule re-enabled with zero false positives
- All critical workflows completable keyboard-only (verified via Playwright)
- Feature flag count reduced by 3+ (dead flag removal) or consolidated
- All touch targets >= 44x44px on mobile viewport
- All text colors meet 4.5:1 contrast ratio against their background

---

### Stage 6: Scalability & Reusable Component Library

#### Sub-Tasks

1. **Seed `@hbc/ui-components` package**: Extract the most reusable shared components from `src/webparts/hbcProjectControls/components/shared/` into a new package at `packages/hbc-ui-components/`. Initial candidates (no business logic, pure presentation):
   - HbcButton, HbcCard, HbcEmptyState, HbcField
   - HbcEChart (chart wrapper)
   - ConfirmDialog, CollapsibleSection
   - SkeletonLoader, ErrorBoundary
   - HbcMotion (motion tokens)
   - Target: 10–12 components in seed package

2. **Package structure**: Set up `packages/hbc-ui-components/` with:
   - `package.json` (name: `@hbc/ui-components`, private: true initially)
   - TypeScript config extending root
   - Barrel export (`index.ts`)
   - Jest config for component tests
   - Storybook integration (stories co-located)

3. **Design token extraction**: Move `theme/tokens.ts` (HBC_COLORS) and `theme/hbcTheme.ts` into `@hbc/ui-components` so they're shareable across Gen 1 (SPFx), Gen 2 (PWA), and Gen 3 (Mobile).

4. **Deprecate ProjectControlsPlan.rtf**: Convert any remaining actionable content to markdown in `.claude/plans/`. Add `.gitattributes` entry to prevent future RTF additions. Remove from active documentation references.

5. **ListThresholdGuard expansion**: Currently only applied to Audit_Log. Extend to:
   - Provisioning_Log (grows with each provisioning operation)
   - Leads_Master (growing list in active BD organizations)
   - Add configuration table mapping list names to custom thresholds

6. **Lazy chunk audit and optimization**: Verify all 14 monitored chunks maintain isolation:
   - lib-xstate-workflow: only xstate imports
   - lib-signalr-realtime: only @microsoft/signalr
   - lib-echarts-runtime: only echarts/core modules
   - lib-export-pdf/excel/canvas: only export libraries
   - Detect any cross-chunk contamination via webpack stats analysis

#### Deliverables
- `packages/hbc-ui-components/` with 10–12 seed components
- Design tokens extracted and shared
- RTF deprecated, markdown canonical
- ListThresholdGuard applied to 3+ lists
- Chunk isolation audit report
- Updated `CODE_ARCHITECTURE_GUIDE.md` with package structure

#### Success Criteria
- `@hbc/ui-components` compiles independently (`tsc --noEmit` in package dir)
- Zero circular dependencies between `@hbc/ui-components` and `@hbc/sp-services`
- Design tokens importable from `@hbc/ui-components/theme`
- No RTF files in active documentation references
- ListThresholdGuard active on 3+ SP lists
- All lazy chunks contain only their designated imports (verified via bundle analyzer)

---

### Stage 7: CI/CD Quality Gates

#### Sub-Tasks

1. **Performance regression gate**: Add to CI pipeline (`ci.yml` Build & Validate job):
   - Bundle size delta check: fail if entrypoint grows > 50 KB from baseline
   - Lazy route coverage: already enforced at 90% (verify still active)
   - Add total test count assertion: fail if count drops below previous baseline

2. **Chromatic visual regression activation**: Currently Chromatic runs with `continue-on-error: true` and no token. Configure:
   - Set `CHROMATIC_PROJECT_TOKEN` secret in GitHub
   - Remove `continue-on-error` — make visual regression blocking on PRs
   - Auto-accept on main branch pushes (already configured)

3. **Coverage trend tracking**: Add coverage artifact upload to CI:
   - Jest coverage JSON saved as build artifact
   - Fail if coverage drops below thresholds (already enforced)
   - Add badge to README.md showing current coverage %

4. **E2E stability gate**: Add flaky test detection:
   - Run E2E suite with `--retries 2` (already configured)
   - Track retry rate — alert if > 10% of tests require retry
   - Add E2E report artifact with pass/fail/retry breakdown

5. **Dependency audit gate**: Add `npm audit --production` to CI:
   - Fail on critical/high vulnerabilities
   - Warn on moderate
   - Exclude known false positives via `.nsprc` or `audit-resolve.json`

6. **PR validation enhancement** (`pr-validation.yml`):
   - Require CHANGELOG.md update in every PR (diff check)
   - Require at least one test file changed if source files changed
   - Block merge if any `console.log` (non-debug) added to production code

7. **Branch protection rules documentation**: Document required status checks for `feature/hbc-suite-stabilization` → `main` merge:
   - All 4 CI jobs must pass
   - Chromatic approved (no unreviewed visual changes)
   - CHANGELOG.md updated
   - No `console.log` in production code

#### Deliverables
- Enhanced CI pipeline with performance regression gate
- Chromatic visual regression blocking on PRs
- Coverage badge in README.md
- Flaky test detection and alerting
- Dependency audit gate
- PR validation rules (CHANGELOG, test, console.log checks)
- Branch protection documentation

#### Success Criteria
- CI fails on bundle regression > 50 KB
- Chromatic blocks PR merge on unreviewed visual changes
- Coverage badge shows accurate current % in README
- E2E retry rate < 10% (measured over 5 consecutive runs)
- Zero critical/high npm audit findings in production deps
- Every PR touching src/ includes CHANGELOG.md update (enforced)
- No `console.log` in production code (enforced via ESLint rule or CI check)

---

### Phase 7 Exit Criteria (10/10 Gate)

All of the following must be met before Phase 7 is marked complete:

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | Documentation fully synchronized | Zero broken cross-references. CLAUDE.md < 35K chars. All 8 guides updated post-6A. SKILLS_OVERVIEW lists 22 skills. |
| 2 | Construction-scale performance validated | HbcTanStackTable < 200ms at 500 rows. ECharts < 500ms at 200 data points. Entrypoint < 1.9 MB raw. |
| 3 | Security hardened | Server-side flag enforcement on 3+ critical flags. GitOps sync input validated. GraphBatchEnforcer backpressure active. Idempotency replay detection. No OWASP findings. |
| 4 | Permission coverage complete | 6-role x 6-workspace E2E matrix passing. Dual-path parity: 585 assertions, zero divergence. Jest 90/80/85/90 on critical paths. |
| 5 | Accessibility debt cleared | 20+ routes axe-clean (WCAG 2.2 AA). aria-hidden-focus re-enabled. Keyboard-only workflows verified. Mobile touch targets >= 44px. |
| 6 | Feature flag debt reduced | 3+ dead flags removed or consolidated. Flag registry document maintained. |
| 7 | Component library seeded | `@hbc/ui-components` with 10+ components compiling independently. Design tokens extracted. |
| 8 | CI gates enforced | Bundle regression gate active. Chromatic blocking. Dependency audit active. CHANGELOG enforcement active. |
| 9 | Total test count > 1,100 | Up from ~940. Includes 54+ new permission E2E + expanded Jest + expanded Storybook. |
| 10 | `npm run verify:sprint3` clean | Full sprint gate passes with zero warnings, zero failures, on construction-scale mock data. |

### Integration with Remediation-First Roadmap

Phase 7 is the gate between stabilization (Phases 0–6A) and forward development (Phases 8+). No new feature work, workspace additions, or Gen 2/3 migration may begin until all 10 exit criteria are met. This ensures:

- **Phases 8–13** (Schedule v2, Gen 2 PWA, Gen 3 Mobile, Post-Launch) inherit a hardened, documented, tested, and performant codebase
- **`@hbc/ui-components`** seed enables Gen 2/3 component sharing without duplicating the 52-component shared library
- **CI gates** prevent regression during the high-velocity Phase 8+ development
- **Construction-scale validation** ensures the system works at real HBC project volumes before stakeholder deployment

**Phase 8: Core Modules Stabilization (Q2 2026)**  
- Estimating, Scheduling, Budget, Risk, full Project Hub (37 routes) using Phase 7 stack. Virtualization, optimistic mutations.

**Phase 9: Integrations & Feature Completion (Q3 2026)**  
- Procore/BambooHR connectors, Analytics Hub polish, original Phase 4 scope on remediated foundation.

**Phase 10: Gen 1 Production Release & Handover (Sep–Oct 2026)**  
- E2E testing, SOC2 audit, SPFx deploy, training, monitoring.

**Phase 11: Gen 2 – Hosted PWA (Q4 2026)**  
- Azure Static Web Apps PWA with offline + DataProviderFactory (Azure SQL focus).

**Phase 12: Gen 3 – Native Mobile (Q1 2027)**  
- React Native QA/QC & Safety flagship with photo/GPS/offline sync.

**Phase 13: Post-Launch Expansion (Ongoing)**  
- SAGE Intact, AI analytics, new modules.

## Verification
1. CLAUDE.md §§ complete with cross-references and this plan in §18.  
2. This file is the single source of truth; referenced from README.md and CLAUDE.md.  
3. All SKILL.md followed.  
4. `npm run verify:sprint` passes after every phase.  
5. Owner approval required for any deviation.

**Governance Note:** This plan is the single source of truth for the entire effort. Phase 7 must complete before marking stabilization done or commencing any feature work. Any deviation requires owner approval and immediate CLAUDE.md §18 synchronization.