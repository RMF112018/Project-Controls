import * as React from 'react';
import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
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
}

export function guardResponsibilityWithId(context: ITanStackRouteContext, projectId?: string): void {
  guardResponsibility(context);
  requireProject(projectId);
}

export function guardProjectOnly(projectId?: string): void {
  requireProject(projectId);
}

export function createOperationsBatchBRoutes(rootRoute: unknown) {
  const createLegacyProjectRoute = (legacyPath: string) => createRoute({
    getParentRoute: () => rootRoute as never,
    path: legacyPath,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      if (!context.activeProjectCode) {
        throw redirect({ to: '/operations', replace: true });
      }
      throw redirect({
        to: `/operations/${encodeURIComponent(context.activeProjectCode)}${legacyPath.slice('/operations'.length)}`,
        replace: true,
      });
    },
    component: () => null,
  });

  const responsibilityRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/responsibility',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardResponsibilityWithId(context, params.projectId),
    component: ResponsibilityMatrices,
  });

  const responsibilityOwnerContractRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/responsibility/owner-contract',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardResponsibilityWithId(context, params.projectId),
    component: ResponsibilityMatrices,
  });

  const responsibilitySubContractRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/responsibility/sub-contract',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardResponsibilityWithId(context, params.projectId),
    component: ResponsibilityMatrices,
  });

  const projectRecordRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/project-record',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: ProjectRecord,
  });

  const lessonsLearnedRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/lessons-learned',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: LessonsLearnedPage,
  });

  const readiCheckRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/readicheck',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: () => <ComingSoonPage title="ReadiCheck" />,
  });

  const bestPracticesRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/best-practices',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: () => <ComingSoonPage title="Best Practices" />,
  });

  const subScorecardRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/sub-scorecard',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: () => <ComingSoonPage title="Sub Scorecard" />,
  });

  const goNoGoRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/gonogo',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
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
    createLegacyProjectRoute('/operations/responsibility'),
    createLegacyProjectRoute('/operations/responsibility/owner-contract'),
    createLegacyProjectRoute('/operations/responsibility/sub-contract'),
    createLegacyProjectRoute('/operations/project-record'),
    createLegacyProjectRoute('/operations/lessons-learned'),
    createLegacyProjectRoute('/operations/readicheck'),
    createLegacyProjectRoute('/operations/best-practices'),
    createLegacyProjectRoute('/operations/sub-scorecard'),
    createLegacyProjectRoute('/operations/gonogo'),
  ] as unknown[];
}
