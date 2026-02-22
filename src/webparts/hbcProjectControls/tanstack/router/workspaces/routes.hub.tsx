/**
 * Hub (Root) Workspace Routes
 *
 * Dashboard, access-denied, not-found, and redirect routes for old URLs.
 * 5 routes total (dashboard + access-denied + not-found + 2 redirects).
 */
import * as React from 'react';
import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { AccessDeniedPage } from '../../../components/pages/shared/AccessDeniedPage';

const DashboardPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "page-dashboard" */ '../../../components/pages/hub/DashboardPage'),
  'DashboardPage'
);

const NotFoundPage: React.FC = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2>Page Not Found</h2>
    <p>The page you requested does not exist.</p>
  </div>
);

export function createHubWorkspaceRoutes(rootRoute: unknown) {
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/',
    component: DashboardPage,
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

  // --- Redirect routes for old URLs (backward compatibility) ---
  const marketingRedirectRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/marketing',
    beforeLoad: () => {
      throw redirect({ to: '/shared-services/marketing' });
    },
  });

  const accountingRedirectRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/accounting-queue',
    beforeLoad: () => {
      throw redirect({ to: '/shared-services/accounting' });
    },
  });

  return [
    dashboardRoute,
    accessDeniedRoute,
    notFoundRoute,
    marketingRedirectRoute,
    accountingRedirectRoute,
  ] as unknown[];
}
