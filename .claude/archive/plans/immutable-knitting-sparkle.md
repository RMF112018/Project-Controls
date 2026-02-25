# Execution Plan: Sidebar Navigation Enhancement

## Context

The Analytics Hub Dashboard at `/` currently shows "Select a workspace from the launcher above." in the sidebar because no workspace config exists for the hub. Workspace sidebars jump straight into their sidebar groups with no way to navigate back to the hub or identify the current workspace's landing page. The user requests:

1. The hub sidebar should provide links to the various workspaces
2. Every workspace sidebar should have persistent "Home" (redirects to `/`) and "{Workspace} Dashboard" (redirects to workspace landing page) links at the top

**Branch:** `feature/hbc-suite-stabilization`

**Key findings:**
- `WORKSPACE_CONFIGS` has 5 entries (admin, preconstruction, operations, shared-services, site-control) — no hub entry
- `getWorkspaceFromPath('/')` returns `undefined` → ContextualSidebar shows fallback message
- `LAUNCHER_WORKSPACES` is aliased to `WORKSPACE_CONFIGS` — adding hub to the array would also add it to the AppLauncher menu
- `NavItem` accepts `label`, `active`, `onClick` — no icon rendering
- Operations workspace has "Operations Dashboard" at `/operations` as its first sidebar item — will duplicate with the persistent "{Workspace} Dashboard" link

---

## Chunk 1: Add Hub Workspace Config

### 1A. Add hub entry to WORKSPACE_CONFIGS
**File:** `src/webparts/hbcProjectControls/components/navigation/workspaceConfig.ts`

Add a `hub` workspace config at the **END** of the `WORKSPACE_CONFIGS` array (critical: must be last so `getWorkspaceFromPath` matches other workspace basePaths first via `Array.find`):

```typescript
{
  id: 'hub',
  label: 'Analytics Hub',
  icon: 'Home24Regular',
  basePath: '/',
  roles: [],  // accessible to all roles
  sidebarGroups: [
    {
      label: 'Workspaces',
      items: [
        { label: 'Preconstruction', path: '/preconstruction' },
        { label: 'Operations', path: '/operations' },
        { label: 'Shared Services', path: '/shared-services' },
        { label: 'HB Site Control', path: '/site-control' },
        { label: 'Admin', path: '/admin' },
      ],
    },
  ],
}
```

- No `featureFlag` — always available
- Empty `roles` array — hub is accessible to everyone
- Items ordered by user-facing priority (Admin last since it's specialist)

### 1B. Separate LAUNCHER_WORKSPACES from WORKSPACE_CONFIGS
**File:** `src/webparts/hbcProjectControls/components/navigation/workspaceConfig.ts`

Change:
```typescript
export const LAUNCHER_WORKSPACES = WORKSPACE_CONFIGS;
```
To:
```typescript
export const LAUNCHER_WORKSPACES = WORKSPACE_CONFIGS.filter(w => w.id !== 'hub');
```

This prevents "Analytics Hub" from appearing in the AppLauncher dropdown (the hub is already the home page and doesn't belong in the workspace switcher).

### 1C. Handle hub in getWorkspaceFromPath
No change needed. With hub at the end of the array and `basePath: '/'`:
- `pathname === '/'` → matches hub exactly (other workspace basePaths checked first by `find`)
- `pathname === '/admin/roles'` → matches admin first (never reaches hub)
- `pathname === '/access-denied'` → no match (returns undefined — acceptable, access-denied doesn't need sidebar nav)

**Verification:** When navigating to `/`, the ContextualSidebar renders the "Workspaces" group with 5 workspace links instead of the fallback message.

---

## Chunk 2: Persistent "Home" + "{Workspace} Dashboard" Links

### 2A. Modify ContextualSidebar to render persistent navigation links
**File:** `src/webparts/hbcProjectControls/components/navigation/ContextualSidebar.tsx`

When a workspace is active and is NOT the hub (`workspace.id !== 'hub'`), render two persistent items BEFORE the workspace's sidebar groups:

1. **"Home"** → `navigate('/')` — active when `pathname === '/'`
2. **"{workspace.label} Dashboard"** → `navigate(workspace.basePath)` — active when `pathname === workspace.basePath`

Add a subtle divider (same `borderBottom` style) between these persistent items and the workspace groups.

### 2B. De-duplicate workspace dashboard items
When showing the persistent "{Workspace} Dashboard" link, filter out any sidebar group items whose `path === workspace.basePath` to avoid visual duplication. This specifically affects the Operations workspace where "Operations Dashboard" at `/operations` is the first item in the "Operations" group.

Also filter out any groups that become empty after item removal (the Operations "Operations" group has only one item, so removing it leaves an empty group).

Implementation in ContextualSidebar:
```typescript
const filteredGroups = React.useMemo(() => {
  if (!workspace || workspace.id === 'hub') return workspace?.sidebarGroups ?? [];
  return workspace.sidebarGroups
    .map(g => ({ ...g, items: g.items.filter(i => i.path !== workspace.basePath) }))
    .filter(g => g.items.length > 0);
}, [workspace]);
```

### 2C. Add Griffel styles for persistent section
Add styles for the persistent nav section:
- `persistentSection`: `padding: '4px 0'` — matches NavGroup padding
- `persistentDivider`: `margin: '4px 0'`, `borderBottom: 1px solid colorNeutralStroke2` — lighter than main divider

### 2D. Visual structure (non-hub workspace sidebar)
```
[ProjectPicker]
────────────── (main divider)
  Home                     ← persistent link
  {Workspace} Dashboard    ← persistent link
────────────── (subtle divider)
  GROUP LABEL
    Item 1
    Item 2
    ...
  GROUP LABEL
    Item 3
    ...
```

### 2E. Visual structure (hub sidebar)
```
[ProjectPicker]
────────────── (main divider)
  WORKSPACES               ← group label
    Preconstruction
    Operations
    Shared Services
    HB Site Control
    Admin
```

No persistent links for hub (it IS home, and there's no separate "Hub Dashboard").

**Verification:** Navigate to `/operations` → see "Home" + "Operations Dashboard" at top, then Commercial Operations group (Operations group removed since its only item duplicated). Navigate to `/preconstruction/bd` → see "Home" + "Preconstruction Dashboard" at top, then BD, Estimating, IDS groups.

---

## Files Summary

### MODIFY (2 files)
1. `src/webparts/hbcProjectControls/components/navigation/workspaceConfig.ts` — Add hub workspace config, filter LAUNCHER_WORKSPACES
2. `src/webparts/hbcProjectControls/components/navigation/ContextualSidebar.tsx` — Persistent "Home" + "{Workspace} Dashboard" links, de-duplication logic, subtle divider styling

### No new files, no model changes, no service method changes.

### Skills Followed
- **CLAUDE.md** — workspaceConfig.ts is single source of truth (§4, §16), config-driven sidebar
- **elevated-ux-ui-design** — 4.75/10 elevated patterns, Griffel makeStyles, Fluent UI v9 tokens
- **clean-tanstack-integration** — `useAppNavigate`, `useAppLocation`, ref-stable callbacks
- **enterprise-navigation** — ContextualSidebar + workspace derivation from pathname

---

## Verification

```
npx tsc --noEmit          # TypeScript clean
npm run lint              # ESLint clean
npm run test:ci           # All tests pass
```

Manual checks:
1. Navigate to `/` → hub sidebar shows "Workspaces" group with 5 workspace links
2. Click "Operations" → sidebar shows "Home" + "Operations Dashboard" at top, then workspace groups (no duplicate "Operations Dashboard" in groups)
3. Click "Home" → returns to hub dashboard at `/`
4. Click "Preconstruction Dashboard" from any preconstruction page → navigates to `/preconstruction`
5. AppLauncher dropdown does NOT show "Analytics Hub" (filtered out)
6. Active state highlighting works correctly for persistent links
