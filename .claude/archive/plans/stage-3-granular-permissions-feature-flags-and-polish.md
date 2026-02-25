# Stage 3: Granular Permissions Hardening, Feature Flag Debt Cleanup & Production Readiness

**Generated:** 25 February 2026  
**Status:** Active (referenced in all subsequent responses as “Stage 3: Granular Permissions Hardening, Feature Flag Debt Cleanup & Production Readiness plan generated on 25 February 2026”)

## Description
Transition from Stage 2’s `fullAccess` dev default to true granular permissions (70+ permissions across 14 original role categories, now mapped to the 16 roles). Clean up all feature-flag debt in the shared `@hbc/sp-services` layer. Polish the 16 role-specific landing pages with construction-industry-appropriate placeholders (KPI cards, data tables, ECharts, task lists) using Fluent UI v9, TanStack Query, and React 18 best practices. Maintain zero-impact mock-mode workflow for ongoing vetting. This completes the role-based foundation for production deployment.

## Numbered Sub-Tasks
1. Review current granular permissions, feature-flag usage, and role-landing page components.
2. Expand `GRANULAR_PERMISSIONS` in `permissions.ts` to the full 70+ set; map to the 16 roles (remove `fullAccess` default; keep for dev override only).
3. Update all guards (`PermissionGate`, `RoleGate`, `requireRole`, `ProtectedRoute`) and `usePermissionEngine` to use granular checks.
4. Clean feature-flag debt: audit, remove unused flags, consolidate config in `@hbc/sp-services`, add runtime toggle UI in dev tools.
5. Polish landing pages for all 16 roles: replace placeholders with role-appropriate Fluent UI v9 layouts (KPI grid, activity feed, quick actions).
6. Add TanStack Query data fetching examples on 4 key role dashboards (using existing `@hbc/sp-services` layer).
7. Enhance User/Role Switcher with permission preview tooltip.
8. Update tests, Playwright E2E, and verification for granular scenarios + feature-flag toggles.
9. Final production-readiness checklist (performance, bundle size, console clean).

## Deliverables
- Full granular permission matrix in `permissions.ts`.
- Updated guards and feature-flag service.
- 16 polished landing page components (or refined existing).
- Expanded test coverage and dev-tool flag toggler.
- Inline comments referencing this plan.

## Success Criteria
- Each role sees only its assigned granular permissions (dev mode override optional).
- Feature flags are debt-free and toggleable only in dev.
- All 16 landing pages load with polished, role-specific UI and real data mocks.
- No re-render loops, bundle size unchanged, 100% test pass.
- Production/SPFx/PWA paths unchanged and fully permission-aware.

## Prioritized Execution Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9  
**Rationale:** Permission foundation first, then guards/flags, UI polish, and verification last.

## Specific Technical Approaches
- Single source of truth in `permissions.ts` with role → permission Set mapping.
- Feature-flag cleanup using existing `MockDataService` pattern.
- Fluent UI v9 Card/Grid + Griffel for dashboard polish.
- TanStack Query v5 for data (stable queries, no waterfalls).

## Trade-off Table (permission hardening)

| Approach                | Pros                              | Cons                              | Recommendation |
|-------------------------|-----------------------------------|-----------------------------------|----------------|
| Granular Set per role   | Precise, future-proof             | Initial mapping effort            | Preferred      |
| Keep fullAccess only    | Zero change                       | Not production-ready              | Dev-only       |

## Potential Risks & Verification Methods
- Risk: Permission regression in dev → Mitigate with mock override.
- Risk: Dashboard polish bloat → Use lazy loading + memo.
- Verification: Test all 16 roles in dev + one production simulation; confirm flags and polished UI.

This stage finalizes pre-deployment role-based readiness.