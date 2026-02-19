import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { TANSTACK_ROUTER_PILOT_FLAG } from './constants';
const EstimatingDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule'),
  'EstimatingDashboard'
);
const PipelinePage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule'),
  'PipelinePage'
);
const EstimatingKickoffList = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule'),
  'EstimatingKickoffList'
);
const PostBidAutopsyList = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule'),
  'PostBidAutopsyList'
);
const PursuitDetail = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../features/preconstruction/PreconstructionModule'),
  'PursuitDetail'
);

function requirePilot(context: ITanStackRouteContext): void {
  requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
}

export function guardEstimatingTracker(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'EstimatingTracker');
}

export function guardPipelineDashboard(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'PipelineDashboard');
}

export function guardKickoffList(context: ITanStackRouteContext): void {
  requirePilot(context);
  requirePermission(context, PERMISSIONS.KICKOFF_VIEW);
}

export function guardAutopsyList(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'LossAutopsy');
  requirePermission(context, PERMISSIONS.AUTOPSY_VIEW);
}

export function guardPilotOnly(context: ITanStackRouteContext): void {
  requirePilot(context);
}

export function createPreconstructionBatchARoutes(rootRoute: unknown) {
  const preconstructionRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardEstimatingTracker(context),
    component: EstimatingDashboard,
  });

  const preconstructionPipelineRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pipeline',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPipelineDashboard(context),
    component: PipelinePage,
  });

  const preconstructionPipelineGoNoGoRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pipeline/gonogo',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPipelineDashboard(context),
    component: PipelinePage,
  });

  const preconstructionGoNoGoRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/gonogo',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPipelineDashboard(context),
    component: PipelinePage,
  });

  const preconstructionTrackerRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/precon-tracker',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardEstimatingTracker(context),
    component: EstimatingDashboard,
  });

  const preconstructionEstimateLogRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/estimate-log',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardEstimatingTracker(context),
    component: EstimatingDashboard,
  });

  const preconstructionKickoffListRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/kickoff-list',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardKickoffList(context),
    component: EstimatingKickoffList,
  });

  const preconstructionAutopsyListRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/autopsy-list',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAutopsyList(context),
    component: PostBidAutopsyList,
  });

  const pursuitDetailRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: PursuitDetail,
  });

  return [
    preconstructionRoute,
    preconstructionPipelineRoute,
    preconstructionPipelineGoNoGoRoute,
    preconstructionGoNoGoRoute,
    preconstructionTrackerRoute,
    preconstructionEstimateLogRoute,
    preconstructionKickoffListRoute,
    preconstructionAutopsyListRoute,
    pursuitDetailRoute,
  ] as unknown[];
}
