/**
 * Shared Services Workspace Routes
 *
 * New workspace at /shared-services/* for Marketing, Accounting, HR, and Risk Management.
 * Marketing migrated from /marketing, Accounting from /accounting-queue.
 * Redirect routes at old paths are in routes.hub.tsx.
 * 4 routes total.
 */
import * as React from 'react';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../routeContext';
import { requirePermission } from '../guards/requirePermission';
import { ComingSoonPage } from '../../../components/shared/ComingSoonPage';

// --- Lazy components ---
const MarketingDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "page-marketing" */ '../../../components/pages/hub/MarketingDashboard'),
  'MarketingDashboard'
);
const AccountingQueuePage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'AccountingQueuePage'
);

// --- Guards ---
export function guardMarketing(context: ITanStackRouteContext): void {
  requirePermission(context, PERMISSIONS.MARKETING_DASHBOARD_VIEW);
}

export function guardAccountingQueue(context: ITanStackRouteContext): void {
  requirePermission(context, PERMISSIONS.ACCOUNTING_QUEUE_VIEW);
}

export function createSharedServicesWorkspaceRoutes(rootRoute: unknown) {
  const sharedServicesMarketingRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/shared-services/marketing',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardMarketing(context),
    component: MarketingDashboard,
  });

  const sharedServicesAccountingRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/shared-services/accounting',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAccountingQueue(context),
    component: AccountingQueuePage,
  });

  const sharedServicesHrRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/shared-services/hr',
    component: () => <ComingSoonPage title="Human Resources" />,
  });

  const sharedServicesRiskRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/shared-services/risk-management',
    component: () => <ComingSoonPage title="Risk Management" />,
  });

  return [
    sharedServicesMarketingRoute,
    sharedServicesAccountingRoute,
    sharedServicesHrRoute,
    sharedServicesRiskRoute,
  ] as unknown[];
}
