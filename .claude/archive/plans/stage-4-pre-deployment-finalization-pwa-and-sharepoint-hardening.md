# Stage 4: Pre-Deployment Finalization, Performance Optimization, PWA & SharePoint Hardening

**Generated:** 25 February 2026  
**Status:** Active (referenced in all subsequent responses as “Stage 4: Pre-Deployment Finalization, Performance Optimization, PWA & SharePoint Hardening plan generated on 25 February 2026”)

## Description
Finalize the application for production deployment. Optimize React 18 + TanStack Router v1 performance across all 16 roles, harden the PWA manifest/service-worker for offline construction-site use, and strengthen SharePoint/SPFx integration (Entra ID auth, list permissions, Graph API). Include final bundle audit, console-clean checklist, and end-to-end Playwright suite for all roles. This completes the pre-deployment vetting objective.

## Numbered Sub-Tasks
1. Performance audit: React DevTools profiler, TanStack Query cache tuning, lazy loading verification.
2. PWA enhancements: update manifest, service-worker caching strategy for construction data, offline fallback.
3. SharePoint/SPFx hardening: Entra ID token refresh, list permission checks, Graph API error handling in `@hbc/sp-services`.
4. Bundle & lighthouse audit: reduce size, add compression, ensure 100 Lighthouse score targets.
5. Final role-vetting Playwright suite (all 16 roles + role switcher + offline simulation).
6. Production config cleanup and CHANGELOG update.
7. Final verification & deployment checklist.

## Deliverables
- Optimized PWA assets and service worker.
- Hardened SPFx entry point and data layer.
- Performance report and Playwright suite.
- Updated CHANGELOG.md and README.

## Success Criteria
- All 16 roles pass full E2E with < 2s load time.
- PWA installs and works offline on mobile.
- SPFx bundle < 2MB, no auth regressions.
- Zero console warnings in production mode.
- Ready for `npm run package` and SharePoint deployment.

## Prioritized Execution Order
1 → 2 → 3 → 4 → 5 → 6 → 7  
**Rationale:** Audit first, then PWA/SPFx, tests last.

## Specific Technical Approaches
- TanStack Router v1 `preload` + React 18 `startTransition`.
- Workbox for service worker.
- Existing `@hbc/sp-services` Graph helpers.

## Trade-off Table (PWA strategy)

| Approach              | Pros                              | Cons                              | Recommendation |
|-----------------------|-----------------------------------|-----------------------------------|----------------|
| Workbox + precache    | Reliable offline                  | Larger initial bundle             | Preferred      |
| Runtime caching only  | Smaller bundle                    | Less reliable for field use       | Avoid          |

## Potential Risks & Verification Methods
- Risk: Offline data staleness → Mitigate with timestamped cache.
- Verification: Lighthouse, Playwright, manual SPFx package test.

This stage delivers production-ready HBC Project Controls.