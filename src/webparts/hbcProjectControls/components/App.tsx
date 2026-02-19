import * as React from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { hbcLightTheme } from '../theme/hbcTheme';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { HelpProvider } from './contexts/HelpContext';
import { SignalRProvider } from './contexts/SignalRContext';
import { AppShell } from './layouts/AppShell';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/ToastContainer';
import { PhaseSuspenseFallback } from './shared/PhaseSuspenseFallback';
import { OfflineMonitor } from './shared/OfflineMonitor';
import { SwUpdateMonitor } from './shared/SwUpdateMonitor';
import { IDataService, PERMISSIONS } from '@hbc/sp-services';
import type { ITelemetryService } from '@hbc/sp-services';
import { ProtectedRoute, ProjectRequiredRoute, FeatureGate } from './guards';
import { useTelemetryPageView } from '../hooks/useTelemetryPageView';
import { getQueryClient } from '../tanstack/query/queryClient';
import { useQueryScope } from '../tanstack/query/useQueryScope';
import { TanStackAppRouterProvider } from '../tanstack/router/router';
import { TANSTACK_ROUTER_ENABLED_FLAG } from '../tanstack/router/constants';
import { RouterAdapterProvider } from './contexts/RouterAdapterContext';

// ---------------------------------------------------------------------------
// Helper: wrap React.lazy() for named exports
// ---------------------------------------------------------------------------
function lazyNamed<T extends React.ComponentType<Record<string, never>>>(
  factory: () => Promise<{ [key: string]: T }>,
  exportName: string
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().then((mod) => ({ default: mod[exportName] }))
  );
}

// ---------------------------------------------------------------------------
// Lazy page imports — Shared phase chunk
// ---------------------------------------------------------------------------
const DashboardPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-shared" */ '../features/shared/SharedModule'),
  'DashboardPage'
);
const MarketingDashboard = lazyNamed(
  () => import(/* webpackChunkName: "phase-shared" */ '../features/shared/SharedModule'),
  'MarketingDashboard'
);

// ---------------------------------------------------------------------------
// Lazy page imports — Admin/Hub phase chunk
// ---------------------------------------------------------------------------
const LeadFormPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'LeadFormPage'
);
const LeadDetailPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'LeadDetailPage'
);
const GoNoGoScorecard = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'GoNoGoScorecard'
);
const GoNoGoDetail = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'GoNoGoDetail'
);
const GoNoGoMeetingScheduler = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'GoNoGoMeetingScheduler'
);
const JobNumberRequestForm = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'JobNumberRequestForm'
);
const AccountingQueuePage = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'AccountingQueuePage'
);
const AdminPanel = lazyNamed(
  () => import(/* webpackChunkName: "page-admin-panel" */ './pages/hub/AdminPanel'),
  'AdminPanel'
);
const PerformanceDashboard = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'PerformanceDashboard'
);
const ApplicationSupportPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'ApplicationSupportPage'
);
const TelemetryDashboard = lazyNamed(
  () => import(/* webpackChunkName: "phase-admin-hub" */ '../features/adminHub/AdminHubModule'),
  'TelemetryDashboard'
);

// ---------------------------------------------------------------------------
// Lazy page imports — Preconstruction phase chunk
// ---------------------------------------------------------------------------
const PipelinePage = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'PipelinePage'
);
const EstimatingDashboard = lazyNamed(
  () => import(/* webpackChunkName: "page-estimating-tracker" */ './pages/precon/EstimatingDashboard'),
  'EstimatingDashboard'
);
const PursuitDetail = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'PursuitDetail'
);
const EstimatingKickoffList = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'EstimatingKickoffList'
);
const EstimatingKickoffPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'EstimatingKickoffPage'
);
const PostBidAutopsyList = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'PostBidAutopsyList'
);
const PostBidAutopsyForm = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'PostBidAutopsyForm'
);
const InterviewPrep = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'InterviewPrep'
);
const WinLossRecorder = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'WinLossRecorder'
);
const TurnoverToOps = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'TurnoverToOps'
);
const LossAutopsy = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'LossAutopsy'
);
const DeliverablesTracker = lazyNamed(
  () => import(/* webpackChunkName: "phase-preconstruction" */ '../features/preconstruction/PreconstructionModule'),
  'DeliverablesTracker'
);

// ---------------------------------------------------------------------------
// Lazy page imports — Operations phase chunk
// ---------------------------------------------------------------------------
const ActiveProjectsDashboard = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ActiveProjectsDashboard'
);
const ComplianceLog = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ComplianceLog'
);
const ProjectDashboard = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ProjectDashboard'
);
const ProjectSettingsPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ProjectSettingsPage'
);
const ProjectStartupChecklist = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ProjectStartupChecklist'
);
const ProjectManagementPlan = lazyNamed(
  () => import(/* webpackChunkName: "page-pmp-16-section" */ './pages/project/pmp/ProjectManagementPlan'),
  'ProjectManagementPlan'
);
const SuperintendentPlanPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'SuperintendentPlanPage'
);
const ResponsibilityMatrices = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ResponsibilityMatrices'
);
const CloseoutChecklist = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'CloseoutChecklist'
);
const BuyoutLogPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'BuyoutLogPage'
);
const ContractTracking = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ContractTracking'
);
const RiskCostManagement = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'RiskCostManagement'
);
const SchedulePage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'SchedulePage'
);
const QualityConcernsTracker = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'QualityConcernsTracker'
);
const SafetyConcernsTracker = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'SafetyConcernsTracker'
);
const MonthlyProjectReview = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'MonthlyProjectReview'
);
const ProjectRecord = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ProjectRecord'
);
const LessonsLearnedPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'LessonsLearnedPage'
);
const ConstraintsLogPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'ConstraintsLogPage'
);
const PermitsLogPage = lazyNamed(
  () => import(/* webpackChunkName: "phase-operations" */ '../features/operations/OperationsModule'),
  'PermitsLogPage'
);

// ---------------------------------------------------------------------------
// Inline tiny pages — kept in main bundle (no benefit from splitting)
// ---------------------------------------------------------------------------
import { AccessDeniedPage } from './pages/shared/AccessDeniedPage';
import { ComingSoonPage } from './shared/ComingSoonPage';

export interface IAppProps {
  dataService: IDataService;
  telemetryService?: ITelemetryService;
  siteUrl?: string;  // Provided by SPFx; undefined in dev server
  dataServiceMode?: 'mock' | 'standalone' | 'sharepoint';
}

const NotFoundPage: React.FC = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2>Page Not Found</h2>
    <p>The page you requested does not exist.</p>
  </div>
);

const AppShellWithRouterAdapter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const adapterValue = React.useMemo(() => ({
    navigate: (to: string, options?: { replace?: boolean }) => navigate(to, { replace: options?.replace }),
    pathname: location.pathname,
    params,
  }), [location.pathname, navigate, params]);

  return <RouterAdapterProvider value={adapterValue}>{children}</RouterAdapterProvider>;
};

const AppRoutes: React.FC = () => {
  useTelemetryPageView();
  const { dataService, currentUser, selectedProject, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const isTanStackRouterEnabled = isFeatureEnabled(TANSTACK_ROUTER_ENABLED_FLAG);

  if (isTanStackRouterEnabled) {
    return (
      <React.Suspense fallback={<PhaseSuspenseFallback label="Loading project controls module..." />}>
        <TanStackAppRouterProvider
          queryClient={queryClient}
          dataService={dataService}
          currentUser={currentUser}
          selectedProject={selectedProject}
          isFeatureEnabled={isFeatureEnabled}
          scope={scope}
          showDevtools={process.env.NODE_ENV !== 'production'}
        />
      </React.Suspense>
    );
  }

  return (
  <React.Suspense fallback={<PhaseSuspenseFallback label="Loading project controls module..." />}>
    <Routes>
      {/* Dashboard — universal landing page */}
      <Route path="/" element={<DashboardPage />} />

      {/* Marketing */}
      <Route path="/marketing" element={(
        <ProtectedRoute permission={PERMISSIONS.MARKETING_DASHBOARD_VIEW}>
          <MarketingDashboard />
        </ProtectedRoute>
      )} />

      {/* Preconstruction */}
      <Route path="/preconstruction" element={(
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pipeline" element={(
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pipeline/gonogo" element={(
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/gonogo" element={(
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/precon-tracker" element={(
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/estimate-log" element={(
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/kickoff-list" element={(
        <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
          <EstimatingKickoffList />
        </ProtectedRoute>
      )} />
      <Route path="/preconstruction/autopsy-list" element={(
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
            <PostBidAutopsyList />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id" element={<PursuitDetail />} />
      <Route path="/preconstruction/pursuit/:id/kickoff" element={(
        <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
          <EstimatingKickoffPage />
        </ProtectedRoute>
      )} />
      <Route path="/preconstruction/pursuit/:id/interview" element={<InterviewPrep />} />
      <Route path="/preconstruction/pursuit/:id/winloss" element={<WinLossRecorder />} />
      <Route path="/preconstruction/pursuit/:id/turnover" element={(
        <FeatureGate featureName="TurnoverWorkflow" fallback={<NotFoundPage />}>
          <TurnoverToOps />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id/autopsy" element={(
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <LossAutopsy />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id/autopsy-form" element={(
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
            <PostBidAutopsyForm />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id/deliverables" element={<DeliverablesTracker />} />

      {/* Lead */}
      <Route path="/lead/new" element={(
        <FeatureGate featureName="LeadIntake" fallback={<NotFoundPage />}>
          <LeadFormPage />
        </FeatureGate>
      )} />
      <Route path="/lead/:id" element={<LeadDetailPage />} />
      <Route path="/lead/:id/gonogo" element={(
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoScorecard />
        </FeatureGate>
      )} />
      <Route path="/lead/:id/gonogo/detail" element={(
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoDetail />
        </FeatureGate>
      )} />
      <Route path="/lead/:id/schedule-gonogo" element={(
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoMeetingScheduler />
        </FeatureGate>
      )} />

      {/* Operations */}
      <Route path="/operations" element={(
        <ProtectedRoute permission={PERMISSIONS.ACTIVE_PROJECTS_VIEW}>
          <ActiveProjectsDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/operations/project" element={(
        <ProjectRequiredRoute><ProjectDashboard /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/project-settings" element={(
        <FeatureGate featureName="ContractTracking" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ProjectSettingsPage /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/startup-checklist" element={(
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ProjectStartupChecklist /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/management-plan" element={(
        <FeatureGate featureName="ProjectManagementPlan" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute>
            <ProtectedRoute permission={PERMISSIONS.PMP_EDIT}>
              <ProjectManagementPlan />
            </ProtectedRoute>
          </ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/superintendent-plan" element={(
        <ProjectRequiredRoute><SuperintendentPlanPage /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/responsibility" element={(
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/responsibility/owner-contract" element={(
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/responsibility/sub-contract" element={(
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/closeout-checklist" element={(
        <ProjectRequiredRoute><CloseoutChecklist /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/buyout-log" element={(
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.BUYOUT_VIEW}>
            <BuyoutLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      )} />
      <Route path="/operations/contract-tracking" element={(
        <ProjectRequiredRoute><ContractTracking /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/compliance-log" element={(
        <ProtectedRoute permission={PERMISSIONS.COMPLIANCE_LOG_VIEW}>
          <ComplianceLog />
        </ProtectedRoute>
      )} />
      <Route path="/operations/risk-cost" element={(
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.RISK_EDIT}>
            <RiskCostManagement />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      )} />
      <Route path="/operations/schedule" element={(
        <FeatureGate featureName="ScheduleModule" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><SchedulePage /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/quality-concerns" element={(
        <ProjectRequiredRoute><QualityConcernsTracker /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/safety-concerns" element={(
        <ProjectRequiredRoute><SafetyConcernsTracker /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/monthly-review" element={(
        <FeatureGate featureName="MonthlyProjectReview" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><MonthlyProjectReview /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/project-record" element={(
        <ProjectRequiredRoute><ProjectRecord /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/lessons-learned" element={(
        <ProjectRequiredRoute><LessonsLearnedPage /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/readicheck" element={(
        <ProjectRequiredRoute><ComingSoonPage title="ReadiCheck" /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/best-practices" element={(
        <ProjectRequiredRoute><ComingSoonPage title="Best Practices" /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/constraints" element={(
        <FeatureGate featureName="ConstraintsLog" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute>
            <ProtectedRoute permission={PERMISSIONS.CONSTRAINTS_VIEW}>
              <ConstraintsLogPage />
            </ProtectedRoute>
          </ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/permits" element={(
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.PERMITS_VIEW}>
            <PermitsLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      )} />
      <Route path="/operations/sub-scorecard" element={(
        <ProjectRequiredRoute><ComingSoonPage title="Sub Scorecard" /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/gonogo" element={(
        <ProjectRequiredRoute><GoNoGoScorecard /></ProjectRequiredRoute>
      )} />

      {/* Job Request */}
      <Route path="/job-request" element={<JobNumberRequestForm />} />
      <Route path="/job-request/:leadId" element={<JobNumberRequestForm />} />

      {/* Accounting */}
      <Route path="/accounting-queue" element={(
        <ProtectedRoute permission={PERMISSIONS.ACCOUNTING_QUEUE_VIEW}>
          <AccountingQueuePage />
        </ProtectedRoute>
      )} />

      {/* Admin */}
      <Route path="/admin" element={(
        <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
          <AdminPanel />
        </ProtectedRoute>
      )} />
      <Route path="/admin/performance" element={(
        <FeatureGate featureName="PerformanceMonitoring" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <PerformanceDashboard />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/admin/application-support" element={(
        <FeatureGate featureName="EnableHelpSystem" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <ApplicationSupportPage />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/admin/telemetry" element={(
        <FeatureGate featureName="TelemetryDashboard" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <TelemetryDashboard />
          </ProtectedRoute>
        </FeatureGate>
      )} />

      {/* System */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </React.Suspense>
  );
};

export const App: React.FC<IAppProps> = ({ dataService, telemetryService, siteUrl, dataServiceMode }) => {
  const queryClient = React.useMemo(() => getQueryClient(), []);
  const showQueryDevtools = process.env.NODE_ENV !== 'production';

  return (
    <FluentProvider theme={hbcLightTheme}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider dataService={dataService} telemetryService={telemetryService} siteUrl={siteUrl} dataServiceMode={dataServiceMode}>
            <SignalRProvider>
              <HelpProvider>
                <ToastProvider>
                  <OfflineMonitor />
                  <SwUpdateMonitor />
                  <HashRouter>
                    <AppShellWithRouterAdapter>
                      <AppShell>
                        <AppRoutes />
                      </AppShell>
                    </AppShellWithRouterAdapter>
                  </HashRouter>
                </ToastProvider>
              </HelpProvider>
            </SignalRProvider>
          </AppProvider>
          {showQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
};

export default App;
