import * as React from 'react';
import { Outlet, createRootRouteWithContext, type AnyRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { ITelemetryService } from '@hbc/sp-services';
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
import { createSharedServicesWorkspaceRoutes } from './workspaces/routes.sharedservices';
import { createSiteControlWorkspaceRoutes } from './workspaces/routes.sitecontrol';
import { createProjectHubWorkspaceRoutes } from './workspaces/routes.projecthub';

export type TLazyWorkspaceBranch = 'sharedservices-marketing' | 'operations-logs' | 'admin';

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

function getCurrentHashPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  const hash = window.location.hash ?? '';
  if (!hash.startsWith('#')) {
    return '/';
  }
  const path = hash.slice(1);
  return path.length > 0 ? path : '/';
}

export async function loadLazyWorkspaceBranch<TModule>(
  branch: TLazyWorkspaceBranch,
  toPath: string,
  loader: () => Promise<TModule>,
  telemetryService?: ITelemetryService
): Promise<TModule> {
  const startedAt = (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();
  const fromPath = getCurrentHashPath();

  try {
    const module = await loader();
    const endedAt = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
    const durationMs = Math.max(0, Math.round(endedAt - startedAt));
    const properties = {
      branch,
      fromPath,
      toPath,
      success: 'true',
    };

    telemetryService?.trackMetric('route:lazy:load:duration', durationMs, properties);
    telemetryService?.trackEvent({
      name: 'route:lazy:load',
      properties,
      measurements: { durationMs },
    });

    return module;
  } catch (error) {
    const endedAt = (typeof performance !== 'undefined' && typeof performance.now === 'function')
      ? performance.now()
      : Date.now();
    const durationMs = Math.max(0, Math.round(endedAt - startedAt));
    const properties = {
      branch,
      fromPath,
      toPath,
      success: 'false',
    };

    telemetryService?.trackMetric('route:lazy:load:duration', durationMs, properties);
    telemetryService?.trackEvent({
      name: 'route:lazy:load',
      properties,
      measurements: { durationMs },
    });

    throw error;
  }
}

export async function createTanStackPilotRouteTree(telemetryService?: ITelemetryService) {
  return rootRoute.addChildren([
    // Hub workspace: placeholder home, access-denied, not-found
    ...(createHubWorkspaceRoutes(rootRoute) as AnyRoute[]),
    // Preconstruction workspace: BD, Estimating, IDS
    ...(createPreconstructionWorkspaceRoutes(rootRoute) as AnyRoute[]),
    // Admin workspace: System Config, Security, Provisioning, Dev Tools
    ...(createAdminWorkspaceRoutes(rootRoute, telemetryService) as AnyRoute[]),
    // Operations workspace: Commercial Ops, Project Hub, OpEx, Safety, QC & Warranty
    ...(createOperationsWorkspaceRoutes(rootRoute, telemetryService) as AnyRoute[]),
    // Shared Services workspace: Marketing, HR, Accounting, Risk Management
    ...(createSharedServicesWorkspaceRoutes(rootRoute, telemetryService) as AnyRoute[]),
    // HB Site Control workspace: Jobsite Management, Safety, Quality Control
    ...(createSiteControlWorkspaceRoutes(rootRoute) as AnyRoute[]),
    // Project Hub workspace: project-scoped cross-cutting module
    ...(createProjectHubWorkspaceRoutes(rootRoute) as AnyRoute[]),
  ]);
}
