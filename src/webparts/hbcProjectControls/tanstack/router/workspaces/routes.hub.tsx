/**
 * Hub (Root) Workspace Routes
 *
 * Analytics Hub Dashboard, access-denied, and not-found.
 * 3 routes total.
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { AccessDeniedPage } from '../../../components/pages/shared/AccessDeniedPage';

const AnalyticsHubDashboardPage = React.lazy(() =>
  import('../../../components/pages/hub/AnalyticsHubDashboardPage').then(m => ({ default: m.AnalyticsHubDashboardPage }))
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
    component: AnalyticsHubDashboardPage,
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
    dashboardRoute,
    accessDeniedRoute,
    notFoundRoute,
  ] as unknown[];
}
