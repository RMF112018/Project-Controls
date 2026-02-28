# Stage 20 — Persistent Project Context & Deep-Link State in Project Hub

## Problem

After Stage 9, users can deep-link from DepartmentTrackingPage to Project Hub pages via `?projectCode=XXX&leadId=YYY`. However, search params are ephemeral — when the user navigates within Project Hub via the sidebar (static paths, no search params), `requireProject()` checks `context.selectedProject` which was never set. The user is redirected to Analytics Hub.

**Root cause**: Deep-link navigation passes search params but never calls `setSelectedProject()` in AppContext. 33 of 36 child routes use `requireProject()` which only checks AppContext.

## Solution Architecture

Two-layer approach:

```
DepartmentTrackingPage → /project-hub/precon/estimating-kickoff?projectCode=25-022-01&leadId=4
                          │
                          ▼
              ┌─────────────────────────────┐
              │  phLayout beforeLoad        │  Layer 1: Synchronous
              │  validateSearch → context   │  Makes 33 child guards pass
              │  augmentation               │  immediately via context merge
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │  ProjectHubProvider         │  Layer 2: Async React
              │  Resolves full ILead data   │  Syncs to AppContext for
              │  → setSelectedProject()     │  sidebar navigation
              └─────────────────────────────┘
```

### Layer 1: Route-Level (Synchronous)

`phLayout` in `routes.projecthub.tsx` now has:
- `validateSearch`: Accepts `projectCode` and `leadId` at layout level so all 36 child routes inherit search-param awareness
- `beforeLoad`: When `selectedProject` is null but search params have `projectCode`, returns a minimal `ISelectedProject` that TanStack Router merges into child route context

This makes ALL `requireProject()`-only routes pass their guards on deep-link — no per-route changes needed.

### Layer 2: React-Level (Async)

`ProjectHubProvider` wraps `<Outlet />` in ProjectHubLayout and:
1. Reads search params via `useSearch({ strict: false })`
2. Resolves full project data from dataService:
   - **Strategy 1**: `getLeadById(leadId)` — O(1) lookup when leadId available
   - **Strategy 2**: `searchLeads(projectCode)` — fallback when leadId absent
3. Calls `setSelectedProject()` to persist in AppContext
4. Subsequent sidebar navigation works because AppContext has the full project

## Deep-Link Flow

```
1. DepartmentTrackingPage → "Kickoff" context menu
2. Navigate to /project-hub/precon/estimating-kickoff?projectCode=25-022-01&leadId=4
3. phLayout beforeLoad:
   - context.selectedProject is null
   - search.projectCode = '25-022-01'
   - Returns { selectedProject: { projectCode: '25-022-01', projectName: '', stage: Pursuit, leadId: 4 } }
   - TanStack Router merges into child context
4. Child route beforeLoad: requireProject(context) passes (projectCode is truthy)
5. React renders ProjectHubProvider:
   - Detects search param projectCode differs from context
   - Calls getLeadById(4) → full ILead
   - Constructs full ISelectedProject
   - Calls setSelectedProject() → AppContext updated
6. User clicks sidebar "Estimate" (static path, no search params):
   - context.selectedProject now has full data from step 5
   - requireProject() passes
   - Page renders correctly
```

## API: useProjectHub Hook

```tsx
import { useProjectHub } from '../project-hub/ProjectHubProvider';

const { projectCode, leadId, projectName, isResolving } = useProjectHub();
```

| Property | Type | Description |
|----------|------|-------------|
| `projectCode` | `string` | Effective project code (search params → context fallback) |
| `leadId` | `number \| undefined` | Lead ID from search params or context |
| `projectName` | `string` | Populated after async resolution |
| `isResolving` | `boolean` | True while resolving full project data |

## Route Configuration

```
phLayout (validateSearch: projectCode, leadId)
├── phDashboard (validateSearch: projectCode, leadId) — existing
├── phEstKickoff (validateSearch: projectCode, leadId) — Stage 9
├── phTurnover (validateSearch: projectCode, leadId) — existing
└── 33 other routes using requireProject() only — now work via context augmentation
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Invalid projectCode | Resolution fails silently; minimal context from beforeLoad remains valid; console warning logged |
| User clears project via ProjectPicker | AppContext.selectedProject set to null; next navigation re-triggers resolution if search params present |
| Bookmark with stale leadId | Falls back to searchLeads strategy; if project code still valid, resolves successfully |
| No search params (normal sidebar entry) | Provider is a no-op; AppContext.selectedProject drives everything |
| Re-render with same search params | `resolvedCodeRef` prevents duplicate resolution |

## Files Modified

| File | Change |
|------|--------|
| `tanstack/router/workspaces/routes.projecthub.tsx` | Added `validateSearch` + context-returning `beforeLoad` to `phLayout` |
| `components/project-hub/ProjectHubProvider.tsx` | **New**: Provider + `useProjectHub()` hook |
| `components/layouts/ProjectHubLayout.tsx` | Wrapped `<Outlet />` with `<ProjectHubProvider>` |
| `components/project-hub/__tests__/ProjectHubProvider.test.tsx` | **New**: 8 unit tests |
| `tanstack/router/__tests__/guards.test.tsx` | Added 1 test for minimal context extension |
| `docs/Stage20-Project-Hub-Persistence-Guide.md` | **New**: This file |

## Permissions

No new permissions required. Uses existing `requireProject()` guard — the only change is that context is now augmented at the layout level.

---

## URL Search Param Persistence During Navigation

### Problem (Post-Layer-2)

Layers 1 and 2 above solve the *initial deep-link* problem. However, once inside Project Hub, navigating via the sidebar strips search params because sidebar links use bare paths (e.g., `/project-hub/precon/turnover`). TanStack Router drops search params by default when `search` is omitted from navigate calls.

**Symptom**: Deep-link entry works → sidebar click to another page → URL loses `?projectCode=...&leadId=...` → pages show "No turnover agenda exists" or similar empty states.

**Root cause**: `ContextualSidebar.tsx` calls `navigate(item.path)` via `useAppNavigate()`, which delegates to TanStack Router's `useNavigate()` without passing a `search` property.

### Solution: `useProjectHubNavigate` Hook

A specialized navigation hook that automatically preserves `projectCode` and `leadId` across all Project Hub internal navigation.

```
Sidebar Click → useProjectHubNavigate(path)
                      │
                      ├─ Read URL search params (useSearch)     ← Primary source
                      ├─ Read AppContext.selectedProject         ← Fallback
                      │
                      ▼
                navigate({ to: path, search: { projectCode, leadId } })
```

**Dual-source strategy:**
1. **Primary**: URL search params via `useSearch({ strict: false })` — handles deep-link flow
2. **Fallback**: `AppContext.selectedProject` — handles ProjectPicker flow where params may not be in URL

### API: `useProjectHubNavigate`

```tsx
import { useProjectHubNavigate } from '../project-hub/useProjectHubNavigate';

const projectHubNavigate = useProjectHubNavigate();

// Simple navigation — params preserved automatically
projectHubNavigate('/project-hub/precon/turnover');

// With additional search params
projectHubNavigate('/project-hub/dashboard', { search: { handoffFrom: 'turnover' } });

// With replace option
projectHubNavigate('/project-hub/settings', { replace: true });
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `to` | `string` | Target path |
| `options.replace` | `boolean?` | Replace current history entry |
| `options.search` | `Record<string, unknown>?` | Additional search params to merge |

### When to Use

| Scenario | Hook |
|----------|------|
| Navigate **within** Project Hub (`/project-hub/*`) | `useProjectHubNavigate` |
| Navigate **to** Project Hub from another workspace | `useProjectHubNavigate` (fallback to context) |
| Navigate **away** from Project Hub (Home, other workspace) | `useAppNavigate` |
| Navigate outside Project Hub entirely | `useAppNavigate` |

### Component Tree Context

```
RouterProvider
  └─ AppShell
       ├─ ContextualSidebar          ← OUTSIDE ProjectHubProvider
       │    Uses useProjectHubNavigate (reads useSearch + useAppContext)
       │
       └─ <Outlet>
            └─ ProjectHubLayout
                 └─ ProjectHubProvider  ← INSIDE
                      └─ Child pages
                           Uses useProjectHubNavigate (reads useSearch + useAppContext)
```

The hook intentionally uses `useSearch` + `useAppContext` (not `useProjectHub`) so it works in both locations.

### Navigation Flow After Fix

```
1. DepartmentTrackingPage → "Kickoff" context menu
   URL: /project-hub/precon/estimating-kickoff?projectCode=25-022-01&leadId=4

2. User clicks "Project Turnover" in sidebar
   ContextualSidebar → projectHubNavigate('/project-hub/precon/turnover')
   Hook reads URL params: { projectCode: '25-022-01', leadId: 4 }
   URL: /project-hub/precon/turnover?projectCode=25-022-01&leadId=4  ✓

3. User clicks "Project Dashboard" in sidebar
   URL: /project-hub/dashboard?projectCode=25-022-01&leadId=4  ✓

4. User clicks "Home"
   ContextualSidebar → navigate('/')  (useAppNavigate, NOT the hook)
   URL: /  (no project params)  ✓
```

### Files Modified (URL Persistence)

| File | Change |
|------|--------|
| `components/project-hub/useProjectHubNavigate.ts` | **New**: Dual-source navigate hook |
| `components/navigation/ContextualSidebar.tsx` | Use hook for project-hub sidebar + cross-workspace link |
| `components/pages/project-hub/PHProjectTurnoverPage.tsx` | Use hook for internal dashboard navigate |
| `components/project-hub/__tests__/useProjectHubNavigate.test.ts` | **New**: 8 unit tests |
| `docs/Stage20-Project-Hub-Persistence-Guide.md` | Extended with this section |

### Edge Cases (URL Persistence)

| Scenario | Behavior |
|----------|----------|
| Deep-link → sidebar nav | URL params persist (primary source) |
| ProjectPicker → sidebar nav | Context params injected into URL (fallback) |
| Navigate to Home | `useAppNavigate` used — no project params carried |
| Hook called outside project-hub route | `useSearch` returns `{}`; hook produces empty search; no-op |
| Caller passes `handoffFrom` | Merged with preserved `projectCode`/`leadId` |
| ProjectPicker changes project mid-session | URL may have old params; page content refreshes via context |

## Related

- [Stage 9 — Kickoff Navigation Guide](./Stage9-Kickoff-Navigation-Guide.md)
- [Route Map](./route-map.md)
