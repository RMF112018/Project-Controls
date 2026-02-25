---
name: HBC Testing Coverage Enforcement SPFx
description: Phased ratcheting strategy, CI enforcement, gap analysis, and documentation hygiene to achieve and sustain >95% Jest coverage across sp-services and components projects in the SPFx + TanStack platform
version: 1.1
category: testing
triggers: coverage, 95%, ratchet, threshold, phase 1, phase 2, jest.config, pr-validation, test:ci, test:coverage, gap report, dreamy-wiggling-cookie, CLAUDE.md §15c, per-file thresholds, mutation testing, stryker, permission matrix E2E, dual-path parity
updated: 2026-02-25
---

# HBC Testing Coverage Enforcement SPFx Skill

**Activation**  
Any task that involves implementing, expanding, fixing, or verifying Jest tests, coverage thresholds, CI workflow changes, or the phased >95% coverage initiative (including the seven-prompt series or any future test work).

**Protocol**  
1. **Mandatory verification**: Begin with repo commit check, then review CLAUDE.md §15 (all sub-sections), §16 Pitfalls & Rules, PERMISSION_STRATEGY.md, DATA_ARCHITECTURE.md, and the current gap report (`.claude/plans/dreamy-wiggling-cookie.md`).  
2. **Gap targeting**: Execute `npm run test:coverage --selectProjects=sp-services,components` and prioritize files per the gap report.  
3. **Implementation**: Mirror exact patterns from high-coverage suites (ProvisioningService.test.ts, Prompt 1 100% files). Achieve 100% on every targeted file before any threshold ratchet.  
4. **CI safety**: Reproduce every failing GitHub Actions job locally (`npm run build:validate`, `npm run test:ci`, etc.) before committing workflow changes.  
5. **Ratcheting & hygiene**: Update thresholds only after green CI; append metrics, new test counts, and cross-references to CLAUDE.md §15c; refresh gap report.  
6. **Post-change verification**: Run full `npm run test:ci` and confirm all four PR checks (Build & Validate, Storybook + Chromatic, Playwright E2E, Accessibility) pass.

**6 Critical Flows Guaranteed Stable**  
1. **Phase ratcheting** – thresholds raised only after 100% on targeted files and green CI.  
2. **CI unblocking** – local reproduction + temporary disables used only as bridge; never committed without green status.  
3. **Gap report synchronization** – `.claude/plans/dreamy-wiggling-cookie.md` always reflects current top-20 and phase status.  
4. **Documentation hygiene** – every test change triggers exact CLAUDE.md §15c append before commit.  
5. **Permission & feature-flag matrix** – all new tests exhaustively cover the 14-role / 70+ permission matrix.  
6. **Skill activation loop** – new test patterns immediately trigger this skill for future work.

**Manual Test Steps**  
1. Run `npm run test:coverage` → confirm phase thresholds met and no CI breakage.  
2. Open PR → verify all four GitHub Actions checks turn green within 2 minutes.  
3. Switch roles in local dev → confirm permission-fixture tests still pass at 100%.  
4. Modify a service method → confirm new test catches regression before commit.  
5. Execute full Prompt series → confirm test count >700 and overall coverage >95%.  
6. Review CLAUDE.md §15c → confirm latest metrics and cross-references present.

**Phase 7S4 Additions (v1.1)**
- **Per-file coverage thresholds**: `jest.config.js` now enforces per-file overrides (90/80/85/90 for permissions.ts, toolPermissionMap.ts; ratcheted floors for ProvisioningSaga.ts 89/60/85/92, GraphBatchEnforcer.ts 96/90/77/97; 90/80/85/90 for ListThresholdGuard.ts). Global thresholds remain 80/60/70/80.
- **Mutation testing**: Stryker Mutator installed (`@stryker-mutator/core`, `jest-runner`, `typescript-checker`). Config in `stryker.config.mjs`. Run `npm run test:mutation` in sp-services. Targets: ProvisioningSaga.ts + GraphBatchEnforcer.ts. Thresholds: high=80, break=60.
- **Mutation-killing tests**: 70 supplement tests (38 ProvisioningSaga + 32 GraphBatchEnforcer) target exact boundary values, format assertions, ordering invariants, and timing windows.
- **Dual-path parity tests**: 66 tests verify ROLE_PERMISSIONS (legacy) vs PermissionEngine (TOOL_DEFINITIONS + permissionTemplates.json) consistency. Known gaps baselined as regression guards.
- **Permission matrix E2E**: 70 Playwright tests (playwright/permission-matrix.e2e.spec.ts) cover 6 roles × workspace access (positive + denial + sidebar + page-level).

**Reference**
- CLAUDE.md §15 (Test Architecture series) & §15c (Coverage Targets & Enforcement)
- §16 (Pitfalls & Rules – optimistic contracts, SignalR invalidation)
- PERMISSION_STRATEGY.md & DATA_ARCHITECTURE.md
- Existing Prompt 1–7 series and `jest.config.*` files
- `.claude/plans/route-coverage-audit.md` (route coverage baseline)
- `stryker.config.mjs` (mutation testing configuration)