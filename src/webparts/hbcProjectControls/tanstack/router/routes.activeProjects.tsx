import * as React from 'react';
import { Outlet, createRootRouteWithContext, createRoute, lazyRouteComponent, redirect, type AnyRoute, useNavigate, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { activeProjectsListOptions } from '../query/queryOptions/activeProjects';
import { requirePermission } from './guards/requirePermission';
import { requireProject } from './guards/requireProject';
import { AppShell } from '../../components/layouts/AppShell';
import { RouterAdapterProvider } from '../../components/contexts/RouterAdapterContext';
import { createOperationsBatchARoutes } from './routes.operations.batchA';
import { createOperationsBatchBRoutes } from './routes.operations.batchB';
import { createPreconstructionBatchARoutes } from './routes.preconstruction.batchA';
import { createPreconstructionBatchBRoutes } from './routes.preconstruction.batchB';
import { createLeadAndJobRequestBatchCRoutes } from './routes.leadAndJobRequest.batchC';
import { createAdminAccountingBatchDRoutes } from './routes.adminAccounting.batchD';
import { createSystemBatchERoutes } from './routes.system.batchE';
import { useTelemetryPageView } from '../../hooks/useTelemetryPageView';
const ActiveProjectsDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ActiveProjectsDashboard'
);
const ProjectDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ProjectDashboard'
);
const ComplianceLog = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ComplianceLog'
);
const DashboardPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-shared" */ '../../features/shared/SharedModule'),
  'DashboardPage'
);

const TanStackAdapterBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname, searchStr, matches } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      searchStr: state.location.searchStr ?? '',
      matches: state.matches,
    }),
  });

  const params = (matches[matches.length - 1]?.params ?? {}) as Record<string, string | undefined>;

  const adapterValue = React.useMemo(() => ({
    navigate: (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      void navigate({ to, replace: options?.replace });
    },
    pathname,
    search: searchStr,
    params,
  }), [matches, navigate, pathname, searchStr]);

  return <RouterAdapterProvider value={adapterValue}>{children}</RouterAdapterProvider>;
};

const TelemetryPageTracker: React.FC = () => {
  useTelemetryPageView();
  return null;
};

const RootLayout: React.FC = () => (
  <TanStackAdapterBridge>
    <TelemetryPageTracker />
    <AppShell>
      <Outlet />
    </AppShell>
    {(typeof window !== 'undefined'
      && window.location.hostname === 'localhost'
      && window.localStorage.getItem('showTanStackRouterDevtools') === 'true')
      ? <TanStackRouterDevtools />
      : null}
  </TanStackAdapterBridge>
);

const rootRoute = createRootRouteWithContext<ITanStackRouteContext>()({
  component: RootLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const operationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations',
  beforeLoad: ({ context }) => {
    requirePermission(context, PERMISSIONS.ACTIVE_PROJECTS_VIEW);
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(
    activeProjectsListOptions(context.scope, context.dataService, {})
  ),
  component: ActiveProjectsDashboard,
});

const operationsProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/$projectId/project',
  beforeLoad: ({ params }) => {
    requireProject(params.projectId);
  },
  component: ProjectDashboard,
});

const operationsProjectLegacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/project',
  beforeLoad: ({ context }) => {
    if (!context.activeProjectCode) {
      throw redirect({ to: '/operations', replace: true });
    }
    throw redirect({ to: `/operations/${encodeURIComponent(context.activeProjectCode)}/project`, replace: true });
  },
  component: () => null,
});

const operationsComplianceLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/compliance-log',
  beforeLoad: ({ context }) => {
    requirePermission(context, PERMISSIONS.COMPLIANCE_LOG_VIEW);
  },
  component: ComplianceLog,
});

export const tanStackPilotRouteTree = rootRoute.addChildren([
  dashboardRoute,
  operationsRoute,
  operationsProjectRoute,
  operationsProjectLegacyRoute,
  operationsComplianceLogRoute,
  ...(createOperationsBatchARoutes(rootRoute) as AnyRoute[]),
  ...(createOperationsBatchBRoutes(rootRoute) as AnyRoute[]),
  ...(createPreconstructionBatchARoutes(rootRoute) as AnyRoute[]),
  ...(createPreconstructionBatchBRoutes(rootRoute) as AnyRoute[]),
  ...(createLeadAndJobRequestBatchCRoutes(rootRoute) as AnyRoute[]),
  ...(createAdminAccountingBatchDRoutes(rootRoute) as AnyRoute[]),
  ...(createSystemBatchERoutes(rootRoute) as AnyRoute[]),
]);
