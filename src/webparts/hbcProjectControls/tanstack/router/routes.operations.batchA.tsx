import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import type { ITanStackRouteContext } from './routeContext';
import { requireFeature } from './guards/requireFeature';
import { requirePermission } from './guards/requirePermission';
import { requireProject } from './guards/requireProject';
import { TANSTACK_ROUTER_PILOT_FLAG } from './constants';
import { buyoutEntriesOptions } from '../query/queryOptions/buyout';
import { ProjectSettingsPage } from '../../components/pages/project/ProjectSettingsPage';
import { ProjectStartupChecklist } from '../../components/pages/project/ProjectStartupChecklist';
import { ProjectManagementPlan } from '../../components/pages/project/pmp/ProjectManagementPlan';
import { SuperintendentPlanPage } from '../../components/pages/project/SuperintendentPlanPage';
import { CloseoutChecklist } from '../../components/pages/project/CloseoutChecklist';
import { BuyoutLogPage } from '../../components/pages/project/BuyoutLogPage';
import { ContractTracking } from '../../components/pages/project/ContractTracking';
import { RiskCostManagement } from '../../components/pages/project/RiskCostManagement';
import { SchedulePage } from '../../components/pages/project/SchedulePage';
import { QualityConcernsTracker } from '../../components/pages/project/QualityConcernsTracker';
import { SafetyConcernsTracker } from '../../components/pages/project/SafetyConcernsTracker';
import { MonthlyProjectReview } from '../../components/pages/project/MonthlyProjectReview';
import { ConstraintsLogPage } from '../../components/pages/project/ConstraintsLogPage';
import { PermitsLogPage } from '../../components/pages/project/PermitsLogPage';

function requirePilot(context: ITanStackRouteContext): void {
  requireFeature(context, TANSTACK_ROUTER_PILOT_FLAG);
}

export function guardProjectSettings(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'ContractTracking');
  requireProject(context);
}

export function guardStartupChecklist(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'ProjectStartup');
  requireProject(context);
}

export function guardManagementPlan(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'ProjectManagementPlan');
  requireProject(context);
  requirePermission(context, PERMISSIONS.PMP_EDIT);
}

export function guardProjectOnly(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireProject(context);
}

export function guardBuyoutLog(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireProject(context);
  requirePermission(context, PERMISSIONS.BUYOUT_VIEW);
}

export function guardRiskCost(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireProject(context);
  requirePermission(context, PERMISSIONS.RISK_EDIT);
}

export function guardSchedule(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'ScheduleModule');
  requireProject(context);
}

export function guardMonthlyReview(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'MonthlyProjectReview');
  requireProject(context);
}

export function guardConstraints(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireFeature(context, 'ConstraintsLog');
  requireProject(context);
  requirePermission(context, PERMISSIONS.CONSTRAINTS_VIEW);
}

export function guardPermits(context: ITanStackRouteContext): void {
  requirePilot(context);
  requireProject(context);
  requirePermission(context, PERMISSIONS.PERMITS_VIEW);
}

export function createOperationsBatchARoutes(rootRoute: unknown) {
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
    component: RiskCostManagement,
  });

  const scheduleRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/schedule',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardSchedule(context),
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
    component: MonthlyProjectReview,
  });

  const constraintsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/constraints',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardConstraints(context),
    component: ConstraintsLogPage,
  });

  const permitsRoute = createRoute({
    getParentRoute: () => rootRoute as never,
    path: '/operations/permits',
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => guardPermits(context),
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
  ] as unknown[];
}
