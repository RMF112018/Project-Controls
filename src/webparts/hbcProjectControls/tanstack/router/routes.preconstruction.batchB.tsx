import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { TANSTACK_ROUTER_PILOT_FLAG } from './constants';
import { EstimatingKickoffPage } from '../../components/pages/precon/EstimatingKickoffPage';
import { InterviewPrep } from '../../components/pages/project/InterviewPrep';
import { WinLossRecorder } from '../../components/pages/project/WinLossRecorder';
import { TurnoverToOps } from '../../components/pages/project/TurnoverToOps';
import { LossAutopsy } from '../../components/pages/project/LossAutopsy';
import { PostBidAutopsyForm } from '../../components/pages/precon/PostBidAutopsyForm';
import { DeliverablesTracker } from '../../components/pages/project/DeliverablesTracker';

function requirePilot(context: ITanStackRouteContext): void {
  requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
}

export function guardKickoffPage(context: ITanStackRouteContext): void {
  requirePilot(context);
  requirePermission(context, PERMISSIONS.KICKOFF_VIEW);
}

export function guardTurnover(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'TurnoverWorkflow');
}

export function guardAutopsy(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'LossAutopsy');
}

export function guardAutopsyForm(context: ITanStackRouteContext): void {
  guardAutopsy(context);
  requirePermission(context, PERMISSIONS.AUTOPSY_VIEW);
}

export function guardPilotOnly(context: ITanStackRouteContext): void {
  requirePilot(context);
}

export function createPreconstructionBatchBRoutes(rootRoute: unknown) {
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

  return [
    kickoffPageRoute,
    interviewRoute,
    winLossRoute,
    turnoverRoute,
    autopsyRoute,
    autopsyFormRoute,
    deliverablesRoute,
  ] as unknown[];
}

