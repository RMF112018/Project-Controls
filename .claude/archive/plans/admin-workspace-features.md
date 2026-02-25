# Plan: Admin Workspace Features (Streamlined v2)

## Context

The Admin workspace is the central system administration surface in the HBC suite. This revised plan further streamlines the structure per owner feedback: Feature Flags and Audit Log are moved into Dev Tools, and Workflows are moved into System Configuration. The result is 4 clean contextual sidebar groups.

No routing changes, no external connectors. All work on `feature/hbc-suite-stabilization`.

## Deliverables – Streamlined Features

### Contextual Sidebar Groups (4 total)

**Group 1: System Configuration**  
- Connections (SharePoint, Graph, PnP, Power Automate, Azure Functions + Test buttons)  
- Hub Site URL (test + save)  
- Workflows (WorkflowDefinitionsPanel)

**Group 2: Security & Access**  
- Roles (list + management)  
- Permissions (PermissionTemplateEditor)  
- Assignments (ProjectAssignmentsPanel)  
- Sectors (definitions table)

**Group 3: Provisioning**  
- Provisioning (queue table, retry, live polling, expandable status view, TemplateSiteSyncPanel)

**Group 4: Dev Tools** (visible only when DevUserManagement flag is enabled and MockDataService active)  
- Dev Users (inline role editor)  
- Feature Flags (grouped toggles with badges)  
- Audit Log (filtered table + export)

### Shared Elements
- Global error buffer display (last 50 client-side errors)  
- Consistent StatusBadge, ExportButtons, CollapsibleSection, and tabbed sub-interface  
- All groups gated by appropriate RoleGate + FeatureGate

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 4 sidebar groups | Collapsible groups with internal tabs | Minimal cognitive load, follows modern admin UX |
| Feature Flags + Audit Log in Dev Tools | Logical grouping for advanced users | Keeps production UI clean |
| Workflows in System Configuration | Related to provisioning and hub configuration | Natural flow |

## Verification

- All 4 sidebar groups render and expand correctly  
- Internal tabs switch without issues  
- RoleGate and FeatureGate enforce access per group/tab  
- All buttons, toggles, forms, tables, and polling function  
- `npm run verify:sprint3` + `npm run test:a11y` pass

## Post-Implementation

- Update CLAUDE.md §20 with the final streamlined Admin workspace structure  
- Update master plan to mark Admin workspace features as COMPLETE

**Governance Note**: This plan is the single source of truth for the Admin workspace. Any deviation requires owner approval and immediate CLAUDE.md update.