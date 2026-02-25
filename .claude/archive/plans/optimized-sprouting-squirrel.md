# Plan: Phase 7 Stage 4 — Testing & Permission Completeness

## Context

Phase 7 is the remediation gate between stabilization (Phases 0–6A) and forward development (Phases 8+). Stage 4 hardens test coverage across six domains: 6-role permission matrix E2E, dual-path permission parity, critical-path Jest coverage enforcement, Storybook expansion, mutation testing pilot, and route completeness audit.

**Current baseline (commit `7ad0d81`):**
- Jest: 945 tests / 58 suites. sp-services coverage: 92/80/90/93 (exceeds global target but no per-file enforcement)
- Playwright: 24 spec files, ~150+ E2E tests
- Storybook: 27 story files (exceeds 25 target — but missing critical components)
- Mutation testing: Not installed
- Routes: ~154 across 7 workspace route files
- Permission system: Dual-path (ROLE_PERMISSIONS fallback + PermissionEngine/TOOL_DEFINITIONS). 14 legacy roles, 6 canonical, 9 templates, ~90 permission keys

## Execution Plan (4 Waves)

### Wave 1: Permission Parity + Jest Coverage Hardening

#### 1A. Dual-Path Parity Test

**Create** `packages/hbc-sp-services/src/utils/__tests__/permissions.dualpath.test.ts` (~35 tests, 585+ assertions):

- `describe('ROLE_PERMISSIONS vs PermissionEngine consistency')` — For each of 14 legacy roles: resolve via ROLE_PERMISSIONS, then via engine path (resolveToolPermissions + template from `permissionTemplates.json` + `securityGroupMappings.json`). Assert engine is **superset** of legacy (engine adds base-read perms). Any legacy permission missing from engine = failure.
- `describe('Template completeness')` — 9 templates: all tool groups populated, all levels defined.
- `describe('Canonical role normalization')` — 6 canonical roles: normalizeRoleName preserves permission semantics through both paths.
- `describe('Negative assertions')` — Read-Only template grants zero admin perms; BD Rep lacks admin:config; Estimating lacks buyout:manage.

**Imports:** `ROLE_PERMISSIONS`, `PERMISSIONS` from `../permissions`; `resolveToolPermissions`, `TOOL_DEFINITIONS` from `../toolPermissionMap`; `permissionTemplates.json`, `securityGroupMappings.json` from `../../mock/`; `normalizeRoleName` from `../../models/IRoleConfiguration`.

#### 1B. Coverage Gap Tests

**Create** `packages/hbc-sp-services/src/utils/__tests__/permissions.coverage.test.ts` (~20 tests):

- `resolvePermissionsFromConfig` — inactive configs, empty configs, unknown roles
- `hasGlobalAccess` — no matching config, multiple roles with mixed isGlobal
- `resolveNavGroupAccess` — mixed config/fallback paths
- `resolveToolPermissions` — all 4 levels (NONE/READ_ONLY/STANDARD/ADMIN) across tool definitions
- Granular flag override merging

#### 1C. Per-File Coverage Thresholds

**Modify** `packages/hbc-sp-services/jest.config.js` — Add per-file overrides (90/80/85/90) for:
- `./src/utils/permissions.ts`
- `./src/utils/toolPermissionMap.ts`
- `./src/services/ProvisioningSaga.ts`
- `./src/services/GraphBatchEnforcer.ts`
- `./src/utils/ListThresholdGuard.ts`

Global thresholds stay at 80/60/70/80.

---

### Wave 2: Storybook Critical Component Stories (parallel to Wave 1)

Add 5 missing critical components (27 → 32 stories).

| # | File | Component | Stories |
|---|------|-----------|---------|
| 1 | `src/.../shared/HeaderUserMenu.stories.tsx` | HeaderUserMenu | Default, WithDevTools, WithoutDevTools, SuperAdminView |
| 2 | `src/.../shared/ProvisioningStatusStepper.stories.tsx` | ProvisioningStatusStepper | InProgress, Completed, Failed, Compensating, ReducedMotion |
| 3 | `src/.../shared/SlideDrawer.stories.tsx` | SlideDrawer | Open, Closed, WithForm, LargeContent |
| 4 | `src/.../navigation/AppLauncher.stories.tsx` | AppLauncher | AllWorkspaces, LimitedAccess, WithProject, NoProject |
| 5 | `src/.../navigation/ContextualSidebar.stories.tsx` | ContextualSidebar | Precon, Operations, Admin, Collapsed |

**Pattern:** MockDataService singleton from `preview.ts`. Context wrappers: StaticAppContext + ProjectContext + UIContext. MemoryRouter for navigation components. Follow RoleGate.stories.tsx pattern.

---

### Wave 3: Playwright Permission Matrix E2E + Route Audit (parallel to Waves 1-2)

#### 3A. Permission Matrix E2E

**Create** `playwright/permission-matrix.e2e.spec.ts` (~57 tests):

**Role-to-fixture mapping:**
| Canonical | Fixture Key | Label |
|-----------|------------|-------|
| Admin | SuperAdmin | DEV: Super-Admin |
| BDM | BDRepresentative | BD Representative |
| Estimating Coord. | EstimatingCoordinator | Estimating Coordinator |
| Project Manager | OperationsTeam | Project Executive |
| Leadership | ExecutiveLeadership | President / VP Operations |
| Project Executive | DepartmentDirector | Department Director |

**Positive tests (~36):** Each role → each permitted workspace landing. Assert main content visible.
- Admin: 6 workspaces (all)
- BDM: 3 (hub, preconstruction, shared-services)
- Estimating Coordinator: 3 (hub, preconstruction, shared-services)
- Project Manager: 4 (hub, operations, site-control, shared-services)
- Leadership: 6 (all)
- Project Executive: 5 (hub, preconstruction, operations, shared-services, site-control)

**Denial tests (~18):** Each role → unauthorized workspaces. Assert access denied or redirect.
- BDM denied: /admin, /operations, /site-control
- Estimating denied: /admin, /operations, /site-control
- PM denied: /admin, /preconstruction + no admin sidebar items
- PE denied: /admin + scoped restrictions
- Additional sidebar-level denials

**Implementation:** roleFixture `switchRole()`, hash routing `page.goto('/#/<path>')`, networkidle waits.

#### 3B. Route Coverage Audit

**Create** `.claude/plans/route-coverage-audit.md` — Map all ~154 routes against Playwright coverage. Categorize: Covered / Partially / Not Covered. Target >60%.

---

### Wave 4: Mutation Testing Pilot (after Wave 1)

#### 4A. Install Stryker

In `packages/hbc-sp-services/`:
- `@stryker-mutator/core`, `@stryker-mutator/jest-runner`, `@stryker-mutator/typescript-checker`

#### 4B. Configure

**Create** `packages/hbc-sp-services/stryker.config.mjs`:
- Jest runner, TypeScript checker, perTest coverage analysis
- Mutate: `ProvisioningSaga.ts` + `GraphBatchEnforcer.ts`
- Thresholds: high=80, low=60, break=60
- Timeout 60s, concurrency 2

**Modify** `packages/hbc-sp-services/package.json` — Add `"test:mutation": "stryker run"` script.

#### 4C. Mutation-Killing Tests

**Create** `packages/hbc-sp-services/src/services/__tests__/ProvisioningSaga.mutation.test.ts` (~10 tests):
- Exact compensation step count + reverse order
- IdempotencyToken on every log entry
- Broadcast payload exact values (step #, status, progress %)
- Boundaries: compensation at step 1 vs step 7
- ListThresholdGuard + GraphBatchEnforcer integration branches

**Create** `packages/hbc-sp-services/src/services/__tests__/GraphBatchEnforcer.mutation.test.ts` (~10 tests):
- COALESCENCE_WINDOW_MS timing boundaries (9ms/10ms/11ms)
- FLUSH_THRESHOLD boundary (2/3/4)
- MAX_QUEUE_DEPTH boundary (49/50/51)
- Backpressure error exact message format
- Dispose mid-flush, multiple sequential flushes, audit log values

---

## Post-Implementation

### Documentation Updates

**Modify** 3 SKILL.md files:
- `hbc-testing-coverage-enforcement-spfx` — 90/80/85/90 per-file targets, mutation testing, permission matrix E2E
- `tanstack-jest-testing-patterns-spfx` — Dual-path parity pattern, mutation-killing techniques
- `permission-system` v1.1→v1.2 — Dual-path parity requirements, E2E permission matrix

**Modify** `CLAUDE.md` — §7 (test counts), §15 (Phase 7S4), §16 (testing pitfalls), §18.8 (Stage 4 complete)
**Modify** `CHANGELOG.md` — Phase 7S4 entry

## Critical Files

| File | Action |
|------|--------|
| `packages/hbc-sp-services/src/utils/__tests__/permissions.dualpath.test.ts` | CREATE |
| `packages/hbc-sp-services/src/utils/__tests__/permissions.coverage.test.ts` | CREATE |
| `packages/hbc-sp-services/jest.config.js` | MODIFY |
| `src/.../shared/HeaderUserMenu.stories.tsx` | CREATE |
| `src/.../shared/ProvisioningStatusStepper.stories.tsx` | CREATE |
| `src/.../shared/SlideDrawer.stories.tsx` | CREATE |
| `src/.../navigation/AppLauncher.stories.tsx` | CREATE |
| `src/.../navigation/ContextualSidebar.stories.tsx` | CREATE |
| `playwright/permission-matrix.e2e.spec.ts` | CREATE |
| `.claude/plans/route-coverage-audit.md` | CREATE |
| `packages/hbc-sp-services/stryker.config.mjs` | CREATE |
| `packages/hbc-sp-services/package.json` | MODIFY |
| `packages/hbc-sp-services/src/services/__tests__/ProvisioningSaga.mutation.test.ts` | CREATE |
| `packages/hbc-sp-services/src/services/__tests__/GraphBatchEnforcer.mutation.test.ts` | CREATE |
| 3 SKILL.md files | MODIFY |
| `CLAUDE.md` | MODIFY |
| `CHANGELOG.md` | MODIFY |

## Reuse

- `ROLE_PERMISSIONS` + `PERMISSIONS` (permissions.ts) — Parity baseline
- `resolveToolPermissions` + `TOOL_DEFINITIONS` (toolPermissionMap.ts) — Engine path
- `permissionTemplates.json` + `securityGroupMappings.json` (mock/) — Template data
- `normalizeRoleName` + `LEGACY_ROLE_MAP` (IRoleConfiguration.ts) — Canonical mapping
- `roleFixture.ts` (playwright/fixtures/) — E2E role switching
- `workspaceConfig.ts` (navigation/) — Workspace-role mappings
- MockDataService singleton in `.storybook/preview.ts` + HbcAppDecorator — Story data
- Existing story patterns (RoleGate.stories.tsx, HbcTanStackTable.stories.tsx)

## Verification

1. `cd packages/hbc-sp-services && volta run --node 22.14.0 -- npx jest --coverage` — All tests pass, per-file thresholds met (~1010+ tests)
2. `npx storybook build --quiet` — 32 stories build clean
3. `npx playwright test playwright/permission-matrix.e2e.spec.ts` — 57+ tests pass
4. `cd packages/hbc-sp-services && volta run --node 22.14.0 -- npx stryker run` — Mutation score >= 80%
5. `volta run --node 22.14.0 -- npx tsc --noEmit` — TypeScript clean
6. Commit: `test(phase7): complete Stage 4 Testing & Permission Completeness – permission matrix, dual-path parity, 90%+ coverage, Storybook expansion (Phase 7 Stage 4)`
