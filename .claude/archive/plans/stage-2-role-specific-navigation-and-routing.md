# Stage 2: Role-Specific Navigation, Routing Architecture & Contextual Landing Pages

**Generated:** 25 February 2026  
**Status:** Active (referenced in all subsequent responses as “Stage 2: Role-Specific Navigation, Routing Architecture & Contextual Landing Pages plan generated on 25 February 2026”)

## Description
Build directly on the completed Stage 1 (16-role RBAC with full-access defaults, MockAuthScreen, /hub wireframe alignment, and shorthand redirects). Define and implement comprehensive role-specific navigation options, refine the TanStack Router v1 tree for stable role-based landing pages, and ensure contextual filtering in AppShell/NavigationSidebar/PillarTabBar (where applicable). Each of the 16 roles now receives a polished, purpose-built initial landing page. Retain fullAccess flag for dev testing while introducing lightweight granular permission mapping for future hardening. This delivers the “subsequently we will need to define the routing, nav options, and initial landing page for each role type” objective while maintaining construction-industry requirements for low-latency navigation and React 18 stability.

## Numbered Sub-Tasks
1. Review current navigation structures (NavigationSidebar, AppShell, workspaceConfig.ts, PillarTabBar remnants) and router tree.
2. Extend permissions.ts with per-role NAV_ITEMS and LANDING_PAGE_CONFIG (including icon, title, description, and default visible sections).
3. Update NavigationSidebar and Header to filter menu items dynamically using currentUser.role and permissions (fullAccess bypass in dev).
4. Implement or refine dedicated landing page components for all 16 roles (reuse existing where possible, create lightweight placeholders for missing ones).
5. Add role-specific route guards and lazy-loaded layouts in the TanStack Router tree.
6. Enhance User/Role Switcher (HeaderUserMenu) to preview role-specific nav on switch.
7. Update Main Hub Dashboard to remain fully nav-free while other roles show contextual sidebar.
8. Add basic granular permission examples (e.g., “canViewFinancials”, “canEditProjects”) for 3–4 roles while keeping fullAccess default.
9. Update all tests, Playwright fixtures, and dev tools for the new nav/routing behavior.
10. Final verification checklist across all 16 roles (nav visibility, landing page load, no re-renders, performance).

## Deliverables
- Updated `permissions.ts` with NAV_ITEMS and LANDING_PAGE_CONFIG.
- Enhanced `NavigationSidebar.tsx`, `AppShell.tsx`, and Header components.
- 16 role-specific landing page routes/components (or refined redirects).
- Updated router configuration with role-aware lazy layouts.
- Expanded test coverage and E2E flows.
- Inline comments referencing this plan.

## Success Criteria
- Each of the 16 roles shows only its authorized nav items and loads its defined landing page instantly after selection.
- Navigation updates instantly on role switch via the header switcher with zero console errors or re-render loops.
- Main Hub (Leadership) remains 100% nav-free per wireframe; all other roles show appropriate sidebar.
- Dev mode retains full access; production paths unchanged.
- TanStack Router v1 lazy loading and React 18 concurrent features fully respected (no waterfalls, stable hydration).

## Prioritized Execution Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10  
**Rationale:** Data foundation (nav config) first, then UI filtering, landing pages, router integration, and verification last.

## Specific Technical Approaches
- Use existing `useAppContext()` + `fullAccess` flag for filtering.
- NAV_ITEMS as Record<RoleName, NavItem[]> in permissions.ts.
- Lazy routes with `createLazyRoute` for role-specific dashboards.
- Griffel styles for consistent Fluent UI v9 nav cards/icons.

## Trade-off Table (nav filtering options)

| Approach                    | Pros                              | Cons                              | Recommendation |
|-----------------------------|-----------------------------------|-----------------------------------|----------------|
| Config-driven (permissions.ts) | Single source of truth, easy to maintain | Slight initial overhead          | Preferred (matches live RBAC) |
| Hard-coded per component    | Fastest runtime                   | Duplication, hard to scale       | Avoid |

## Potential Risks & Verification Methods
- Risk: Nav flicker on role switch → Mitigate with `useTransition` and stable context.
- Risk: Missing landing page → Surface immediately; provide placeholder.
- Verification: `npm run dev`, test all 16 roles + switcher, confirm nav + landing + performance.

This stage completes the role-based foundation and prepares for Stage 3 (granular permissions + feature flags).