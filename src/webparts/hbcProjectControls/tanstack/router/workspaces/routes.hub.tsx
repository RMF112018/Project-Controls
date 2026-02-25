/**
 * Hub (Root) Workspace Routes
 *
 * Analytics Hub Dashboard, access-denied, not-found, and role-based
 * shorthand redirect routes for the 16-role landing page mapping.
 */
import * as React from 'react';
import { createRoute, redirect } from '@tanstack/react-router';
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

function redirectRoute(root: unknown, from: string, to: string) {
  return createRoute({
    getParentRoute: () => root as never,
    path: from,
    beforeLoad: () => { throw redirect({ to }); },
  });
}

export function createHubWorkspaceRoutes(rootRoute: unknown) {
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/',
    component: AnalyticsHubDashboardPage,
  });

  const hubAliasRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/hub',
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
    hubAliasRoute,
    accessDeniedRoute,
    // Role-based shorthand redirects
    redirectRoute(rootRoute, '/marketing', '/shared-services/marketing'),
    redirectRoute(rootRoute, '/business-development', '/preconstruction/bd'),
    redirectRoute(rootRoute, '/estimating', '/preconstruction/estimating'),
    redirectRoute(rootRoute, '/ids', '/preconstruction/ids'),
    redirectRoute(rootRoute, '/opex', '/operations/opex'),
    redirectRoute(rootRoute, '/safety', '/operations/safety'),
    redirectRoute(rootRoute, '/qc-warranty', '/operations/qc-warranty'),
    redirectRoute(rootRoute, '/people-culture', '/shared-services/hr'),
    redirectRoute(rootRoute, '/accounting', '/shared-services/accounting'),
    redirectRoute(rootRoute, '/risk-management', '/shared-services/risk-management'),
    notFoundRoute,
  ] as unknown[];
}
