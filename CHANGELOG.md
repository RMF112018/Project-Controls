# Changelog

All notable changes to HBC Project Controls will be documented in this file.

## [2026-02-25] - Phase 7 Stage 4 - test(phase7) - Testing & Permission Completeness

### Added
- `packages/hbc-sp-services/src/utils/__tests__/permissions.dualpath.test.ts` — 66 dual-path parity tests verifying ROLE_PERMISSIONS (legacy) vs PermissionEngine (TOOL_DEFINITIONS + permissionTemplates.json) consistency. 108 known gaps baselined as regression guards.
- `packages/hbc-sp-services/src/utils/__tests__/permissions.coverage.test.ts` — 20 permission coverage gap tests (inactive configs, empty configs, deduplication, unknown roles, mixed paths, all 4 permission levels).
- `packages/hbc-sp-services/src/services/__tests__/ProvisioningSaga.mutation.test.ts` — 38 mutation-killing tests targeting boundary values (token format, compensation reverse order, broadcast progress, siteAlias sanitization, Step 5 dual-path, audit logging precision).
- `packages/hbc-sp-services/src/services/__tests__/GraphBatchEnforcer.mutation.test.ts` — 32 mutation-killing tests targeting boundary values (coalescence timing 9ms/10ms, flush threshold 2/3, backpressure 49/50, high water mark, dispose semantics, feature OFF passthrough).
- `packages/hbc-sp-services/stryker.config.mjs` — Stryker Mutator configuration targeting ProvisioningSaga.ts + GraphBatchEnforcer.ts. Jest runner, TypeScript checker. Thresholds: high=80, break=60.
- `playwright/permission-matrix.e2e.spec.ts` — 70 Playwright E2E tests covering 6 canonical roles × workspace access (31 positive, 18 denial, 21 sidebar/page-level checks).
- `.claude/plans/route-coverage-audit.md` — Route coverage audit document (136 routes across 7 workspaces, 10.3% Playwright coverage baseline).
- 5 new Storybook stories (27→32 total): `HeaderUserMenu.stories.tsx`, `ProvisioningStatusStepper.stories.tsx`, `SlideDrawer.stories.tsx`, `AppLauncher.stories.tsx`, `ContextualSidebar.stories.tsx`.

### Changed
- `packages/hbc-sp-services/jest.config.js` — Per-file coverage thresholds ratcheted: `permissions.ts` 90/80/85/90, `toolPermissionMap.ts` 90/80/85/90, `ProvisioningSaga.ts` 89/60/85/92, `GraphBatchEnforcer.ts` 96/90/77/97, `ListThresholdGuard.ts` 90/80/85/90.
- `packages/hbc-sp-services/package.json` — Added `test:mutation` script and Stryker devDependencies (`@stryker-mutator/core` ^9.5.1, `@stryker-mutator/jest-runner` ^9.5.1, `@stryker-mutator/typescript-checker` ^9.5.1).
- 3 SKILL.md version bumps: `hbc-testing-coverage-enforcement-spfx` v1.0→v1.1, `tanstack-jest-testing-patterns-spfx` v1.0→v1.1, `permission-system` v1.1→v1.2.
- CLAUDE.md §7 (Phase 7S4 entry), §15 (Phase 7S4 status), §16 (+5 new pitfalls), §18.8 (Stage 4 completion block).

### Verified
- TypeScript: clean (0 errors), Jest: 1101 tests / 62 suites (0 failures), Coverage: 92.24% statements / 80.71% branches / 90.03% functions / 93.03% lines
- All per-file coverage thresholds met
- IDataService method count: 285/285 — data layer complete

## [2026-02-24] - Phase 7 Stage 3 - security(phase7) - Security Hardening (GitOps & Provisioning)

### Added
- `packages/hbc-sp-services/src/utils/odataSanitizer.ts` — OData injection prevention (sanitizeODataString, sanitizeODataNumber, safeODataEq, safeODataSubstringOf).
- `packages/hbc-sp-services/src/utils/featureFlagGuard.ts` — Server-side feature flag enforcement (assertFeatureFlagEnabled, FeatureFlagViolationError).
- `packages/hbc-sp-services/src/utils/idempotencyTokenValidator.ts` — Crypto-safe token generation (generateCryptoHex4), validation with 24h expiry and replay detection.
- `packages/hbc-sp-services/src/utils/templateSyncGuard.ts` — Template sync state machine (VALID_TRANSITIONS), sync lock (acquireSyncLock/releaseSyncLock), content validation (XSS patterns), multi-approver gates (assertSyncApproved).
- `packages/hbc-sp-services/src/utils/escalationGuard.ts` — Permission escalation prevention (detectEscalation, assertNotSelfEscalation), rate limiting (checkRateLimit 10/60s).
- `packages/hbc-sp-services/src/utils/graphScopePolicy.ts` — Least-privilege Graph API scope enforcement (GRAPH_SCOPE_POLICY, assertSufficientScope).
- `IDataService.getProvisioningLogByToken(token)` — +1 method (284→285) for saga rollback lookup.
- `ProvisioningSaga.rollback(projectCode, originalToken)` — Manual rollback with compensation tagging.
- `IProvisioningLog` expansion: templateVersion, templateType, rollbackFromToken fields.
- `ISagaContext` expansion: templateVersion. `ICompensationResult` expansion: compensationType. `ISagaExecutionResult` expansion: templateVersion, templateType.
- 7 new AuditAction values: BackpressureRejected, FeatureFlagViolation, PermissionEscalationBlocked, IdempotencyReplayDetected, TemplateSyncTransitionViolation, ManualRollbackInitiated, ManualRollbackCompleted.
- GraphBatchEnforcer: MAX_QUEUE_DEPTH=50, BackpressureError, highWaterMark tracking, logBackpressure.
- `.claude/PERMISSION_STRATEGY.md` — Pentest-prep permission strategy document.
- 5 utility test suites (43 tests) + 1 integration test suite (6 tests) + 8 saga tests + 5 enforcer tests + 4 roleConfig tests = ~66 new tests (945 total).

### Changed
- `SharePointDataService.getLeadsByStage()` and `searchLeads()` — OData filters now use safeODataEq/safeODataSubstringOf.
- `ProvisioningSaga.generateIdempotencyToken` — replaced Math.random() with generateCryptoHex4().
- `MockDataService.createRoleConfiguration` / `updateRoleConfiguration` — escalation prevention + rate limiting guards.
- `MockDataService` template methods — feature flag enforcement + content validation guards.
- 4 SKILL.md version bumps: resilient-data-operations v1.5, provisioning-engine v1.4, permission-system v1.1, site-template-management v1.1.
- CLAUDE.md §5 (escalation prevention), §7 (285 methods), §15 (Phase 7S3), §16 (new pitfalls).
- SECURITY_ANALYSIS.md §10 (Phase 7S3 remediation summary).
- SECURITY_PERMISSIONS_GUIDE.md (Phase 7S3 agent checklist).

## [2026-02-24] - Phase 7 Stage 2 - perf(phase7) - Performance Optimization for Construction-Scale Data

### Added
- Construction-scale benchmark data generators (`packages/hbc-sp-services/src/mock/generators/`): buyout (500), audit (5000), estimating (300), schedule (1000), leads (200). Seeded PRNG for deterministic output.
- `MockDataService` `benchmarkMode` constructor param — activates generators instead of JSON fixtures.
- `QUERY_GC_TIMES` per-domain gc times (default 20min, infinite 5min, auditLog 3min, reference 30min).
- `INFINITE_QUERY_MAX_PAGES = 50` — prevents infinite query page accumulation.
- `MemoizedTableRow` component — `React.memo` with custom equality (row.id + selection + data ref).
- `useTransition` for sort/filter/group, `useDeferredValue` for globalFilter in `HbcTanStackTable`.
- Adaptive overscan in `useVirtualRows`: <500 rows → 8, 500-1000 → 5, >1000 → 3.
- `disableRowMemoization` prop on `HbcTanStackTable` for opt-out.
- `data-perf-table-rows` attribute for Playwright performance queries.
- `HbcEChart` `large`, `progressiveRender`, `sampling` props for GPU acceleration and data downsampling.
- `usePerformanceMarker(label, {autoMeasure?})` hook wrapping `performanceService` singleton.
- Wired `usePerformanceMarker` into `AnalyticsHubDashboardPage` (page load telemetry).
- 26 generator Jest tests + 8 cache policy tests + 6 table perf tests + 3 hook tests + 4 Playwright E2E tests.
- `playwright/performance-benchmarks.e2e.spec.ts` — table render, virtualization, ECharts, memory leak detection.

### Changed
- `useInfiniteSharePointList`: accepts `gcTime` and `maxPages` params with per-domain defaults.
- `PERFORMANCE_OPTIMIZATION_GUIDE.md` §1 and §3 updated with Phase 7 Stage 2 benchmarks and patterns.
- 3 SKILL.md files updated to v1.1: spfx-performance-diagnostics, tanstack-query-and-virtualization, schedule-performance-optimization.

## [2026-02-24] - Phase 7 Roadmap - docs(roadmap) - Full Detailed Phase 7 Remediation Plan

### Added
- `.claude/plans/hbc-stabilization-and-suite-roadmap.md` updated with full detailed Phase 7: Comprehensive Remediation plan (7 stages, 42 sub-tasks, measurable success criteria, 10/10 exit gate)
- CLAUDE.md §18.3 (roadmap committed) and §18.4 (detailed to-do integration) appended
- `.claude/archive/` directory created

### Changed
- `ProjectControlsPlan.rtf` deprecated and moved to `.claude/archive/ProjectControlsPlan.rtf`

### Phase 7 Stages
1. Documentation Hygiene (6 sub-tasks)
2. Performance Optimization for Construction-Scale Data (6 sub-tasks)
3. Security Hardening — GitOps & Provisioning (6 sub-tasks)
4. Testing & Permission Completeness (6 sub-tasks)
5. Accessibility & Feature-Flag Debt Cleanup (6 sub-tasks)
6. Scalability & Reusable Component Library (6 sub-tasks)
7. CI/CD Quality Gates (7 sub-tasks)

## [2026-02-24] - Phase 6A - 3c61d6b - Site Template Management & GitOps Sync

### Added
- `ISiteTemplate` model with `SiteTemplateType` union (`Default` | `Commercial` | `Luxury Residential`)
- `TemplateSyncStatus` enum (`Idle` / `Syncing` / `Success` / `Failed`)
- 3 new `AuditAction` values: `TemplateSyncStarted`, `TemplateSyncCompleted`, `TemplateSyncFailed`
- `EntityType.SiteTemplate` for audit logging
- 8 new `IDataService` methods (276 → 284 total): `getSiteTemplates`, `getSiteTemplateByType`, `createSiteTemplate`, `updateSiteTemplate`, `deleteSiteTemplate`, `syncTemplateToGitOps`, `applyTemplateToSite`, `syncAllTemplates`
- `SITE_TEMPLATES_COLUMNS` in `columnMappings.ts`, `HUB_LISTS.SITE_TEMPLATES` + `CACHE_KEYS.SITE_TEMPLATES` in `constants.ts`
- `IProvisioningInput.templateName` optional field for dual-path saga Step 5
- ProvisioningSaga Step 5 dual-path: `templateName` present → `applyTemplateToSite`; absent → legacy `copyTemplateFiles`
- MockDataService + SharePointDataService implementations for all 8 methods
- Admin ProvisioningPage: TabList with "Provisioning Logs" + "Site Templates" tabs
- Site Templates tab: KPI strip, `HbcTanStackTable` with sortable columns, `SlideDrawer` for create/edit
- Feature flag `SiteTemplateManagement` (id 60, default OFF, `SuperAdmin`-only)
- `site-template-management` SKILL v1.0
- 19 new Jest tests (`SiteTemplateService.test.ts`)
- 9 new Playwright E2E tests (`site-templates.e2e.spec.ts`)
- Mock fixture data: 3 site templates in `siteTemplates.json`

### Changed
- `provisioning-engine` SKILL → v1.3 (dual-path Step 5 documentation)
- `resilient-data-operations` SKILL → v1.4 (template sync patterns)
- CLAUDE.md §1, §7, §15, §16 updated for Phase 6A

### Fixed
- **Edit button freeze**: Extracted inline `rowActions` arrow function to `renderRowActions` `useCallback` in `ProvisioningPage.tsx` — inline function created new reference every render, causing infinite synchronous re-render loop via `useSyncExternalStore` in `HbcTanStackTable`
- **Empty Site Templates tab**: Set feature flag `SiteTemplateManagement.Enabled` to `true` (was `false`, which short-circuited `isFeatureEnabled` before checking `EnabledForRoles`). Fixed `EnabledForRoles` role strings from camelCase (`"ExecutiveLeadership"`, `"SharePointAdmin"`) to match `RoleName` enum values with spaces (`"Executive Leadership"`, `"SharePoint Admin"`)

### Verified
- TypeScript: clean (0 errors), ESLint: 0 errors (15 pre-existing warnings), Jest: 845 tests (0 failures, 92.37% statement coverage)
- IDataService method count: 284/284 — data layer complete
- Dev server: Site Templates tab renders 3 templates, Edit opens SlideDrawer without freeze, Sync triggers GitOps mock

## [2026-02-24] - Phase 5C.1 - Provisioning Saga Resilience Integration & Polish

### Added
- `AuditAction.SagaCompensationFailure` enum value in `enums.ts`
- GraphBatchEnforcer + ListThresholdGuard wired into `ProvisioningSaga.ts` via clean DI (constructor injection from `ProvisioningService.ts`)
- ListThresholdGuard `checkThreshold('Audit_Log')` guard before all 3 saga `logAudit()` call sites
- GraphBatchEnforcer passthrough in Graph-touching saga steps (1, 3, 4)
- 3 new Playwright E2E scenarios in `provisioning-saga.e2e.spec.ts` (5 → 8 total)
  - Retry button visible on failed provisioning entries
  - Progress cell expands to show stepper details
  - Completed entries do not show retry button
- `.claude/skills/provisioning-engine/SKILL.md` v1.2 with Phase 5C.1 resilience integration section

### Changed
- `ProvisioningSaga` constructor extended: 2 → 4 params (+ optional `graphBatchEnforcer`, `listThresholdGuard`)
- `ProvisioningService.ts` passes singleton instances to saga constructor
- CLAUDE.md §15 Phase 5C.1 marked **COMPLETE**, §16 saga resilience rule added
- `.claude/skills/resilient-data-operations/SKILL.md` cross-reference updated to v1.2

### Verified
- TypeScript: clean, Jest: 900 tests (0 failures), Bundle: 0 byte delta, Playwright: 7/8 pass (1 pre-existing failure on test 3 — not caused by Phase 5C.1), all 3 new tests pass
- 100% fidelity to governing `phase-5c.1-cleanup.md` — Phase 5C now production-hardened with resilience integration

## [2026-02-24] - Phase 5B.1 - Workflow State Machines Fidelity & Polish

### Changed
- CLAUDE.md §7/§15/§16 updated — Phase 5B now marked **COMPLETE**
- `.claude/skills/workflow-state-machines/SKILL.md` bumped to v1.1 with Phase 5B implementation details
- `PMPPage.tsx` — dual-path workflow integration (useWorkflowMachine + useWorkflowTransition, WorkflowStateMachine flag gating)
- `WorkflowMachineFactory.ts` — safety comment documenting dual-path enforcement contract

### Added
- 5 new Playwright E2E scenarios in `workflow-state-machines.e2e.spec.ts` (3 → 8 total)
  - BD submits scorecard for director review
  - Director sees Go/No-Go page with workflow enabled
  - Non-permitted role sees no machine actions
  - Flag OFF hides machine actions completely
  - PMP page renders with dual-path support
- `enableWorkflowFlag()` Playwright helper for reusable flag toggle
- `PMP_EVENT_LABELS` mapping for pmpApproval machine event display names

### Verified
- GoNoGoPage.tsx already compliant (7-line wrapper, delegates to GoNoGoScorecard with useWorkflowMachine)
- TypeScript: clean, Jest: 900 tests (0 failures), Bundle: 0 byte delta, Playwright: 8/8 pass

## [2026-02-24] - Phase 5D.1 - HeaderUserMenu Consolidation

### Added
- `HeaderUserMenu` component (`shared/HeaderUserMenu.tsx`) — Fluent UI v9 Menu + Persona trigger in AppShell header
- `IDevToolsConfig` interface in `App.tsx` — typed prop chain for dev tools (role switcher, mode toggle)
- `devToolsConfig` threaded through `AppContext` for header consumption
- 8 new Jest tests for HeaderUserMenu (`shared/__tests__/HeaderUserMenu.test.tsx`)
- Targeted TanStack Query invalidation on role change (`['projects','pipeline','analytics','permissions','user']`)

### Changed
- Playwright `roleFixture.ts` rewritten: native `<select>` → Fluent `MenuItemRadio` interaction
- Playwright `mode-switch.spec.ts` updated for header menu-based mode switching
- Playwright `connectors.e2e.spec.ts` removed `force: true` workarounds (z-index overlay gone)
- AppShell header: replaced static `<span>` user display with `<HeaderUserMenu>`
- `dev/index.tsx`: removed `<RoleSwitcher>`, passes `devToolsConfig` to `<App>`
- ROLE_OPTIONS (15 entries) consolidated from `dev/RoleSwitcher.tsx` into `dev/index.tsx`

### Removed
- `dev/RoleSwitcher.tsx` — floating fixed-position (z-index 9999) role switcher panel entirely deleted
- `userName` and `version` Griffel styles from AppShell (replaced by HeaderUserMenu)

## [Unreleased]

### Added
- TanStack Router v1 as sole runtime router (hash history, 58 routes including root)
- 53 lazy-loaded routes (91.4% coverage): 46 via `lazyRouteComponent`, 7 via `createLazyRoute`
- 16 named webpack chunks: 3 fat-barrel phase chunks + 13 direct-lazy page chunks
- `RouteSuspenseFallback` — skeleton loading UI with `aria-live="polite"` for all route transitions
- `RouteErrorBoundary` — error display with retry for route-level errors (`role="alert"`)
- `defaultPendingComponent` + `defaultErrorComponent` on TanStack Router for automatic boundary coverage
- `React.startTransition()` wrapping all `navigate()` calls (TanStackAdapterBridge + useTransitionNavigate)
- 8 preload hints in `/operations` loader (schedule, buyout, precon, estimating, gonogo, admin-hub, PMP, monthly review)
- `scripts/verify-lazy-coverage.js` — static source scanner enforcing lazy route coverage >= 90%
- `lazyCoverage` section in `config/bundle-budget.spfx.json` with orphan/broken-reference detection
- CI step "Verify lazy-coverage" in build job (runs before bundle build for fast failure)
- `verify:lazy-coverage` and `verify:lazy-coverage:fail` npm scripts
- `verify:sprint3` now includes lazy-coverage gate
- `docs/route-map.md` — comprehensive route table, chunk strategy, boundary layers, preload inventory, performance metrics

### Changed
- Entrypoint: 1,963,674 → 2,013,856 raw bytes (+2.6%), 466,180 → 482,769 gzip bytes (+3.6%) — within 2 MB hard cap (83 KB headroom)
- All 58 routes now have automatic Suspense + ErrorBoundary coverage (was 0)
- Navigation is concurrent via `startTransition` across all 24+ page components
