/**
 * Project Hub Workspace Routes
 *
 * Cross-cutting project-scoped module: Preconstruction, Project Manual,
 * Cost & Time, Logs & Reports, Documents.
 * 36 child routes + 1 layout route = 37 routes total.
 *
 * Phase 1 Task 2: Estimating routes upgraded with domain-specific permissions
 * (KICKOFF_VIEW, AUTOPSY_VIEW), data prefetch via ensureQueryData, and
 * per-route pendingComponent for form-oriented skeleton loading.
 */
import * as React from 'react';
import { createRoute, redirect } from '@tanstack/react-router';
import { PERMISSIONS, Stage, type ISelectedProject } from '@hbc/sp-services';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireProject } from '../guards/requireProject';
import type { ITanStackRouteContext } from '../routeContext';
import { RouteErrorBoundary } from '../../../components/boundaries/RouteErrorBoundary';
import { kickoffByProjectOptions } from '../../query/queryOptions/kickoffQueryOptions';
import { postBidAutopsyByProjectOptions } from '../../query/queryOptions/postBidAutopsyQueryOptions';
import { EstimatingRoutePendingFallback } from '../../../components/boundaries/EstimatingRoutePendingFallback';

// Layout
const ProjectHubLayout = React.lazy(() =>
  import('../../../components/layouts/ProjectHubLayout').then(m => ({ default: m.ProjectHubLayout }))
);

// ── Dashboard & Settings ─────────────────────────────────────────────
const ProjectHubDashboardPage = React.lazy(() =>
  import('../../../components/pages/project-hub/ProjectHubDashboardPage').then(m => ({ default: m.ProjectHubDashboardPage }))
);
const ProjectHubSettingsPage = React.lazy(() =>
  import('../../../components/pages/project-hub/ProjectHubSettingsPage').then(m => ({ default: m.ProjectHubSettingsPage }))
);

// ── Preconstruction ──────────────────────────────────────────────────
const PHGoNoGoPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHGoNoGoPage').then(m => ({ default: m.PHGoNoGoPage }))
);
const GoNoGoScorecardDetail = React.lazy(() =>
  import('../../../components/pages/hub/GoNoGoScorecardDetail').then(m => ({ default: m.GoNoGoScorecardDetail }))
);
// Stage 9: Replaced PHEstimatingKickOffPage (static checklist) with full Stage 8 EstimatingKickoffPage.
const EstimatingKickoffPage = React.lazy(() =>
  import('../../../components/pages/precon/EstimatingKickoffPage').then(m => ({ default: m.EstimatingKickoffPage }))
);
const PHEstimatePage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHEstimatePage').then(m => ({ default: m.PHEstimatePage }))
);
const PHProjectTurnoverPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHProjectTurnoverPage').then(m => ({ default: m.PHProjectTurnoverPage }))
);
// Stage 21: Replaced PHPostBidAutopsyPage (mock dashboard) with full PostBidAutopsyPage.
const PostBidAutopsyPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PostBidAutopsyPage').then(m => ({ default: m.PostBidAutopsyPage }))
);

// ── Project Manual ───────────────────────────────────────────────────
const PHPMPPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHPMPPage').then(m => ({ default: m.PHPMPPage }))
);
const PHSuperintendentPlanPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHSuperintendentPlanPage').then(m => ({ default: m.PHSuperintendentPlanPage }))
);
const PHResponsibilityMatrixPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHResponsibilityMatrixPage').then(m => ({ default: m.PHResponsibilityMatrixPage }))
);
const PHMeetingTemplatesPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHMeetingTemplatesPage').then(m => ({ default: m.PHMeetingTemplatesPage }))
);
const PHPayAppProcessPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHPayAppProcessPage').then(m => ({ default: m.PHPayAppProcessPage }))
);
const PHSafetyPlanPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHSafetyPlanPage').then(m => ({ default: m.PHSafetyPlanPage }))
);
const PHOSHAGuidePage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHOSHAGuidePage').then(m => ({ default: m.PHOSHAGuidePage }))
);
const PHTropicalWeatherPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHTropicalWeatherPage').then(m => ({ default: m.PHTropicalWeatherPage }))
);
const PHCrisisManagementPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHCrisisManagementPage').then(m => ({ default: m.PHCrisisManagementPage }))
);
const PHIDSRequirementsPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHIDSRequirementsPage').then(m => ({ default: m.PHIDSRequirementsPage }))
);

// ── Project Manual > Startup & Closeout ──────────────────────────────
const PHStartupGuidePage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHStartupGuidePage').then(m => ({ default: m.PHStartupGuidePage }))
);
const PHStartupChecklistPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHStartupChecklistPage').then(m => ({ default: m.PHStartupChecklistPage }))
);
const PHCloseoutGuidePage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHCloseoutGuidePage').then(m => ({ default: m.PHCloseoutGuidePage }))
);
const PHCompletionAcceptancePage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHCompletionAcceptancePage').then(m => ({ default: m.PHCompletionAcceptancePage }))
);
const PHCloseoutChecklistPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHCloseoutChecklistPage').then(m => ({ default: m.PHCloseoutChecklistPage }))
);

// ── Project Manual > QA/QC ───────────────────────────────────────────
const PHQCChecklistsPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHQCChecklistsPage').then(m => ({ default: m.PHQCChecklistsPage }))
);
const PHBestPracticesPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHBestPracticesPage').then(m => ({ default: m.PHBestPracticesPage }))
);

// ── Cost & Time ──────────────────────────────────────────────────────
const PHForecastChecklistPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHForecastChecklistPage').then(m => ({ default: m.PHForecastChecklistPage }))
);
const PHForecastSummaryPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHForecastSummaryPage').then(m => ({ default: m.PHForecastSummaryPage }))
);
const PHGCGRForecastPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHGCGRForecastPage').then(m => ({ default: m.PHGCGRForecastPage }))
);
const PHCashFlowForecastPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHCashFlowForecastPage').then(m => ({ default: m.PHCashFlowForecastPage }))
);
const PHSchedulePage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHSchedulePage').then(m => ({ default: m.PHSchedulePage }))
);

// ── Logs & Reports ───────────────────────────────────────────────────
const PHBuyoutLogPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHBuyoutLogPage').then(m => ({ default: m.PHBuyoutLogPage }))
);
const PHPermitLogPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHPermitLogPage').then(m => ({ default: m.PHPermitLogPage }))
);
const PHConstraintsLogPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHConstraintsLogPage').then(m => ({ default: m.PHConstraintsLogPage }))
);
const PHSubScorecardPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHSubScorecardPage').then(m => ({ default: m.PHSubScorecardPage }))
);
const PHPXReviewPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHPXReviewPage').then(m => ({ default: m.PHPXReviewPage }))
);
const PHOwnerReportPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHOwnerReportPage').then(m => ({ default: m.PHOwnerReportPage }))
);

// ── Documents ────────────────────────────────────────────────────────
const PHDocumentsPage = React.lazy(() =>
  import('../../../components/pages/project-hub/PHDocumentsPage').then(m => ({ default: m.PHDocumentsPage }))
);

export function createProjectHubWorkspaceRoutes(rootRoute: unknown) {
  // Layout route — feature-gated + project-required
  const phLayout = createRoute({
    getParentRoute: () => rootRoute as never,
    id: 'project-hub-layout',
    component: ProjectHubLayout,
    // Stage 20 + HBC-PC-PID-001: Accept pid (canonical), projectCode, projectUuid (backward compat),
    // leadId at layout level so all 36 child routes inherit search-param awareness.
    validateSearch: (search: Record<string, unknown>) => ({
      projectCode: (search.projectCode as string) || undefined,
      pid: (search.pid as string) || undefined,                 // HBC-PC-PID-001
      projectUuid: (search.projectUuid as string) || undefined, // backward compat
      leadId: search.leadId ? Number(search.leadId) : undefined,
    }),
    beforeLoad: ({ context, search }: {
      context: ITanStackRouteContext;
      search: { projectCode?: string; pid?: string; projectUuid?: string; leadId?: number };
    }): { selectedProject: ISelectedProject } | void => {
      requireFeature(context, 'ProjectHubWorkspace');
      // HBC-PC-PID-001: pid OR legacy projectUuid as effective identifier
      const effectivePidOrUuid = search.pid || search.projectUuid;
      // Stage 20 + HBC-PC-PID-001: If no selectedProject in context but search params
      // have projectCode OR pid/projectUuid, return a minimal ISelectedProject as context
      // extension for child routes. TanStack Router v1 merges returned objects into the
      // route context seen by child beforeLoad functions, so requireProject() guards pass.
      if (!context.selectedProject?.projectCode && !context.selectedProject?.projectUuid) {
        if (search.projectCode || effectivePidOrUuid) {
          return {
            selectedProject: {
              projectCode: search.projectCode ?? '',
              projectUuid: effectivePidOrUuid,
              projectName: '',
              stage: Stage.Pursuit,
              leadId: search.leadId,
            } satisfies ISelectedProject,
          };
        }
      }
    },
  });

  // ── Dashboard & Settings ─────────────────────────────────────────
  const phDashboard = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/dashboard',
    component: ProjectHubDashboardPage,
    // Stage 19: Accept ?handoffFrom=turnover and ?projectCode search params
    validateSearch: (search: Record<string, unknown>) => ({
      handoffFrom: (search.handoffFrom as string) || undefined,
      projectCode: (search.projectCode as string) || undefined,
    }),
    beforeLoad: ({ context, search }: { context: ITanStackRouteContext; search: { projectCode?: string; pid?: string; projectUuid?: string } }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      // Stage 19 routing fix + HBC-PC-PID-001: Accept pid/projectCode from search params.
      if (!context.selectedProject?.projectCode && !context.selectedProject?.projectUuid && !search.projectCode && !search.pid && !search.projectUuid) {
        throw redirect({ to: '/', replace: true });
      }
    },
  });

  const phSettings = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/settings',
    component: ProjectHubSettingsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_RECORD_OPS_EDIT);
      requireProject(context);
    },
  });

  // ── Preconstruction ──────────────────────────────────────────────
  const phGoNoGo = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/precon/go-no-go',
    component: PHGoNoGoPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.GONOGO_READ);
      requireProject(context);
    },
  });

  const phGoNoGoDetail = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/precon/go-no-go/$leadId',
    component: GoNoGoScorecardDetail,
    errorComponent: RouteErrorBoundary,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.GONOGO_READ);
      requireProject(context);
    },
  });

  const phEstKickoff = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/precon/estimating-kickoff',
    component: EstimatingKickoffPage,
    pendingComponent: EstimatingRoutePendingFallback,
    // Stage 9: Accept ?projectCode and ?leadId from DepartmentTrackingPage Kickoff context menu.
    // leadId supports future kickoff initialization via createEstimatingKickoff(projectCode, leadId).
    validateSearch: (search: Record<string, unknown>) => ({
      projectCode: (search.projectCode as string) || undefined,
      leadId: search.leadId ? Number(search.leadId) : undefined,
    }),
    beforeLoad: ({ context, search }: { context: ITanStackRouteContext; search: { projectCode?: string; pid?: string; projectUuid?: string } }) => {
      // Authorization: KICKOFF_VIEW enforced at loader level (permissions-engine-spec.md).
      // Covers Estimator, Preconstruction Manager, Administrator, and Leadership roles.
      requirePermission(context, PERMISSIONS.KICKOFF_VIEW);
      // Stage 9 routing fix + HBC-PC-PID-001: Accept pid/projectCode from search params.
      if (!context.selectedProject?.projectCode && !context.selectedProject?.projectUuid && !search.projectCode && !search.pid && !search.projectUuid) {
        throw redirect({ to: '/', replace: true });
      }
      // Phase 1 Task 2: Prefetch kickoff data during navigation so the component
      // renders with warm cache. ensureQueryData returns cached data if fresh,
      // otherwise fetches in background. Fire-and-forget (void) so navigation
      // is not blocked — the pendingComponent shows if data is not yet ready.
      const projectCode = context.selectedProject?.projectCode ?? search.projectCode ?? '';
      if (projectCode) {
        void context.queryClient.ensureQueryData(
          kickoffByProjectOptions(context.scope, projectCode, context.dataService),
        );
      }
    },
  });

  const phEstimate = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/precon/estimate',
    component: PHEstimatePage,
    pendingComponent: EstimatingRoutePendingFallback,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      // Authorization: ESTIMATING_READ covers the estimate detail view.
      requirePermission(context, PERMISSIONS.ESTIMATING_READ);
      requireProject(context);
    },
  });

  const phTurnover = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/precon/turnover',
    component: PHProjectTurnoverPage,
    // Stage 19: Accept ?projectCode and ?leadId from DepartmentTrackingPage Turnover context menu.
    // leadId supports on-demand agenda initialization via createTurnoverAgenda(projectCode, leadId).
    validateSearch: (search: Record<string, unknown>) => ({
      projectCode: (search.projectCode as string) || undefined,
      leadId: search.leadId ? Number(search.leadId) : undefined,
    }),
    beforeLoad: ({ context, search }: { context: ITanStackRouteContext; search: { projectCode?: string; pid?: string; projectUuid?: string } }) => {
      requirePermission(context, PERMISSIONS.TURNOVER_READ);
      // Stage 19 routing fix + HBC-PC-PID-001: Accept pid/projectCode from search params.
      if (!context.selectedProject?.projectCode && !context.selectedProject?.projectUuid && !search.projectCode && !search.pid && !search.projectUuid) {
        throw redirect({ to: '/', replace: true });
      }
    },
  });

  const phPostBid = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/precon/post-bid',
    component: PostBidAutopsyPage,
    pendingComponent: EstimatingRoutePendingFallback,
    // Phase 1 Task 2: Accept ?projectCode and ?leadId from DepartmentTrackingPage
    // Post-Bid context menu, matching the phEstKickoff / phTurnover pattern.
    validateSearch: (search: Record<string, unknown>) => ({
      projectCode: (search.projectCode as string) || undefined,
      leadId: search.leadId ? Number(search.leadId) : undefined,
    }),
    beforeLoad: ({ context, search }: { context: ITanStackRouteContext; search: { projectCode?: string; pid?: string; projectUuid?: string } }) => {
      // Authorization: AUTOPSY_VIEW is the domain-specific read permission for
      // post-bid autopsies (permissions-engine-spec.md). Previously used the broader
      // ESTIMATING_READ — narrowed for proper 70-permission granularity.
      requirePermission(context, PERMISSIONS.AUTOPSY_VIEW);
      // Phase 1 Task 2 + HBC-PC-PID-001: Accept pid/projectCode from search params.
      if (!context.selectedProject?.projectCode && !context.selectedProject?.projectUuid && !search.projectCode && !search.pid && !search.projectUuid) {
        throw redirect({ to: '/', replace: true });
      }
      // Phase 1 Task 2: Prefetch post-bid autopsy data during navigation.
      // Fire-and-forget so navigation is not blocked.
      const projectCode = context.selectedProject?.projectCode ?? search.projectCode ?? '';
      if (projectCode) {
        void context.queryClient.ensureQueryData(
          postBidAutopsyByProjectOptions(context.scope, projectCode, context.dataService),
        );
      }
    },
  });

  // ── Project Manual ───────────────────────────────────────────────
  const phPMP = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/pmp',
    component: PHPMPPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PMP_EDIT);
      requireProject(context);
    },
  });

  const phSuperintendent = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/superintendent',
    component: PHSuperintendentPlanPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SUPERINTENDENT_PLAN_EDIT);
      requireProject(context);
    },
  });

  const phResponsibility = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/responsibility',
    component: PHResponsibilityMatrixPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MATRIX_EDIT);
      requireProject(context);
    },
  });

  const phMeetings = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/meetings',
    component: PHMeetingTemplatesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MEETING_READ);
      requireProject(context);
    },
  });

  const phPayApp = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/pay-app',
    component: PHPayAppProcessPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const phSafetyPlan = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/safety-plan',
    component: PHSafetyPlanPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
      requireProject(context);
    },
  });

  const phOSHA = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/osha',
    component: PHOSHAGuidePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const phWeather = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/weather',
    component: PHTropicalWeatherPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const phCrisis = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/crisis',
    component: PHCrisisManagementPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const phIDS = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/ids',
    component: PHIDSRequirementsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  // ── Project Manual > Startup & Closeout ──────────────────────────
  const phStartupGuide = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/startup/guide',
    component: PHStartupGuidePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.STARTUP_CHECKLIST_EDIT);
      requireProject(context);
    },
  });

  const phStartupChecklist = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/startup/checklist',
    component: PHStartupChecklistPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.STARTUP_CHECKLIST_EDIT);
      requireProject(context);
    },
  });

  const phCloseoutGuide = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/startup/closeout-guide',
    component: PHCloseoutGuidePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.CLOSEOUT_EDIT);
      requireProject(context);
    },
  });

  const phCompletion = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/startup/completion',
    component: PHCompletionAcceptancePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.CLOSEOUT_EDIT);
      requireProject(context);
    },
  });

  const phCloseoutChecklist = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/startup/closeout-checklist',
    component: PHCloseoutChecklistPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.CLOSEOUT_EDIT);
      requireProject(context);
    },
  });

  // ── Project Manual > QA/QC ───────────────────────────────────────
  const phQCChecklists = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/qaqc/checklists',
    component: PHQCChecklistsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
      requireProject(context);
    },
  });

  const phBestPractices = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/manual/qaqc/best-practices',
    component: PHBestPracticesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
      requireProject(context);
    },
  });

  // ── Cost & Time > Forecast ───────────────────────────────────────
  const phForecastChecklist = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/cost-time/forecast/checklist',
    component: PHForecastChecklistPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_EDIT);
      requireProject(context);
    },
  });

  const phForecastSummary = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/cost-time/forecast/summary',
    component: PHForecastSummaryPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_EDIT);
      requireProject(context);
    },
  });

  const phGCGRForecast = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/cost-time/forecast/gcgr',
    component: PHGCGRForecastPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_EDIT);
      requireProject(context);
    },
  });

  const phCashFlowForecast = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/cost-time/forecast/cashflow',
    component: PHCashFlowForecastPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_EDIT);
      requireProject(context);
    },
  });

  // ── Cost & Time > Schedule ───────────────────────────────────────
  const phSchedule = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/cost-time/schedule',
    component: PHSchedulePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SCHEDULE_VIEW);
      requireProject(context);
    },
  });

  // ── Logs & Reports ───────────────────────────────────────────────
  const phBuyoutLog = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/logs/buyout',
    component: PHBuyoutLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.BUYOUT_VIEW);
      requireProject(context);
    },
  });

  const phPermitLog = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/logs/permits',
    component: PHPermitLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PERMITS_VIEW);
      requireProject(context);
    },
  });

  const phConstraintsLog = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/logs/constraints',
    component: PHConstraintsLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.CONSTRAINTS_VIEW);
      requireProject(context);
    },
  });

  const phSubScorecard = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/logs/sub-scorecard',
    component: PHSubScorecardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const phPXReview = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/logs/monthly/px-review',
    component: PHPXReviewPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MONTHLY_REVIEW_PM);
      requireProject(context);
    },
  });

  const phOwnerReport = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/logs/monthly/owner-report',
    component: PHOwnerReportPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MONTHLY_REVIEW_PM);
      requireProject(context);
    },
  });

  // ── Documents ────────────────────────────────────────────────────
  const phDocuments = createRoute({
    getParentRoute: () => phLayout as never,
    path: '/project-hub/documents',
    component: PHDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  return [
    phLayout.addChildren([
      // Dashboard & Settings
      phDashboard,
      phSettings,
      // Preconstruction
      phGoNoGo,
      phGoNoGoDetail,
      phEstKickoff,
      phEstimate,
      phTurnover,
      phPostBid,
      // Project Manual
      phPMP,
      phSuperintendent,
      phResponsibility,
      phMeetings,
      phPayApp,
      phSafetyPlan,
      phOSHA,
      phWeather,
      phCrisis,
      phIDS,
      // Project Manual > Startup & Closeout
      phStartupGuide,
      phStartupChecklist,
      phCloseoutGuide,
      phCompletion,
      phCloseoutChecklist,
      // Project Manual > QA/QC
      phQCChecklists,
      phBestPractices,
      // Cost & Time > Forecast
      phForecastChecklist,
      phForecastSummary,
      phGCGRForecast,
      phCashFlowForecast,
      // Cost & Time > Schedule
      phSchedule,
      // Logs & Reports
      phBuyoutLog,
      phPermitLog,
      phConstraintsLog,
      phSubScorecard,
      phPXReview,
      phOwnerReport,
      // Documents
      phDocuments,
    ] as never),
  ] as unknown[];
}
