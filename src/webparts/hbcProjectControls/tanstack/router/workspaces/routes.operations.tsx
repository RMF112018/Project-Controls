/**
 * Operations Workspace Routes
 *
 * Consolidates all /operations/* routes from the former batchA, batchB, and base route files.
 * 26 routes total — flat children of rootRoute (no nested layout routes).
 */
import * as React from 'react';
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../routeContext';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireProject } from '../guards/requireProject';
import { activeProjectsListOptions } from '../../query/queryOptions/activeProjects';
import { complianceSummaryOptions } from '../../query/queryOptions/compliance';
import { buyoutEntriesOptions } from '../../query/queryOptions/buyout';
import { projectScheduleOptions } from '../../query/queryOptions/schedule';
import { riskCostManagementOptions } from '../../query/queryOptions/riskCost';
import { monthlyReviewsOptions } from '../../query/queryOptions/monthlyReview';
import { ComingSoonPage } from '../../../components/shared/ComingSoonPage';

// --- Lazy components (operations chunk) ---
const ActiveProjectsDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ActiveProjectsDashboard'
);
const ProjectDashboard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ProjectDashboard'
);
const ComplianceLog = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ComplianceLog'
);
const ProjectSettingsPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ProjectSettingsPage'
);
const ProjectStartupChecklist = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ProjectStartupChecklist'
);
const ProjectManagementPlan = lazyRouteComponent(
  () => import(/* webpackChunkName: "page-pmp-16-section" */ '../../../components/pages/project/pmp/ProjectManagementPlan'),
  'ProjectManagementPlan'
);
const SuperintendentPlanPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'SuperintendentPlanPage'
);
const CloseoutChecklist = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'CloseoutChecklist'
);
const ContractTracking = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ContractTracking'
);
const RiskCostManagement = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'RiskCostManagement'
);
const QualityConcernsTracker = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'QualityConcernsTracker'
);
const SafetyConcernsTracker = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'SafetyConcernsTracker'
);
const BuyoutLogPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'BuyoutLogPage'
);
const SchedulePage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'SchedulePage'
);
const MonthlyProjectReview = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'MonthlyProjectReview'
);
const ConstraintsLogPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ConstraintsLogPage'
);
const PermitsLogPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'PermitsLogPage'
);
const ResponsibilityMatrices = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ResponsibilityMatrices'
);
const ProjectRecord = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'ProjectRecord'
);
const LessonsLearnedPage = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-operations" */ '../../../features/operations/OperationsModule'),
  'LessonsLearnedPage'
);
const GoNoGoScorecard = lazyRouteComponent(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule'),
  'GoNoGoScorecard'
);

// --- Guards ---
export function guardProjectSettings(context: ITanStackRouteContext): void {
  requireFeature(context, 'ContractTracking');
  requireProject(context);
}

export function guardStartupChecklist(context: ITanStackRouteContext): void {
  requireFeature(context, 'ProjectStartup');
  requireProject(context);
}

export function guardManagementPlan(context: ITanStackRouteContext): void {
  requireFeature(context, 'ProjectManagementPlan');
  requireProject(context);
  requirePermission(context, PERMISSIONS.PMP_EDIT);
}

export function guardProjectOnly(context: ITanStackRouteContext): void {
  requireProject(context);
}

export function guardBuyoutLog(context: ITanStackRouteContext): void {
  requireProject(context);
  requirePermission(context, PERMISSIONS.BUYOUT_VIEW);
}

export function guardRiskCost(context: ITanStackRouteContext): void {
  requireProject(context);
  requirePermission(context, PERMISSIONS.RISK_EDIT);
}

export function guardSchedule(context: ITanStackRouteContext): void {
  requireFeature(context, 'ScheduleModule');
  requireProject(context);
}

export function guardMonthlyReview(context: ITanStackRouteContext): void {
  requireFeature(context, 'MonthlyProjectReview');
  requireProject(context);
}

export function guardConstraints(context: ITanStackRouteContext): void {
  requireFeature(context, 'ConstraintsLog');
  requireProject(context);
  requirePermission(context, PERMISSIONS.CONSTRAINTS_VIEW);
}

export function guardPermits(context: ITanStackRouteContext): void {
  requireProject(context);
  requirePermission(context, PERMISSIONS.PERMITS_VIEW);
}

export function guardResponsibility(context: ITanStackRouteContext): void {
  requireFeature(context, 'ProjectStartup');
  requireProject(context);
}

export function createOperationsWorkspaceRoutes(rootRoute: unknown) {
  // --- Hub-level operations routes (from base) ---
  const operationsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.ACTIVE_PROJECTS_VIEW);
    },
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      import(/* webpackChunkName: "page-schedule" */ '../../../components/pages/project/SchedulePage').catch(() => {});
      import(/* webpackChunkName: "page-buyout-contract" */ '../../../components/pages/project/BuyoutLogPage').catch(() => {});
      import(/* webpackChunkName: "phase-preconstruction" */ '../../../features/preconstruction/PreconstructionModule').catch(() => {});
      import(/* webpackChunkName: "page-estimating-tracker" */ '../../../components/pages/precon/EstimatingDashboard').catch(() => {});
      import(/* webpackChunkName: "page-gonogo" */ '../../../components/pages/hub/GoNoGoScorecard').catch(() => {});
      import(/* webpackChunkName: "phase-admin-hub" */ '../../../features/adminHub/AdminHubModule').catch(() => {});
      import(/* webpackChunkName: "page-pmp-16-section" */ '../../../components/pages/project/pmp/ProjectManagementPlan').catch(() => {});
      import(/* webpackChunkName: "page-monthly-review" */ '../../../components/pages/project/MonthlyProjectReview').catch(() => {});
      return context.queryClient.ensureQueryData(
        activeProjectsListOptions(context.scope, context.dataService, {})
      );
    },
    component: ActiveProjectsDashboard,
  });

  const operationsProjectRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/project',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireProject(context);
    },
    component: ProjectDashboard,
  });

  const operationsComplianceLogRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/compliance-log',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.COMPLIANCE_LOG_VIEW);
    },
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      return context.queryClient.ensureQueryData(
        complianceSummaryOptions(context.scope, context.dataService)
      );
    },
    component: ComplianceLog,
  });

  // --- Former batchA routes ---
  const projectSettingsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/project-settings',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectSettings(context),
    component: ProjectSettingsPage,
  });

  const startupChecklistRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/startup-checklist',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardStartupChecklist(context),
    component: ProjectStartupChecklist,
  });

  const managementPlanRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/management-plan',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardManagementPlan(context),
    component: ProjectManagementPlan,
  });

  const superintendentPlanRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/superintendent-plan',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: SuperintendentPlanPage,
  });

  const closeoutChecklistRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/closeout-checklist',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: CloseoutChecklist,
  });

  const buyoutLogRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/buyout-log',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardBuyoutLog(context),
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      const projectCode = context.selectedProject?.projectCode;
      if (projectCode) {
        return context.queryClient.ensureQueryData(
          buyoutEntriesOptions(context.scope, context.dataService, projectCode)
        );
      }
      return Promise.resolve([]);
    },
    component: BuyoutLogPage,
  });

  const contractTrackingRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/contract-tracking',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: ContractTracking,
  });

  const riskCostRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/risk-cost',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardRiskCost(context),
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      const projectCode = context.selectedProject?.projectCode;
      if (projectCode) {
        return context.queryClient.ensureQueryData(
          riskCostManagementOptions(context.scope, context.dataService, projectCode)
        );
      }
      return Promise.resolve(null);
    },
    component: RiskCostManagement,
  });

  const scheduleRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/schedule',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardSchedule(context),
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      const projectCode = context.selectedProject?.projectCode;
      if (projectCode) {
        return context.queryClient.ensureQueryData(
          projectScheduleOptions(context.scope, context.dataService, projectCode)
        );
      }
      return Promise.resolve(null);
    },
    component: SchedulePage,
  });

  const qualityConcernsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/quality-concerns',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: QualityConcernsTracker,
  });

  const safetyConcernsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/safety-concerns',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardProjectOnly(context),
    component: SafetyConcernsTracker,
  });

  const monthlyReviewRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/monthly-review',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardMonthlyReview(context),
    loader: ({ context }: { context: ITanStackRouteContext }) => {
      const projectCode = context.selectedProject?.projectCode;
      if (projectCode) {
        return context.queryClient.ensureQueryData(
          monthlyReviewsOptions(context.scope, context.dataService, projectCode)
        );
      }
      return Promise.resolve([]);
    },
    component: MonthlyProjectReview,
  });

  const constraintsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/constraints-log',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardConstraints(context),
    component: ConstraintsLogPage,
  });

  const permitsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/permits-log',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPermits(context),
    component: PermitsLogPage,
  });

  // --- Former batchB routes ---
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
    operationsRoute,
    operationsProjectRoute,
    operationsComplianceLogRoute,
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
