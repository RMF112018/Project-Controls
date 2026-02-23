/**
 * Hub (Root) Workspace Routes
 *
 * Placeholder landing page, access-denied, and not-found.
 * 3 routes total.
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { AccessDeniedPage } from '../../../components/pages/shared/AccessDeniedPage';

const PlaceholderHome: React.FC = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2>HBC Project Controls</h2>
    <p>Modules coming soon.</p>
  </div>
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
    component: PlaceholderHome,
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
