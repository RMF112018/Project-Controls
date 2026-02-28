# Stage 9 — Kickoff Navigation Refinements & Seamless Workflow Integration

## Overview

Stage 9 enables cross-workspace navigation from the **DepartmentTrackingPage** (Preconstruction workspace) to the **EstimatingKickoffPage** (Project Hub workspace). This replaces the previously disabled "Kickoff" context menu item with a fully wired navigation flow including search params, breadcrumbs, and back navigation.

## Route

| Property | Value |
|----------|-------|
| Path | `/project-hub/precon/estimating-kickoff` |
| Search Params | `?projectCode=XX-XXX-XX&leadId=N` |
| Permission | `PERMISSIONS.KICKOFF_VIEW` |
| Guard | Requires `projectCode` from search params or `selectedProject` context |

### Search Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `projectCode` | `string` | Yes (or context) | Project code for data lookup; fallback to `selectedProject.projectCode` |
| `leadId` | `number` | No | Lead ID for future kickoff initialization support |

## Entry Points

### 1. Context Menu (DepartmentTrackingPage)

The **ProjectActionsMenu** "Kickoff" item navigates to the kickoff page:

```
DepartmentTrackingPage → Click project name → "Kickoff" menu item
→ /project-hub/precon/estimating-kickoff?projectCode=25-022-01&leadId=4
```

Gated on `canViewProjectHub` (same as the "Project Hub" menu item).

### 2. Direct URL

Navigate directly with search params:
```
/project-hub/precon/estimating-kickoff?projectCode=25-022-01
```

## Navigation Flow

```
DepartmentTrackingPage
  └─ ProjectActionsMenu → "Kickoff"
       └─ EstimatingKickoffPage
            ├─ Breadcrumb: "Estimating Tracker / Estimating Kick-Off"
            └─ "Back to Tracker" button → /preconstruction/estimating/tracking
```

## Breadcrumbs

The PageHeader displays a breadcrumb trail:
- **Estimating Tracker** (clickable — navigates to `/preconstruction/estimating/tracking`)
- **Estimating Kick-Off** (current page, bold, not clickable)

## Back Navigation

A "Back to Tracker" button in the PageHeader actions slot returns to the DepartmentTrackingPage.

## Permissions

| Permission | Required For |
|------------|-------------|
| `KICKOFF_VIEW` | Route access (beforeLoad guard) |
| `ESTIMATING_EDIT` | Inline editing within KickOffSection components |

Roles with kickoff permissions: Preconstruction Manager, Estimator, Admin.

## Files Modified

| File | Change |
|------|--------|
| `tanstack/router/workspaces/routes.projecthub.tsx` | Route definition: search params, new component, KICKOFF_VIEW guard |
| `pages/preconstruction/DepartmentTrackingPage.tsx` | Enabled Kickoff MenuItem, added navigation handler |
| `pages/precon/EstimatingKickoffPage.tsx` | Search param reading, breadcrumbs, back button |
| `pages/precon/__tests__/EstimatingKickoffNavigation.test.tsx` | Navigation tests |

## Related

- [Stage 8 — Estimating Kickoff Guide](./Stage8-Estimating-Kickoff-Guide.md)
- [Route Map](./route-map.md)
- [Turnover Meeting Guide](./turnover-meeting-guide.md) (similar cross-workspace pattern)
