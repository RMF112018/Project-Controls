import * as React from 'react';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requireProject } from './guards/requireProject';
import { ComingSoonPage } from '../../components/shared/ComingSoonPage';

const ResponsibilityMatrices = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ResponsibilityMatrices'
);
const ProjectRecord = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ProjectRecord'
);
const LessonsLearnedPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'LessonsLearnedPage'
);
const GoNoGoScorecard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../features/adminHub/AdminHubModule'),
  'GoNoGoScorecard'
);

export function guardResponsibility(context: ITanStackRouteContext): void {
  requireFeature(context, 'ProjectStartup');
  requireProject(context);
}

export function guardProjectOnly(context: ITanStackRouteContext): void {
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
