import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { scorecardByLeadOptions } from '../query/queryOptions/gonogo';
const LeadFormPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'LeadFormPage'
);
const LeadDetailPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'LeadDetailPage'
);
const GoNoGoScorecard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'GoNoGoScorecard'
);
const GoNoGoDetail = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'GoNoGoDetail'
);
const GoNoGoMeetingScheduler = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'GoNoGoMeetingScheduler'
);
const JobNumberRequestForm = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'JobNumberRequestForm'
);

export function guardLeadIntake(context: ITanStackRouteContext): void {
  requireFeature(context, 'LeadIntake');
}

export function guardGoNoGo(context: ITanStackRouteContext): void {
  requireFeature(context, 'GoNoGoScorecard');
}

export function guardPilotOnly(_context: ITanStackRouteContext): void {}

export function createLeadAndJobRequestBatchCRoutes(rootRoute: unknown) {
  const leadNewRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/lead/new',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardLeadIntake(context),
    component: LeadFormPage,
  });

  const leadDetailRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/lead/$id',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: LeadDetailPage,
  });

  const leadGoNoGoRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/lead/$id/gonogo',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardGoNoGo(context),
    loader: ({ context, params }: { context: ITanStackRouteContext; params: { id: string } }) => {
      const leadId = parseInt(params.id, 10);
      if (leadId > 0) {
        return context.queryClient.ensureQueryData(
          scorecardByLeadOptions(context.scope, context.dataService, leadId)
        );
      }
      return Promise.resolve(null);
    },
    component: GoNoGoScorecard,
  });

  const leadGoNoGoDetailRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/lead/$id/gonogo/detail',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardGoNoGo(context),
    component: GoNoGoDetail,
  });

  const leadScheduleGoNoGoRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/lead/$id/schedule-gonogo',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardGoNoGo(context),
    component: GoNoGoMeetingScheduler,
  });

  const jobRequestRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/job-request',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: JobNumberRequestForm,
  });

  const jobRequestByLeadRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/job-request/$leadId',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: JobNumberRequestForm,
  });

  return [
    leadNewRoute,
    leadDetailRoute,
    leadGoNoGoRoute,
    leadGoNoGoDetailRoute,
    leadScheduleGoNoGoRoute,
    jobRequestRoute,
    jobRequestByLeadRoute,
  ] as unknown[];
}
