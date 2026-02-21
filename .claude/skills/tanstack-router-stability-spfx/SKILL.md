---
name: TanStack Router Stability SPFx
description: Stable singleton pattern for TanStack Router v1 preventing route-tree recreation and UI freezes on AppContext changes in SPFx
version: 2.0
category: router
triggers: tanstack router, router stability, useRef router, router recreation, navigation freeze, project picker freeze, router.update, updateContext, adapter hooks, useAppNavigate, useAppLocation, useAppParams
updated: 2026-02-21
---

# TanStack Router Stability SPFx Skill

**Activation**
Implementing, modifying, or debugging TanStack Router provider, route guards, navigation components, ProjectPicker, adapter hooks, or any scenario where navigation freezes after dashboard load or project switch.

**Protocol**
1. **Router singleton**: Create router instance exactly once via `useRef` in `router.tsx` with *static values only* (`queryClient`, `dataService`). NEVER recreate on dynamic value changes.
2. **Dynamic injection**: Use `React.useEffect` -> `router.update({ context: { currentUser, selectedProject, isFeatureEnabled, scope } })` for all dynamic values. `RouterProvider context={}` syncs the React tree.
3. **Adapter hook stability**: `useAppNavigate` returns a ref-stable callback (identity never changes). `useAppLocation` returns a `useMemo`-stabilised `{ pathname, search }`. `useAppParams` returns `useMemo`-stabilised params with `JSON.stringify` dep.
4. **ProjectPicker ordering**: `handleSelect` MUST close popover (`setIsOpen(false)`) and clear query BEFORE firing context mutation. Context mutation wrapped in `React.startTransition(() => onSelect(project))`.
5. **App.tsx stability**: Suspense fallback lifted to module-level constant. Router props wrapped in `useMemo` to avoid unnecessary `router.update()` calls.
6. **Post-change verification**: Run `tsc --noEmit` + `jest --no-coverage` + update CLAUDE.md S4 and S16.

**6 Critical Flows Guaranteed Stable**
1. **Project switch** — popover closes visually before context mutation (via `startTransition`); router updates in-place via `router.update()`
2. **Route navigation** — `useTransitionNavigate` returns a stable callback; all navigations wrapped in `startTransition`
3. **Location tracking** — `useAppLocation` returns memoised `{ pathname, search }`; NavigationSidebar active-state checks only re-run when path actually changes
4. **Route params** — `useAppParams` returns memoised params; downstream components (LeadDetail, GoNoGo) don't re-render on unrelated router state changes
5. **Permission/feature gate re-evaluation** — flows through `router.update()` context merge; guards see latest `isFeatureEnabled` without router recreation
6. **Breadcrumb/telemetry** — consume stable `useTransitionNavigate` / `useAppLocation`; no unnecessary re-renders

**Manual Test Steps**
1. Hub dashboard -> open ProjectPicker -> select project -> verify popover closes instantly, no freeze, sidebar updates
2. Navigate to any module (e.g., `/operations/monthly-review`) -> verify no blank screen or remount
3. Navigate to lead drill-down (`/lead/:id`) -> verify params load correctly
4. Press browser back button -> verify smooth return, no route tree destruction
5. Switch role via RoleSwitcher -> verify guards re-evaluate without navigation freeze
6. Observe breadcrumb trail during all above — should update without flicker

**Reference**
- `CLAUDE.md` S4 (Router Stability Rule), S16 (Active Pitfalls)
- `PERFORMANCE_OPTIMIZATION_GUIDE.md` S4 (React 18 & Context Rules)
- `SECURITY_PERMISSIONS_GUIDE.md` S1 (TanStack Router guard enforcement)
- `react-context-and-concurrent` skill (context splitting complement)
