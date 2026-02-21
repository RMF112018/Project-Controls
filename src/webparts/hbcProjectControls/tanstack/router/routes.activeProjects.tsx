import * as React from 'react';
import { Outlet, createRootRouteWithContext, createRoute, lazyRouteComponent, type AnyRoute, useNavigate, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { activeProjectsListOptions } from '../query/queryOptions/activeProjects';
import { complianceSummaryOptions } from '../query/queryOptions/compliance';
import { requirePermission } from './guards/requirePermission';
import { requireProject } from './guards/requireProject';
import { AppShell } from '../../components/layouts/AppShell';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
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
  () => import(/* webpackChunkName: "page-dashboard" */ '../../components/pages/hub/DashboardPage'),
  'DashboardPage'
);

const TanStackAdapterBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tanStackNavigate = useNavigate();
  const navigateRef = React.useRef(tanStackNavigate);
  navigateRef.current = tanStackNavigate;

  const stableNavigate = React.useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      React.startTransition(() => {
        void navigateRef.current({ to, replace: options?.replace });
      });
    },
    [],
  );

  const { pathname, searchStr, paramsJson } = useRouterState({
    select: (state) => {
      const lastMatch = state.matches[state.matches.length - 1];
      return {
        pathname: state.location.pathname,
        searchStr: state.location.searchStr ?? '',
        paramsJson: JSON.stringify(lastMatch?.params ?? {}),
      };
    },
  });

  const params = React.useMemo(
    () => JSON.parse(paramsJson) as Record<string, string | undefined>,
    [paramsJson],
  );

  const adapterValue = React.useMemo(
    () => ({
      navigate: stableNavigate,
      pathname,
      search: searchStr,
      params,
    }),
    [stableNavigate, pathname, searchStr, params],
  );

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
  loader: ({ context }) => {
    // Preload heavy sub-pages on dashboard load (fire-and-forget)
    import(/* webpackChunkName: "page-schedule" */ '../../components/pages/project/SchedulePage').catch(() => {});
    import(/* webpackChunkName: "page-buyout-contract" */ '../../components/pages/project/BuyoutLogPage').catch(() => {});
    import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule').catch(() => {});
    import(/* webpackChunkName: "page-estimating-tracker" */ '../../components/pages/precon/EstimatingDashboard').catch(() => {});
    import(/* webpackChunkName: "page-gonogo" */ '../../components/pages/hub/GoNoGoScorecard').catch(() => {});
    import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule').catch(() => {});
    import(/* webpackChunkName: "page-pmp-16-section" */ '../../components/pages/project/pmp/ProjectManagementPlan').catch(() => {});
    import(/* webpackChunkName: "page-monthly-review" */ '../../components/pages/project/MonthlyProjectReview').catch(() => {});
    return context.queryClient.ensureQueryData(
      activeProjectsListOptions(context.scope, context.dataService, {})
    );
  },
  component: ActiveProjectsDashboard,
});

const operationsProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/project',
  beforeLoad: ({ context }) => {
    requireProject(context);
  },
  component: ProjectDashboard,
});

const operationsComplianceLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/compliance-log',
  beforeLoad: ({ context }) => {
    requirePermission(context, PERMISSIONS.COMPLIANCE_LOG_VIEW);
  },
  loader: ({ context }: { context: ITanStackRouteContext }) => {
    return context.queryClient.ensureQueryData(
      complianceSummaryOptions(context.scope, context.dataService)
    );
  },
  component: ComplianceLog,
});

export const tanStackPilotRouteTree = rootRoute.addChildren([
  dashboardRoute,
  operationsRoute,
  operationsProjectRoute,
  operationsComplianceLogRoute,
  ...(createOperationsBatchARoutes(rootRoute) as AnyRoute[]),
  ...(createOperationsBatchBRoutes(rootRoute) as AnyRoute[]),
  ...(createPreconstructionBatchARoutes(rootRoute) as AnyRoute[]),
  ...(createPreconstructionBatchBRoutes(rootRoute) as AnyRoute[]),
  ...(createLeadAndJobRequestBatchCRoutes(rootRoute) as AnyRoute[]),
  ...(createAdminAccountingBatchDRoutes(rootRoute) as AnyRoute[]),
  ...(createSystemBatchERoutes(rootRoute) as AnyRoute[]),
]);
