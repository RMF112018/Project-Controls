import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { requireProject } from './guards/requireProject';
import { buyoutEntriesOptions } from '../query/queryOptions/buyout';
const ProjectSettingsPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ProjectSettingsPage'
);
const ProjectStartupChecklist = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ProjectStartupChecklist'
);
const ProjectManagementPlan = lazyRouteComponent(
  () => import(/* webpackChunkName: "page-pmp-16-section" */ '../../components/pages/project/pmp/ProjectManagementPlan'),
  'ProjectManagementPlan'
);
const SuperintendentPlanPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'SuperintendentPlanPage'
);
const CloseoutChecklist = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'CloseoutChecklist'
);
const BuyoutLogPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'BuyoutLogPage'
);
const ContractTracking = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ContractTracking'
);
const RiskCostManagement = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'RiskCostManagement'
);
const SchedulePage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'SchedulePage'
);
const QualityConcernsTracker = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'QualityConcernsTracker'
);
const SafetyConcernsTracker = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'SafetyConcernsTracker'
);
const MonthlyProjectReview = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'MonthlyProjectReview'
);
const ConstraintsLogPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'ConstraintsLogPage'
);
const PermitsLogPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../features/operations/OperationsModule'),
  'PermitsLogPage'
);

export function guardProjectSettings(context: ITanStackRouteContext): void {
  requireFeature(context, 'ContractTracking');
}

export function guardProjectSettingsWithId(context: ITanStackRouteContext, projectId?: string): void {
  guardProjectSettings(context);
  requireProject(projectId);
}

export function guardStartupChecklist(context: ITanStackRouteContext): void {
  requireFeature(context, 'ProjectStartup');
}

export function guardStartupChecklistWithId(context: ITanStackRouteContext, projectId?: string): void {
  guardStartupChecklist(context);
  requireProject(projectId);
}

export function guardManagementPlan(context: ITanStackRouteContext): void {
  requireFeature(context, 'ProjectManagementPlan');
  requirePermission(context, PERMISSIONS.PMP_EDIT);
}

export function guardManagementPlanWithId(context: ITanStackRouteContext, projectId?: string): void {
  guardManagementPlan(context);
  requireProject(projectId);
}

export function guardProjectOnly(projectId?: string): void {
  requireProject(projectId);
}

export function guardBuyoutLog(context: ITanStackRouteContext, projectId?: string): void {
  requireProject(projectId);
  requirePermission(context, PERMISSIONS.BUYOUT_VIEW);
}

export function guardRiskCost(context: ITanStackRouteContext, projectId?: string): void {
  requireProject(projectId);
  requirePermission(context, PERMISSIONS.RISK_EDIT);
}

export function guardSchedule(context: ITanStackRouteContext, projectId?: string): void {
  requireFeature(context, 'ScheduleModule');
  requireProject(projectId);
}

export function guardMonthlyReview(context: ITanStackRouteContext, projectId?: string): void {
  requireFeature(context, 'MonthlyProjectReview');
  requireProject(projectId);
}

export function guardConstraints(context: ITanStackRouteContext, projectId?: string): void {
  requireFeature(context, 'ConstraintsLog');
  requireProject(projectId);
  requirePermission(context, PERMISSIONS.CONSTRAINTS_VIEW);
}

export function guardPermits(context: ITanStackRouteContext, projectId?: string): void {
  requireProject(projectId);
  requirePermission(context, PERMISSIONS.PERMITS_VIEW);
}

export function createOperationsBatchARoutes(rootRoute: unknown) {
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

  const projectSettingsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/project-settings',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardProjectSettingsWithId(context, params.projectId),
    component: ProjectSettingsPage,
  });

  const startupChecklistRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/startup-checklist',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardStartupChecklistWithId(context, params.projectId),
    component: ProjectStartupChecklist,
  });

  const managementPlanRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/management-plan',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardManagementPlanWithId(context, params.projectId),
    component: ProjectManagementPlan,
  });

  const superintendentPlanRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/superintendent-plan',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: SuperintendentPlanPage,
  });

  const closeoutChecklistRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/closeout-checklist',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: CloseoutChecklist,
  });

  const buyoutLogRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/buyout-log',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardBuyoutLog(context, params.projectId),
    loader: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) => {
      if (params.projectId) {
        return context.queryClient.ensureQueryData(
          buyoutEntriesOptions(context.scope, context.dataService, params.projectId)
        );
      }
      return Promise.resolve([]);
    },
    component: BuyoutLogPage,
  });

  const contractTrackingRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/contract-tracking',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: ContractTracking,
  });

  const riskCostRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/risk-cost',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardRiskCost(context, params.projectId),
    component: RiskCostManagement,
  });

  const scheduleRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/schedule',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardSchedule(context, params.projectId),
    component: SchedulePage,
  });

  const qualityConcernsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/quality-concerns',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: QualityConcernsTracker,
  });

  const safetyConcernsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/safety-concerns',
    beforeLoad: ({ params }: { params: { projectId?: string } }) => guardProjectOnly(params.projectId),
    component: SafetyConcernsTracker,
  });

  const monthlyReviewRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/monthly-review',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardMonthlyReview(context, params.projectId),
    component: MonthlyProjectReview,
  });

  const constraintsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/constraints-log',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardConstraints(context, params.projectId),
    component: ConstraintsLogPage,
  });

  const permitsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/$projectId/permits-log',
    beforeLoad: ({ context, params }: { context: ITanStackRouteContext; params: { projectId?: string } }) =>
      guardPermits(context, params.projectId),
    component: PermitsLogPage,
  });

  return [
    projectSettingsRoute,
    startupChecklistRoute,
    managementPlanRoute,
    superintendentPlanRoute,
    closeoutChecklistRoute,
    buyoutLogRoute,
    contractTrackingRoute,
    riskCostRoute,
    scheduleRoute,
    qualityConcernsRoute,
    safetyConcernsRoute,
    monthlyReviewRoute,
    constraintsRoute,
    permitsRoute,
    createLegacyProjectRoute('/operations/project-settings'),
    createLegacyProjectRoute('/operations/startup-checklist'),
    createLegacyProjectRoute('/operations/management-plan'),
    createLegacyProjectRoute('/operations/superintendent-plan'),
    createLegacyProjectRoute('/operations/closeout-checklist'),
    createLegacyProjectRoute('/operations/buyout-log'),
    createLegacyProjectRoute('/operations/contract-tracking'),
    createLegacyProjectRoute('/operations/risk-cost'),
    createLegacyProjectRoute('/operations/schedule'),
    createLegacyProjectRoute('/operations/quality-concerns'),
    createLegacyProjectRoute('/operations/safety-concerns'),
    createLegacyProjectRoute('/operations/monthly-review'),
    createLegacyProjectRoute('/operations/constraints-log'),
    createLegacyProjectRoute('/operations/permits-log'),
  ] as unknown[];
}
