import * as React from 'react';
import { Outlet, createRootRouteWithContext, type AnyRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { ITanStackRouteContext } from './routeContext';
import { AppShell } from '../../components/layouts/AppShell';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
import { useTelemetryPageView } from '../../hooks/useTelemetryPageView';

// Workspace route factories (consolidated from 7 batch files)
import { createHubWorkspaceRoutes } from './workspaces/routes.hub';
import { createOperationsWorkspaceRoutes } from './workspaces/routes.operations';
import { createPreconstructionWorkspaceRoutes } from './workspaces/routes.preconstruction';
import { createSharedServicesWorkspaceRoutes } from './workspaces/routes.sharedservices';
import { createAdminWorkspaceRoutes } from './workspaces/routes.admin';

const TelemetryPageTracker: React.FC = () => {
  useTelemetryPageView();
  return null;
};

/**
 * RootLayout — no longer wrapped in TanStackAdapterBridge.
 * Adapter hooks (useAppNavigate, useAppLocation, useAppParams) now consume
 * TanStack Router hooks directly. RouterAdapterContext removed.
 */
const RootLayout: React.FC = () => (
  <>
    <TelemetryPageTracker />
    <AppShell>
      <ErrorBoundary>
        <React.Suspense fallback={<RouteSuspenseFallback />}>
          <Outlet />
        </React.Suspense>
      </ErrorBoundary>
    </AppShell>
    {(typeof window !== 'undefined'
      && window.location.hostname === 'localhost'
      && window.localStorage.getItem('showTanStackRouterDevtools') === 'true')
      ? <TanStackRouterDevtools />
      : null}
  </>
);

const rootRoute = createRootRouteWithContext<ITanStackRouteContext>()({
  component: RootLayout,
});

export const tanStackPilotRouteTree = rootRoute.addChildren([
  // Hub workspace: dashboard, access-denied, not-found, redirects
  ...(createHubWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Operations workspace: 26 routes
  ...(createOperationsWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Preconstruction workspace: 23 routes (precon + lead + job-request)
  ...(createPreconstructionWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Shared Services workspace: 4 routes (marketing, accounting, HR, risk)
  ...(createSharedServicesWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Admin workspace: 4 routes
  ...(createAdminWorkspaceRoutes(rootRoute) as AnyRoute[]),
]);
