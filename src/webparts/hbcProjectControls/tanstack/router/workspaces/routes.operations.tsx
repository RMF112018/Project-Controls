/**
 * Operations Workspace Routes
 *
 * 6 sidebar groups: Operations Dashboard, Commercial Operations,
 * Operational Excellence, Safety, Quality Control & Warranty, Procore Integration.
 * 46 child routes + 1 layout route = 47 routes total.
 */
import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { PERMISSIONS } from '@hbc/sp-services';
import { requireFeature } from '../guards/requireFeature';
import { requirePermission } from '../guards/requirePermission';
import { requireProject } from '../guards/requireProject';
import type { ITanStackRouteContext } from '../routeContext';

// Layout
const OperationsLayout = React.lazy(() =>
  import('../../../components/layouts/OperationsLayout').then(m => ({ default: m.OperationsLayout }))
);

// ── Dashboards ────────────────────────────────────────────────────────
const OperationsDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/OperationsDashboardPage').then(m => ({ default: m.OperationsDashboardPage }))
);
const CommercialDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/CommercialDashboardPage').then(m => ({ default: m.CommercialDashboardPage }))
);
const LuxuryResidentialPage = React.lazy(() =>
  import('../../../components/pages/operations/LuxuryResidentialPage').then(m => ({ default: m.LuxuryResidentialPage }))
);

// ── Project Hub ───────────────────────────────────────────────────────
const ProjectDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/ProjectDashboardPage').then(m => ({ default: m.ProjectDashboardPage }))
);
const ProjectSettingsPage = React.lazy(() =>
  import('../../../components/pages/operations/ProjectSettingsPage').then(m => ({ default: m.ProjectSettingsPage }))
);
const ProjectManualPage = React.lazy(() =>
  import('../../../components/pages/operations/ProjectManualPage').then(m => ({ default: m.ProjectManualPage }))
);

// ── Project Manual Sub-pages ──────────────────────────────────────────
const PMPPage = React.lazy(() =>
  import('../../../components/pages/operations/PMPPage').then(m => ({ default: m.PMPPage }))
);
const SuperintendentPlanPage = React.lazy(() =>
  import('../../../components/pages/operations/SuperintendentPlanPage').then(m => ({ default: m.SuperintendentPlanPage }))
);
const ResponsibilityMatrixPage = React.lazy(() =>
  import('../../../components/pages/operations/ResponsibilityMatrixPage').then(m => ({ default: m.ResponsibilityMatrixPage }))
);
const StartupCloseoutPage = React.lazy(() =>
  import('../../../components/pages/operations/StartupCloseoutPage').then(m => ({ default: m.StartupCloseoutPage }))
);
const MeetingTemplatesPage = React.lazy(() =>
  import('../../../components/pages/operations/MeetingTemplatesPage').then(m => ({ default: m.MeetingTemplatesPage }))
);
const PayAppProcessPage = React.lazy(() =>
  import('../../../components/pages/operations/PayAppProcessPage').then(m => ({ default: m.PayAppProcessPage }))
);
const SafetyPlanPage = React.lazy(() =>
  import('../../../components/pages/operations/SafetyPlanPage').then(m => ({ default: m.SafetyPlanPage }))
);
const OSHAGuidePage = React.lazy(() =>
  import('../../../components/pages/operations/OSHAGuidePage').then(m => ({ default: m.OSHAGuidePage }))
);
const TropicalWeatherPage = React.lazy(() =>
  import('../../../components/pages/operations/TropicalWeatherPage').then(m => ({ default: m.TropicalWeatherPage }))
);
const CrisisManagementPage = React.lazy(() =>
  import('../../../components/pages/operations/CrisisManagementPage').then(m => ({ default: m.CrisisManagementPage }))
);
const QAQCProgramPage = React.lazy(() =>
  import('../../../components/pages/operations/QAQCProgramPage').then(m => ({ default: m.QAQCProgramPage }))
);
const IDSRequirementsPage = React.lazy(() =>
  import('../../../components/pages/operations/IDSRequirementsPage').then(m => ({ default: m.IDSRequirementsPage }))
);

// ── Cost & Time ───────────────────────────────────────────────────────
const FinancialForecastingPage = React.lazy(() =>
  import('../../../components/pages/operations/FinancialForecastingPage').then(m => ({ default: m.FinancialForecastingPage }))
);
const SchedulePlaceholderPage = React.lazy(() =>
  import('../../../components/pages/operations/SchedulePlaceholderPage').then(m => ({ default: m.SchedulePlaceholderPage }))
);

// ── Logs & Reports ────────────────────────────────────────────────────
const BuyoutLogPage = React.lazy(() =>
  import('../../../components/pages/operations/BuyoutLogPage').then(m => ({ default: m.BuyoutLogPage }))
);
const PermitLogPage = React.lazy(() =>
  import('../../../components/pages/operations/PermitLogPage').then(m => ({ default: m.PermitLogPage }))
);
const ConstraintsLogPage = React.lazy(() =>
  import('../../../components/pages/operations/ConstraintsLogPage').then(m => ({ default: m.ConstraintsLogPage }))
);
const MonthlyReportsPage = React.lazy(() =>
  import('../../../components/pages/operations/MonthlyReportsPage').then(m => ({ default: m.MonthlyReportsPage }))
);
const SubcontractorScorecardPage = React.lazy(() =>
  import('../../../components/pages/operations/SubcontractorScorecardPage').then(m => ({ default: m.SubcontractorScorecardPage }))
);

// ── Documents ─────────────────────────────────────────────────────────
const CommercialDocumentsPage = React.lazy(() =>
  import('../../../components/pages/operations/CommercialDocumentsPage').then(m => ({ default: m.CommercialDocumentsPage }))
);

// ── Operational Excellence ────────────────────────────────────────────
const OpExDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/OpExDashboardPage').then(m => ({ default: m.OpExDashboardPage }))
);
const OnboardingPage = React.lazy(() =>
  import('../../../components/pages/operations/OnboardingPage').then(m => ({ default: m.OnboardingPage }))
);
const OpExTrainingPage = React.lazy(() =>
  import('../../../components/pages/operations/OpExTrainingPage').then(m => ({ default: m.OpExTrainingPage }))
);
const OpExDocumentsPage = React.lazy(() =>
  import('../../../components/pages/operations/OpExDocumentsPage').then(m => ({ default: m.OpExDocumentsPage }))
);

// ── Safety ────────────────────────────────────────────────────────────
const SafetyDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/SafetyDashboardPage').then(m => ({ default: m.SafetyDashboardPage }))
);
const SafetyTrainingPage = React.lazy(() =>
  import('../../../components/pages/operations/SafetyTrainingPage').then(m => ({ default: m.SafetyTrainingPage }))
);
const SafetyScorecardPage = React.lazy(() =>
  import('../../../components/pages/operations/SafetyScorecardPage').then(m => ({ default: m.SafetyScorecardPage }))
);
const SafetyResourcesPage = React.lazy(() =>
  import('../../../components/pages/operations/SafetyResourcesPage').then(m => ({ default: m.SafetyResourcesPage }))
);
const SafetyDocumentsPage = React.lazy(() =>
  import('../../../components/pages/operations/SafetyDocumentsPage').then(m => ({ default: m.SafetyDocumentsPage }))
);

// ── Procore Integration ──────────────────────────────────────────────
const ProcoreDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/ProcoreDashboardPage').then(m => ({ default: m.ProcoreDashboardPage }))
);
const ProcoreRFIsPage = React.lazy(() =>
  import('../../../components/pages/operations/ProcoreRFIsPage').then(m => ({ default: m.ProcoreRFIsPage }))
);
const ProcoreBudgetPage = React.lazy(() =>
  import('../../../components/pages/operations/ProcoreBudgetPage').then(m => ({ default: m.ProcoreBudgetPage }))
);
const ProcoreConflictsPage = React.lazy(() =>
  import('../../../components/pages/operations/ProcoreConflictsPage').then(m => ({ default: m.ProcoreConflictsPage }))
);

// ── Quality Control & Warranty ────────────────────────────────────────
const QCWarrantyDashboardPage = React.lazy(() =>
  import('../../../components/pages/operations/QCWarrantyDashboardPage').then(m => ({ default: m.QCWarrantyDashboardPage }))
);
const BestPracticesPage = React.lazy(() =>
  import('../../../components/pages/operations/BestPracticesPage').then(m => ({ default: m.BestPracticesPage }))
);
const QATrackingPage = React.lazy(() =>
  import('../../../components/pages/operations/QATrackingPage').then(m => ({ default: m.QATrackingPage }))
);
const QCChecklistsPage = React.lazy(() =>
  import('../../../components/pages/operations/QCChecklistsPage').then(m => ({ default: m.QCChecklistsPage }))
);
const WarrantyPage = React.lazy(() =>
  import('../../../components/pages/operations/WarrantyPage').then(m => ({ default: m.WarrantyPage }))
);
const QCDocumentsPage = React.lazy(() =>
  import('../../../components/pages/operations/QCDocumentsPage').then(m => ({ default: m.QCDocumentsPage }))
);

export function createOperationsWorkspaceRoutes(rootRoute: unknown) {
  // Layout route — feature-gated
  const opsLayout = createRoute({
    getParentRoute: () => rootRoute as never,
    id: 'operations-layout',
    component: OperationsLayout,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'OperationsWorkspace');
    },
  });

  // ── Operations Dashboard ──────────────────────────────────────────
  const opsDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations',
    component: OperationsDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  // ── Commercial Operations ─────────────────────────────────────────
  const commercialDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/commercial',
    component: CommercialDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  const luxuryResidential = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/commercial/luxury',
    component: LuxuryResidentialPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  // ── Project Hub (requireProject) ──────────────────────────────────
  const projectDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/dashboard',
    component: ProjectDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const projectSettings = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/settings',
    component: ProjectSettingsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_RECORD_OPS_EDIT);
      requireProject(context);
    },
  });

  const projectManual = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual',
    component: ProjectManualPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  // ── Project Manual Sub-pages ──────────────────────────────────────
  const manualPMP = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/pmp',
    component: PMPPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PMP_EDIT);
      requireProject(context);
    },
  });

  const manualSuperintendent = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/superintendent',
    component: SuperintendentPlanPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SUPERINTENDENT_PLAN_EDIT);
      requireProject(context);
    },
  });

  const manualResponsibility = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/responsibility',
    component: ResponsibilityMatrixPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MATRIX_EDIT);
      requireProject(context);
    },
  });

  const manualStartup = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/startup',
    component: StartupCloseoutPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.STARTUP_CHECKLIST_EDIT);
      requireProject(context);
    },
  });

  const manualMeetings = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/meetings',
    component: MeetingTemplatesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MEETING_READ);
      requireProject(context);
    },
  });

  const manualPayApp = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/pay-app',
    component: PayAppProcessPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const manualSafetyPlan = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/safety-plan',
    component: SafetyPlanPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
      requireProject(context);
    },
  });

  const manualOSHA = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/osha',
    component: OSHAGuidePage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const manualWeather = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/weather',
    component: TropicalWeatherPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const manualCrisis = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/crisis',
    component: CrisisManagementPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  const manualQAQC = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/qaqc',
    component: QAQCProgramPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
      requireProject(context);
    },
  });

  const manualIDS = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/project/manual/ids',
    component: IDSRequirementsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  // ── Cost & Time (requireProject) ──────────────────────────────────
  const costForecasting = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/cost-time/forecasting',
    component: FinancialForecastingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.RISK_EDIT);
      requireProject(context);
    },
  });

  const costSchedule = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/cost-time/schedule',
    component: SchedulePlaceholderPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SCHEDULE_VIEW);
      requireProject(context);
    },
  });

  // ── Logs & Reports (requireProject) ───────────────────────────────
  const logsBuyout = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/buyout',
    component: BuyoutLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.BUYOUT_VIEW);
      requireProject(context);
    },
  });

  const logsPermits = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/permits',
    component: PermitLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PERMITS_VIEW);
      requireProject(context);
    },
  });

  const logsConstraints = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/constraints',
    component: ConstraintsLogPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.CONSTRAINTS_VIEW);
      requireProject(context);
    },
  });

  const logsMonthly = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/monthly-reports',
    component: MonthlyReportsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.MONTHLY_REVIEW_PM);
      requireProject(context);
    },
  });

  const logsSubScorecard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/logs/sub-scorecard',
    component: SubcontractorScorecardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
      requireProject(context);
    },
  });

  // ── Documents ─────────────────────────────────────────────────────
  const commercialDocuments = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/commercial/documents',
    component: CommercialDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  // ── Operational Excellence ────────────────────────────────────────
  const opexDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/opex',
    component: OpExDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  const opexOnboarding = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/opex/onboarding',
    component: OnboardingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  const opexTraining = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/opex/training',
    component: OpExTrainingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  const opexDocuments = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/opex/documents',
    component: OpExDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.PROJECT_HUB_VIEW);
    },
  });

  // ── Safety ────────────────────────────────────────────────────────
  const safetyDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/safety',
    component: SafetyDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyTraining = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/safety/training',
    component: SafetyTrainingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyScorecard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/safety/scorecard',
    component: SafetyScorecardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyResources = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/safety/resources',
    component: SafetyResourcesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  const safetyDocuments = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/safety/documents',
    component: SafetyDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.SAFETY_EDIT);
    },
  });

  // ── Quality Control & Warranty ────────────────────────────────────
  const qcDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/qc',
    component: QCWarrantyDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcBestPractices = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/qc/best-practices',
    component: BestPracticesPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcTracking = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/qc/tracking',
    component: QATrackingPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcChecklists = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/qc/checklists',
    component: QCChecklistsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcWarranty = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/qc/warranty',
    component: WarrantyPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  const qcDocuments = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/qc/documents',
    component: QCDocumentsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requirePermission(context, PERMISSIONS.QUALITY_EDIT);
    },
  });

  // ── Procore Integration ──────────────────────────────────────────
  const procoreDashboard = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/procore',
    component: ProcoreDashboardPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'ProcoreIntegration');
      requirePermission(context, PERMISSIONS.PROCORE_VIEW);
    },
  });

  const procoreRfis = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/procore/rfis',
    component: ProcoreRFIsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'ProcoreIntegration');
      requirePermission(context, PERMISSIONS.PROCORE_VIEW);
    },
  });

  const procoreBudget = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/procore/budget',
    component: ProcoreBudgetPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'ProcoreIntegration');
      requirePermission(context, PERMISSIONS.PROCORE_VIEW);
    },
  });

  const procoreConflicts = createRoute({
    getParentRoute: () => opsLayout as never,
    path: '/operations/procore/conflicts',
    component: ProcoreConflictsPage,
    beforeLoad: ({ context }: { context: ITanStackRouteContext }) => {
      requireFeature(context, 'ProcoreIntegration');
      requirePermission(context, PERMISSIONS.CONNECTOR_MANAGE);
    },
  });

  return [
    opsLayout.addChildren([
      opsDashboard,
      // Commercial Operations
      commercialDashboard,
      luxuryResidential,
      // Project Hub
      projectDashboard,
      projectSettings,
      projectManual,
      // Project Manual Sub-pages
      manualPMP,
      manualSuperintendent,
      manualResponsibility,
      manualStartup,
      manualMeetings,
      manualPayApp,
      manualSafetyPlan,
      manualOSHA,
      manualWeather,
      manualCrisis,
      manualQAQC,
      manualIDS,
      // Cost & Time
      costForecasting,
      costSchedule,
      // Logs & Reports
      logsBuyout,
      logsPermits,
      logsConstraints,
      logsMonthly,
      logsSubScorecard,
      // Documents
      commercialDocuments,
      // Operational Excellence
      opexDashboard,
      opexOnboarding,
      opexTraining,
      opexDocuments,
      // Safety
      safetyDashboard,
      safetyTraining,
      safetyScorecard,
      safetyResources,
      safetyDocuments,
      // Quality Control & Warranty
      qcDashboard,
      qcBestPractices,
      qcTracking,
      qcChecklists,
      qcWarranty,
      qcDocuments,
      // Procore Integration
      procoreDashboard,
      procoreRfis,
      procoreBudget,
      procoreConflicts,
    ] as never),
  ] as unknown[];
}
