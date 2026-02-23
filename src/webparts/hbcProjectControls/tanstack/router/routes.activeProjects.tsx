import * as React from 'react';
import { Outlet, createRootRouteWithContext, type AnyRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { ITanStackRouteContext } from './routeContext';
import { AppShell } from '../../components/layouts/AppShell';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
import { useTelemetryPageView } from '../../hooks/useTelemetryPageView';

// Workspace route factories
import { createHubWorkspaceRoutes } from './workspaces/routes.hub';
import { createPreconstructionWorkspaceRoutes } from './workspaces/routes.preconstruction';
import { createAdminWorkspaceRoutes } from './workspaces/routes.admin';
import { createOperationsWorkspaceRoutes } from './workspaces/routes.operations';

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
  // Hub workspace: placeholder home, access-denied, not-found
  ...(createHubWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Preconstruction workspace: BD, Estimating, IDS
  ...(createPreconstructionWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Admin workspace: System Config, Security, Provisioning, Dev Tools
  ...(createAdminWorkspaceRoutes(rootRoute) as AnyRoute[]),
  // Operations workspace: Commercial Ops, Project Hub, OpEx, Safety, QC & Warranty
  ...(createOperationsWorkspaceRoutes(rootRoute) as AnyRoute[]),
]);
