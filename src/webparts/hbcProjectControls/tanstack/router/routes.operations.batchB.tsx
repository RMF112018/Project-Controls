import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requireProject } from './guards/requireProject';
import { TANSTACK_ROUTER_PILOT_FLAG } from './constants';
import { ResponsibilityMatrices } from '../../components/pages/project/ResponsibilityMatrices';
import { ProjectRecord } from '../../components/pages/project/ProjectRecord';
import { LessonsLearnedPage } from '../../components/pages/project/LessonsLearnedPage';
import { GoNoGoScorecard } from '../../components/pages/hub/GoNoGoScorecard';
import { ComingSoonPage } from '../../components/shared/ComingSoonPage';

function requirePilot(context: ITanStackRouteContext): void {
  requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
}

export function guardResponsibility(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'ProjectStartup');
  requireProject(context);
}

export function guardProjectOnly(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireProject(context);
}

export function createOperationsBatchBRoutes(rootRoute: unknown) {
  const responsibilityRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/responsibility',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardResponsibility(context),
    component: ResponsibilityMatrices,
  });

  const responsibilityOwnerContractRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/responsibility/owner-contract',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardResponsibility(context),
    component: ResponsibilityMatrices,
  });

  const responsibilitySubContractRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/responsibility/sub-contract',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardResponsibility(context),
    component: ResponsibilityMatrices,
  });

  const projectRecordRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/project-record',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: ProjectRecord,
  });

  const lessonsLearnedRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/lessons-learned',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: LessonsLearnedPage,
  });

  const readiCheckRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/readicheck',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: () => <ComingSoonPage title="ReadiCheck" />,
  });

  const bestPracticesRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/best-practices',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: () => <ComingSoonPage title="Best Practices" />,
  });

  const subScorecardRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/sub-scorecard',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: () => <ComingSoonPage title="Sub Scorecard" />,
  });

  const goNoGoRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/gonogo',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: GoNoGoScorecard,
  });

  return [
    responsibilityRoute,
    responsibilityOwnerContractRoute,
    responsibilitySubContractRoute,
    projectRecordRoute,
    lessonsLearnedRoute,
    readiCheckRoute,
    bestPracticesRoute,
    subScorecardRoute,
    goNoGoRoute,
  ] as unknown[];
}
