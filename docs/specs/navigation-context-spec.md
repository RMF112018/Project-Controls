# Navigation & Project Context Specification

**Document ID**: HBC-PC-NAV-001  
**Version**: 1.0 (aligned with Project UUID spec HBC-PC-UUID-001 and commit c8a3f611d0951989d45df86f4b466bea1267dcbc)  
**Status**: Implemented (Phases 1-7 complete, behind `ProjectUuidNavigation` feature flag)
**Last Updated**: 2026-03-02
**Governing Instruction**: All development of `AppShell`, TanStack Router routes, `useCurrentProject` hook, `ProjectRequiredRoute` guard, navigation helpers, header components, and any data-fetching logic MUST retrieve this document first via MCP (`find_relevant_context`) before any implementation. No hard-coded navigation paths, project filters, or context handling allowed outside this spec.

## 1. Purpose and Procore Alignment

Implement persistent project context exactly as Procore does: the app header owns and carries the current project via URL search parameter (`?projectUuid=xxx`). This resolves disjointed navigation from multi-project department features into the Project Hub while preserving Entra ID–driven portfolio dashboards and cross-department views.

## 2. URL Parameter Contract

- Parameter name: `projectUuid` (string, GUID format).
- Present on every Project Hub or single-project route.
- Optional on portfolio/dashboard/multi-project routes (treated as “All Projects”).
- Deep-link and bookmark friendly (hash history supported).

## 3. Context Synchronization (useCurrentProject hook)

New hook: `src/webparts/hbcProjectControls/components/hooks/useCurrentProject.ts`

Must implement exact bidirectional sync between:
- TanStack Router `searchParams.projectUuid`
- Existing `AppContext.selectedProject`

Behavior:
- On URL change → update context.
- On context change (via header selector) → update URL.
- Default to “All Projects” when no `projectUuid` present.

## 4. Header-Level Project Selector

- Location: Existing `AppShell` header (Procore-style persistent bar).
- Component: Fluent UI Combobox/Dropdown.
- Data source: `SharePointDataService.getProjects` (Entra ID–filtered).
- On selection: call `setCurrentProject(uuid)` from `useCurrentProject` hook.
- Always visible and functional.

## 5. Navigation Helper Requirements

New utility: `src/webparts/hbcProjectControls/components/utils/navigateWithProject.ts`

```ts
export const navigateToProjectHub = (to: string, projectUuid: string) => {
  navigate({ to, search: { projectUuid } });
};
```

All multi-project → Project Hub links MUST use this helper. No plain navigate(to) allowed.

6. Route Guards & Data Filtering Rules

Update guards/ProjectRequiredRoute.tsx: require projectUuid from URL/context; redirect if missing.
All TanStack Query keys and fetches in Project Hub pages: filter exclusively on projectUuid eq '${uuid}'.
Portfolio and multi-project dashboards: ignore projectUuid param (show “All Projects”).
Existing Entra ID redirects remain unchanged (they land on dashboards).

7. Integration with UUID (HBC-PC-UUID-001)

projectUuid from UUID spec is the ONLY identifier carried in URL and context.
All queries, models, and services reference projectUuid (deprecate composite key logic).

8. Responsive & Print Behavior

Header selector collapses gracefully on mobile.
data-print-hide attribute on selector for PDF/export (consistent with Go/No-Go export pattern).

9. Testing & Rollout Mandates

Full flow: Entra redirect → multi-project feature → Project Hub (must filter correctly).
Backward compatibility: existing bookmarks without projectUuid default to “All Projects”.
Telemetry: track project-context-switch and navigation-with-uuid events.

This specification, together with HBC-PC-UUID-001, is the sole source of truth for all navigation and project-context development.