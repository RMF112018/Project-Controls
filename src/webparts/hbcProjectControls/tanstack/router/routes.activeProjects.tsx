import * as React from 'react';
import { Outlet, createRootRouteWithContext, createRoute, lazyRouteComponent, type AnyRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { activeProjectsListOptions } from '../query/queryOptions/activeProjects';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { requireProject } from './guards/requireProject';
import { TANSTACK_ROUTER_PILOT_FLAG } from './constants';
import { createOperationsBatchARoutes } from './routes.operations.batchA';
import { createOperationsBatchBRoutes } from './routes.operations.batchB';
import { createPreconstructionBatchARoutes } from './routes.preconstruction.batchA';
import { createPreconstructionBatchBRoutes } from './routes.preconstruction.batchB';
import { createLeadAndJobRequestBatchCRoutes } from './routes.leadAndJobRequest.batchC';
import { createAdminAccountingBatchDRoutes } from './routes.adminAccounting.batchD';
import { createSystemBatchERoutes } from './routes.system.batchE';
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

const rootRoute = createRootRouteWithContext<ITanStackRouteContext>()({
  component: () => <Outlet />,
});

const operationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations',
  beforeLoad: ({ context }) => {
    requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
    requirePermission(context, PERMISSIONS.ACTIVE_PROJECTS_VIEW);
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(
    activeProjectsListOptions(context.scope, context.dataService, {})
  ),
  component: ActiveProjectsDashboard,
});

const operationsProjectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/project',
  beforeLoad: ({ context }) => {
    requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
    requireProject(context);
  },
  component: ProjectDashboard,
});

const operationsComplianceLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations/compliance-log',
  beforeLoad: ({ context }) => {
    requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
    requirePermission(context, PERMISSIONS.COMPLIANCE_LOG_VIEW);
  },
  component: ComplianceLog,
});

export const tanStackPilotRouteTree = rootRoute.addChildren([
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
