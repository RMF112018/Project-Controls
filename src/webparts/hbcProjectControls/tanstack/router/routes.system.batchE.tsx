import * as React from 'react';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { TANSTACK_ROUTER_ENABLED_FLAG } from './constants';
import { AccessDeniedPage } from '../../components/pages/shared/AccessDeniedPage';

const MarketingDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-shared" */ '../../features/shared/SharedModule'),
  'MarketingDashboard'
);

const NotFoundPage: React.FC = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2>Page Not Found</h2>
    <p>The page you requested does not exist.</p>
  </div>
);

function requirePilot(context: ITanStackRouteContext): void {
  requireFeature(context, TANSTACK_ROUTER_ENABLED_FLAG);
}

export function guardMarketing(context: ITanStackRouteContext): void {
  requirePilot(context);
  requirePermission(context, PERMISSIONS.MARKETING_DASHBOARD_VIEW);
}

export function createSystemBatchERoutes(rootRoute: unknown) {
  const marketingRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/marketing',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardMarketing(context),
    component: MarketingDashboard,
  });

  const accessDeniedRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/access-denied',
    component: AccessDeniedPage,
  });

  const notFoundRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/$',
    component: NotFoundPage,
  });

  return [
    marketingRoute,
    accessDeniedRoute,
    notFoundRoute,
  ] as unknown[];
}
