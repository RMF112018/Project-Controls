/**
 * Preconstruction Workspace Routes
 *
 * Consolidates all /preconstruction/*, /lead/*, and /job-request/* routes
 * from the former precon batchA, batchB, and lead/jobRequest batchC files.
 * 23 routes total — flat children of rootRoute.
 */
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../routeContext';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { leadsListOptions } from '../../query/queryOptions/leads';
import { estimatingRecordsOptions } from '../../query/queryOptions/estimating';
import { scorecardByLeadOptions } from '../../query/queryOptions/gonogo';

// --- Lazy components (preconstruction chunk) ---
const EstimatingDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "page-estimating-tracker" */ '../../../components/pages/precon/EstimatingDashboard'),
  'EstimatingDashboard'
);
const PipelinePage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'PipelinePage'
);
const EstimatingKickoffList = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'EstimatingKickoffList'
);
const PostBidAutopsyList = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'PostBidAutopsyList'
);
const PursuitDetail = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'PursuitDetail'
);
const EstimatingKickoffPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'EstimatingKickoffPage'
);
const InterviewPrep = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'InterviewPrep'
);
const WinLossRecorder = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'WinLossRecorder'
);
const TurnoverToOps = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'TurnoverToOps'
);
const LossAutopsy = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'LossAutopsy'
);
const PostBidAutopsyForm = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'PostBidAutopsyForm'
);
const DeliverablesTracker = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule'),
  'DeliverablesTracker'
);

// --- Lazy components (lead/job-request — admin-hub chunk) ---
const LeadFormPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'LeadFormPage'
);
const LeadDetailPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'LeadDetailPage'
);
const GoNoGoScorecard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'GoNoGoScorecard'
);
const GoNoGoDetail = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'GoNoGoDetail'
);
const GoNoGoMeetingScheduler = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'GoNoGoMeetingScheduler'
);
const JobNumberRequestForm = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'JobNumberRequestForm'
);

// --- Guards ---
export function guardEstimatingTracker(context: ITanStackRouteContext): void {
  requireFeature(context, 'EstimatingTracker');
}

export function guardPipelineDashboard(context: ITanStackRouteContext): void {
  requireFeature(context, 'PipelineDashboard');
}

export function guardKickoffList(context: ITanStackRouteContext): void {
  requirePermission(context, PERMISSIONS.KICKOFF_VIEW);
}

export function guardAutopsyList(context: ITanStackRouteContext): void {
  requireFeature(context, 'LossAutopsy');
  requirePermission(context, PERMISSIONS.AUTOPSY_VIEW);
}

export function guardKickoffPage(context: ITanStackRouteContext): void {
  requirePermission(context, PERMISSIONS.KICKOFF_VIEW);
}

export function guardTurnover(context: ITanStackRouteContext): void {
  requireFeature(context, 'TurnoverWorkflow');
}

export function guardAutopsy(context: ITanStackRouteContext): void {
  requireFeature(context, 'LossAutopsy');
}

export function guardAutopsyForm(context: ITanStackRouteContext): void {
  guardAutopsy(context);
  requirePermission(context, PERMISSIONS.AUTOPSY_VIEW);
}

export function guardLeadIntake(context: ITanStackRouteContext): void {
  requireFeature(context, 'LeadIntake');
}

export function guardGoNoGo(context: ITanStackRouteContext): void {
  requireFeature(context, 'GoNoGoScorecard');
}

export function guardPilotOnly(_context: ITanStackRouteContext): void {}

export function createPreconstructionWorkspaceRoutes(rootRoute: unknown) {
  // --- Preconstruction hub & list routes (former batchA) ---
  const preconstructionRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardEstimatingTracker(context),
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      return context.queryClient.ensureQueryData(
        estimatingRecordsOptions(context.scope, context.dataService)
      );
    },
    component: EstimatingDashboard,
  });

  const preconstructionPipelineRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pipeline',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPipelineDashboard(context),
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      return context.queryClient.ensureQueryData(
        leadsListOptions(context.scope, context.dataService)
      );
    },
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

  // --- Pursuit sub-routes (former batchB) ---
  const kickoffPageRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/kickoff',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardKickoffPage(context),
    component: EstimatingKickoffPage,
  });

  const interviewRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/interview',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: InterviewPrep,
  });

  const winLossRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/winloss',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: WinLossRecorder,
  });

  const turnoverRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/turnover',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardTurnover(context),
    component: TurnoverToOps,
  });

  const autopsyRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/autopsy',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAutopsy(context),
    component: LossAutopsy,
  });

  const autopsyFormRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/autopsy-form',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardAutopsyForm(context),
    component: PostBidAutopsyForm,
  });

  const deliverablesRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/preconstruction/pursuit/$id/deliverables',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPilotOnly(context),
    component: DeliverablesTracker,
  });

  // --- Lead & Job Request routes (former batchC) ---
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
    // Preconstruction hub & lists
    preconstructionRoute,
    preconstructionPipelineRoute,
    preconstructionPipelineGoNoGoRoute,
    preconstructionGoNoGoRoute,
    preconstructionTrackerRoute,
    preconstructionEstimateLogRoute,
    preconstructionKickoffListRoute,
    preconstructionAutopsyListRoute,
    pursuitDetailRoute,
    // Pursuit sub-routes
    kickoffPageRoute,
    interviewRoute,
    winLossRoute,
    turnoverRoute,
    autopsyRoute,
    autopsyFormRoute,
    deliverablesRoute,
    // Lead & Job Request
    leadNewRoute,
    leadDetailRoute,
    leadGoNoGoRoute,
    leadGoNoGoDetailRoute,
    leadScheduleGoNoGoRoute,
    jobRequestRoute,
    jobRequestByLeadRoute,
  ] as unknown[];
}
