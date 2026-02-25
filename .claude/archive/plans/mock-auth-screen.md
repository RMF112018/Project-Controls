# Stage 1: Mock Auth Screen for Pre-Deployment Role-Based Routing and Navigation Vetting (with Main Hub Dashboard Alignment and Simplified RBAC)

**Generated:** 25 February 2026  
**Updated:** 25 February 2026  
**Status:** Active (referenced in all subsequent responses as “Stage 1: Mock Auth Screen for Pre-Deployment Role-Based Routing and Navigation Vetting plan generated on 25 February 2026”)

## Description
Implement a single-entry mock authentication screen that appears only in dev/mock mode on initial launch. The screen presents a clean role picker, sets the mock user and permissions in the existing context, and immediately navigates to the role-specific landing page using TanStack Router v1.  

**RBAC Simplification (mandatory for this stage):**  
Clear all existing RBAC role definitions, permission sets, and related constants throughout the live codebase. Replace them with the following 16 basic roles. **Every role defaults to full admin-level read/write access across all features, pages, and data operations** for pre-deployment testing and vetting. No granular permissions are required at this stage.

| Role                               | Landing Page Route          |
|------------------------------------|-----------------------------|
| Administrator                      | /admin                      |
| Leadership                         | /hub (Main Hub Dashboard)   |
| Marketing Manager                  | /marketing                  |
| Preconstruction Manager            | /preconstruction            |
| Business Development Manager       | /business-development       |
| Estimator                          | /estimating                 |
| IDS Manager                        | /ids                        |
| Commercial Operations Manager      | /operations                 |
| Luxury Residential Manager         | /operations                 |
| Manager of Operational Excellence  | /opex                       |
| Safety Manager                     | /safety                     |
| Quality Control Manager            | /qc-warranty                |
| Warranty Manager                   | /qc-warranty                |
| Human Resources Manager            | /people-culture             |
| Accounting Manager                 | /accounting                 |
| Risk Manager                       | /risk-management            |

Additionally, align the **Main Hub Dashboard** (`/hub`) exactly to the provided wireframe: blue top header (logo, central Search, right-aligned User/Role Switcher), top row of 4 Workspace Selector Cards, responsive Analytics Card grid (with highlight support), and **no left navigation sidebar, no PillarTabBar, no AppShell nav elements** on this view only.

This creates a repeatable, zero-friction testing environment for role-based routing, navigation, permissions, and visual layout while preserving production/SPFx/PWA auth flows.

## Numbered Sub-Tasks
0. Clear all current RBAC roles, permission sets, constants, and mappings in `packages/hbc-sp-services`, `src/contexts/AppContext.tsx`, `usePermissionEngine`, `RoleGate`, and any related files; replace with the 16 basic roles above, each with full read/write access by default.
1. Review current user initialization, mock mode detection, and (now-simplified) role/permission patterns.
2. Extend the mock user service to support selectable full-role profiles using the new 16-role list.
3. Create `MockAuthScreen` component using Fluent UI v9 (role selection via RadioGroup or Card-based picker, clear labels, and role descriptions).
4. Add conditional root-level gate in `src/App.tsx` (and router configuration): if dev/mock mode and no user selected, render `<MockAuthScreen />`; on selection, update context and navigate.
5. Implement role-to-landing route mapping (using the exact table above) and automatic redirect.
6. Ensure immediate propagation to `AppShell`, `NavigationSidebar`, `PillarTabBar`, and all `RoleGate` components.
7. Add verification steps, basic unit test, and Playwright flow for the end-to-end sequence.
8. Identify the Main Hub Dashboard component/route and update AppShell/layout wrapper to conditionally suppress left navigation sidebar, PillarTabBar, and any nav elements when on `/hub`.
9. Align Main Hub Dashboard layout to wireframe: implement 4-column Workspace Selector Card row + responsive Analytics Card grid (Fluent UI v9 Card + Griffel styles).
10. Integrate or enhance User/Role Switcher button in the top header (tied to context for quick role change in dev mode).
11. Update verification to confirm visual match to wireframe (no nav, header elements, card grid) plus role-based navigation correctness.

## Deliverables
- RBAC cleanup and new 16-role definitions with full read/write defaults.
- New `MockAuthScreen.tsx`.
- Updated `AppContext.tsx`, `App.tsx`/router, and AppShell layout logic.
- Role mapping constant and mock user profiles.
- Main Hub Dashboard updates (conditional nav removal + card grid).
- Test coverage and verification checklist.

## Success Criteria
- `npm run dev` immediately shows the role picker (no other content).
- Selecting any of the 16 roles redirects to the exact landing page listed in the table, with full read/write access everywhere, matching navigation items (where applicable), and no console errors.
- Main Hub Dashboard (`/hub` for Leadership) renders **without any left navigation sidebar** and exactly matches the wireframe.
- Context updates are stable (no unnecessary re-renders).
- Production/SPFx/PWA flows bypass the screen and retain original behavior.
- Role changes survive refresh within the dev session via context.

## Prioritized Execution Order
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11  
**Rationale:** RBAC cleanup (0) first ensures no legacy conflicts; foundation and mock screen next; routing and Main Hub layout follow; verification last.

## Specific Technical Approaches
- RBAC cleanup: delete/replace role enums, permission objects, and default assignments in the data layer; set a single `fullAccess: true` flag per role for all guards.
- Detect dev/mock mode using existing patterns.
- Role selection populates `currentUser` with the new role and full-access flag, then navigates via stable `useNavigate`.
- For Main Hub: route-based conditional in `AppShell` (`showNav={false}` when route === '/hub').
- User/Role Switcher reuses context for instant switching in dev.

## Trade-off Table (RBAC simplification & nav removal)

| Area                | Approach                          | Pros                          | Cons                     | Recommendation |
|---------------------|-----------------------------------|-------------------------------|--------------------------|----------------|
| RBAC                | Single fullAccess flag per role   | Zero complexity, instant full access | Not production-ready    | Required per user request |
| Nav suppression     | Route-based conditional in AppShell | Central, no prop drilling    | Route awareness needed  | Preferred (matches live router) |

## Potential Risks & Verification Methods
- Risk: Leftover legacy roles/permissions → Mitigate by explicit search-and-replace in scoped files; surface any remaining immediately.
- Risk: Nav suppression leaks → Strict route match + test all 16 roles.
- Verification: `npm run dev`, select each of the 16 roles, confirm correct landing + full access + wireframe on Main Hub; inspect context tab; run permission tests; no regression on real auth paths.

This updated stage directly enables your exact workflow and role mappings while delivering the simplified RBAC and wireframe-aligned Main Hub.