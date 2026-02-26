/**
 * Admin Workspace Routes
 *
 * 4 sidebar groups: System Configuration, Security & Access, Provisioning, Dev Tools.
 * 12 routes total (1 layout + 11 children).
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import type { ITelemetryService } from '@hbc/sp-services';
import { PERMISSIONS } from '@hbc/sp-services';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireRole } from '../guards/requireRole';
import type { ITanStackRouteContext } from '../routeContext';
import { loadLazyWorkspaceBranch } from '../routes.activeProjects';

// Lazy page imports for code-splitting
const AdminLayout = React.lazy(() =>
  import('../../../components/layouts/AdminLayout').then(m => ({ default: m.AdminLayout }))
);
const AdminDashboardPage = React.lazy(() =>
  import('../../../components/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage }))
);

// System Configuration
const ConnectionsPage = React.lazy(() =>
  import('../../../components/pages/admin/ConnectionsPage').then(m => ({ default: m.ConnectionsPage }))
);
const HubSiteUrlPage = React.lazy(() =>
  import('../../../components/pages/admin/HubSiteUrlPage').then(m => ({ default: m.HubSiteUrlPage }))
);
const WorkflowsPage = React.lazy(() =>
  import('../../../components/pages/admin/WorkflowsPage').then(m => ({ default: m.WorkflowsPage }))
);

// Security & Access
const RolesPage = React.lazy(() =>
  import('../../../components/pages/admin/RolesPage').then(m => ({ default: m.RolesPage }))
);
const PermissionsPage = React.lazy(() =>
  import('../../../components/pages/admin/PermissionsPage').then(m => ({ default: m.PermissionsPage }))
);
const AssignmentsPage = React.lazy(() =>
  import('../../../components/pages/admin/AssignmentsPage').then(m => ({ default: m.AssignmentsPage }))
);
const SectorsPage = React.lazy(() =>
  import('../../../components/pages/admin/SectorsPage').then(m => ({ default: m.SectorsPage }))
);

// Provisioning
const ProvisioningPage = React.lazy(() =>
  import('../../../components/pages/admin/ProvisioningPage').then(m => ({ default: m.ProvisioningPage }))
);

// Dev Tools
const DevUsersPage = React.lazy(() =>
  import('../../../components/pages/admin/DevUsersPage').then(m => ({ default: m.DevUsersPage }))
);
const FeatureFlagsPage = React.lazy(() =>
  import('../../../components/pages/admin/FeatureFlagsPage').then(m => ({ default: m.FeatureFlagsPage }))
);
const AuditLogPage = React.lazy(() =>
  import('../../../components/pages/admin/AuditLogPage').then(m => ({ default: m.AuditLogPage }))
);

export function createAdminWorkspaceRoutes(rootRoute: unknown, telemetryService?: ITelemetryService) {
  // Layout route — feature-gated
  const adminLayout = createRoute({
    getParentRoute: () => rootRoute as never,
    id: 'admin-layout',
    component: AdminLayout,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'AdminWorkspace');
      requireRole(context, ['Administrator']);
    },
  }).lazy(() => loadLazyWorkspaceBranch(
    'admin',
    '/admin',
    () => import('./routes.admin.lazy'),
    telemetryService
  ).then(m => m.AdminLayoutLazyRoute as never));

  // Dashboard landing
  const adminDashboard = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin',
    component: AdminDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
    },
  });

  // ── System Configuration ─────────────────────────────────────────
  const connections = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/connections',
    component: ConnectionsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ADMIN_CONNECTIONS);
    },
  });

  const hubSiteUrl = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/hub-site',
    component: HubSiteUrlPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
    },
  });

  const workflows = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/workflows',
    component: WorkflowsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'WorkflowDefinitions');
      requirePermission(context, PERMISSIONS.WORKFLOW_MANAGE);
    },
  });

  // ── Security & Access ────────────────────────────────────────────
  const roles = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/roles',
    component: RolesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ADMIN_ROLES);
    },
  });

  const permissions = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/permissions',
    component: PermissionsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'PermissionEngine');
      requirePermission(context, PERMISSIONS.PERMISSION_TEMPLATES_MANAGE);
    },
  });

  const assignments = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/assignments',
    component: AssignmentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PERMISSION_PROJECT_TEAM_MANAGE);
    },
  });

  const sectors = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/sectors',
    component: SectorsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
    },
  });

  // ── Provisioning ─────────────────────────────────────────────────
  const provisioning = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/provisioning',
    component: ProvisioningPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ADMIN_PROVISIONING);
    },
  });

  // ── Dev Tools ────────────────────────────────────────────────────
  const devUsers = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/dev-users',
    component: DevUsersPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'DevUserManagement');
      requirePermission(context, PERMISSIONS.ADMIN_FLAGS);
    },
  });

  const featureFlags = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/feature-flags',
    component: FeatureFlagsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'DevUserManagement');
      requirePermission(context, PERMISSIONS.ADMIN_FLAGS);
    },
  });

  const auditLog = createRoute({
    getParentRoute: () => adminLayout as never,
    path: '/admin/audit-log',
    component: AuditLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'DevUserManagement');
      requirePermission(context, PERMISSIONS.ADMIN_FLAGS);
    },
  });

  return [
    adminLayout.addChildren([
      adminDashboard,
      // System Configuration
      connections,
      hubSiteUrl,
      workflows,
      // Security & Access
      roles,
      permissions,
      assignments,
      sectors,
      // Provisioning
      provisioning,
      // Dev Tools
      devUsers,
      featureFlags,
      auditLog,
    ] as never),
  ] as unknown[];
}
