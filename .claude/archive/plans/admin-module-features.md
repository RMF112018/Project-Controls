# Plan: Admin Module Features (Phase 4 – Admin Enhancements)

## Context

The Admin Panel is the central system administration surface for the HBC Project Controls suite. It must provide all configuration, monitoring, and management capabilities in a single, role-gated interface. This plan defines the exact features to implement based on the current AdminPanel.tsx structure (provided 22 Feb 2026).  

No routing changes, no external connectors, and no new navigation elements are included in this plan. Focus is strictly on the UI features, data interactions via IDataService, and supporting components.

All work occurs on `feature/hbc-suite-stabilization`.

## Deliverables – Features to Include

### 1. Connection Testing Tab
- List of 5 core services (SharePoint Lists, Graph API, PnP Provisioning, Power Automate, Azure Functions)
- Individual "Test" button per service with loading state
- "Test All" button
- Status badges (Connected / Disconnected / Unknown) with color coding
- Last tested timestamp

### 2. Roles Management Tab
- HbcTanStackTable showing all roles (Title, Users, Permissions count, Active status)
- RoleGate protection (ADMIN_ROLES permission)

### 3. Feature Flags Tab
- Grouped by category (Core Platform, Preconstruction, Project Execution, Infrastructure, Integrations, Debug, Other)
- Category header with "X of Y enabled" badge
- CollapsibleSection per category
- Toggle switch for each flag with loading state
- DisplayName, TargetDate, Notes columns
- RoleGate protection (ADMIN_FLAGS permission)

### 4. Hub Site URL Configuration
- Text input for hub site URL
- "Test" button (validates https:// prefix)
- "Save" button with success/failed feedback
- Audit log entry on save

### 5. Provisioning Queue Tab
- HbcTanStackTable of provisioning logs (Project Code, Name, Status, Progress, Error, Requested At, Nav Link status, Actions)
- Status badges with colors
- Retry button for failed/partial-failure logs
- Retry Nav Link button for completed logs with failed nav link
- Expandable details panel showing ProvisioningStatusView with live polling
- Live/Simulation badge based on ProvisioningRealOps flag
- RoleGate protection (ADMIN_PROVISIONING permission)
- TemplateSiteSyncPanel (gated)

### 6. Workflows Tab
- WorkflowDefinitionsPanel (gated by WorkflowDefinitions feature flag)
- Assignment Mappings section (gated by ADMIN_ASSIGNMENTS permission)
  - Form to add new mapping (Region, Sector, Type, Assignee Name, Email)
  - Table of existing mappings with Remove button
  - Audit log entry on add/remove

### 7. Permissions Tab
- PermissionTemplateEditor (gated by PermissionEngine feature flag and PERMISSION_TEMPLATES_MANAGE permission)

### 8. Sectors Tab
- Table of sector definitions (Sort Order, Label, Code, Active status)
- Form to add new sector
- Activate/Deactivate button per row
- RoleGate protection

### 9. Project Assignments Tab
- ProjectAssignmentsPanel (gated by PERMISSION_PROJECT_TEAM_MANAGE permission)

### 10. Dev Users Tab (Dev Mode Only)
- Visible only when DevUserManagement feature flag is enabled and MockDataService is active
- Table of dev users with inline editing of roles
- Save/Cancel per row
- Info banner: changes are session-only

### 11. Audit Log Tab
- Filters: Date range (From/To), Entity, Action
- HbcTanStackTable with columns: Timestamp, User, Action, Entity, ID, Field, Change, Details
- Export buttons (CSV/Excel)
- Refresh button
- Performance note for >5000 entries

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Feature organization | 10 distinct tabs | Matches existing AdminPanel structure and owner expectations |
| Data loading | Lazy per-tab (useEffect on activeTab) | Prevents unnecessary API calls on every tab switch |
| Error handling | Global ErrorBuffer + console capture | Captures client-side errors for Admin visibility |
| Role gating | RoleGate + hasPermission checks per tab | Consistent with permission-system skill |
| Feature gating | FeatureGate + isFeatureEnabled checks | Consistent with existing pattern |
| Mock vs Live | isFeatureEnabled('ProvisioningRealOps') for simulation/live badge | Already present in code |

## Verification

- All 11 tabs render without errors for Admin role
- All buttons, toggles, forms, tables, and expandable panels function as described
- RoleGate and FeatureGate block access correctly
- Audit logging triggers on all mutations
- `npm run verify:sprint3` + `npm run test:a11y` pass
- No new routing or connectors added

## Post-Implementation

- Update CLAUDE.md §15 to note Admin module features complete
- Update master plan to mark Admin module features as COMPLETE

**Governance Note**: This plan is the single source of truth for the Admin module features. Any deviation requires owner approval and immediate CLAUDE.md update.