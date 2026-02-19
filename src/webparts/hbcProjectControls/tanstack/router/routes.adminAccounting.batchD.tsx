import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { TANSTACK_ROUTER_PILOT_FLAG } from './constants';
const AccountingQueuePage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'AccountingQueuePage'
);
const AdminPanel = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'AdminPanel'
);
const PerformanceDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'PerformanceDashboard'
);
const ApplicationSupportPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'ApplicationSupportPage'
);
const TelemetryDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'TelemetryDashboard'
);

function requirePilot(context: ITanStackRouteContext): void {
  requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
}

export function guardAccountingQueue(context: ITanStackRouteContext): void {
  requirePilot(context);
  requirePermission(context, PERMISSIONS.ACCOUNTING_QUEUE_VIEW);
}

export function guardAdmin(context: ITanStackRouteContext): void {
  requirePilot(context);
  requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
}

export function guardAdminPerformance(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'PerformanceMonitoring');
  requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
}

export function guardAdminSupport(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'EnableHelpSystem');
  requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
}

export function guardAdminTelemetry(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'TelemetryDashboard');
  requirePermission(context, PERMISSIONS.ADMIN_CONFIG);
}

export function createAdminAccountingBatchDRoutes(rootRoute: unknown) {
  const accountingQueueRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/accounting-queue',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAccountingQueue(context),
    component: AccountingQueuePage,
  });

  const adminRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/admin',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAdmin(context),
    component: AdminPanel,
  });

  const adminPerformanceRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/admin/performance',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAdminPerformance(context),
    component: PerformanceDashboard,
  });

  const adminSupportRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/admin/application-support',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAdminSupport(context),
    component: ApplicationSupportPage,
  });

  const adminTelemetryRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/admin/telemetry',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAdminTelemetry(context),
    component: TelemetryDashboard,
  });

  return [
    accountingQueueRoute,
    adminRoute,
    adminPerformanceRoute,
    adminSupportRoute,
    adminTelemetryRoute,
  ] as unknown[];
}
