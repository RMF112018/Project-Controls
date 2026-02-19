import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
import { PageLoader } from './shared/PageLoader';
import { OfflineMonitor } from './shared/OfflineMonitor';
import { SwUpdateMonitor } from './shared/SwUpdateMonitor';
import { IDataService, PERMISSIONS } from '@hbc/sp-services';
import type { ITelemetryService } from '@hbc/sp-services';
import { ProtectedRoute, ProjectRequiredRoute, FeatureGate } from './guards';
import { useTelemetryPageView } from '../hooks/useTelemetryPageView';
import { getQueryClient } from '../tanstack/query/queryClient';
import { useQueryScope } from '../tanstack/query/useQueryScope';
import { TanStackPilotRouter } from '../tanstack/router/router';
import { TANSTACK_ROUTER_PILOT_FLAG } from '../tanstack/router/constants';

// ---------------------------------------------------------------------------
// Helper: wrap React.lazy() for named exports
// ---------------------------------------------------------------------------
function lazyNamed<T extends React.ComponentType<Record<string, never>>>(
  factory: () => Promise<{ [key: string]: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().then((mod) => {
      const key = Object.keys(mod)[0];
      return { default: mod[key] };
    })
  );
}

// ---------------------------------------------------------------------------
// Lazy page imports — Hub
// ---------------------------------------------------------------------------
const DashboardPage = lazyNamed(() => import('./pages/hub/DashboardPage'));
const PipelinePage = lazyNamed(() => import('./pages/hub/PipelinePage'));
const MarketingDashboard = lazyNamed(() => import('./pages/hub/MarketingDashboard'));
const LeadFormPage = lazyNamed(() => import('./pages/hub/LeadFormPage'));
const LeadDetailPage = lazyNamed(() => import('./pages/hub/LeadDetailPage'));
const GoNoGoScorecard = lazyNamed(() => import('./pages/hub/GoNoGoScorecard'));
const GoNoGoDetail = lazyNamed(() => import('./pages/hub/GoNoGoDetail'));
const GoNoGoMeetingScheduler = lazyNamed(() => import('./pages/hub/GoNoGoMeetingScheduler'));
const JobNumberRequestForm = lazyNamed(() => import('./pages/hub/JobNumberRequestForm'));
const AccountingQueuePage = lazyNamed(() => import('./pages/hub/AccountingQueuePage'));
const ActiveProjectsDashboard = lazyNamed(() => import('./pages/hub/ActiveProjectsDashboard'));
const ComplianceLog = lazyNamed(() => import('./pages/hub/ComplianceLog'));

// ---------------------------------------------------------------------------
// Lazy page imports — Admin
// ---------------------------------------------------------------------------
const AdminPanel = lazyNamed(() => import('./pages/hub/AdminPanel'));
const PerformanceDashboard = lazyNamed(() => import('./pages/hub/PerformanceDashboard'));
const ApplicationSupportPage = lazyNamed(() => import('./pages/hub/ApplicationSupportPage'));
const TelemetryDashboard = lazyNamed(() => import('./pages/hub/TelemetryDashboard'));

// ---------------------------------------------------------------------------
// Lazy page imports — Precon
// ---------------------------------------------------------------------------
const EstimatingDashboard = lazyNamed(() => import('./pages/precon/EstimatingDashboard'));
const PursuitDetail = lazyNamed(() => import('./pages/precon/PursuitDetail'));
const EstimatingKickoffList = lazyNamed(() => import('./pages/precon/EstimatingKickoffList'));
const EstimatingKickoffPage = lazyNamed(() => import('./pages/precon/EstimatingKickoffPage'));
const PostBidAutopsyList = lazyNamed(() => import('./pages/precon/PostBidAutopsyList'));
const PostBidAutopsyForm = lazyNamed(() => import('./pages/precon/PostBidAutopsyForm'));

// ---------------------------------------------------------------------------
// Lazy page imports — Project execution
// ---------------------------------------------------------------------------
const ProjectDashboard = lazyNamed(() => import('./pages/project/ProjectDashboard'));
const DeliverablesTracker = lazyNamed(() => import('./pages/project/DeliverablesTracker'));
const InterviewPrep = lazyNamed(() => import('./pages/project/InterviewPrep'));
const WinLossRecorder = lazyNamed(() => import('./pages/project/WinLossRecorder'));
const LossAutopsy = lazyNamed(() => import('./pages/project/LossAutopsy'));
const ContractTracking = lazyNamed(() => import('./pages/project/ContractTracking'));
const TurnoverToOps = lazyNamed(() => import('./pages/project/TurnoverToOps'));
const CloseoutChecklist = lazyNamed(() => import('./pages/project/CloseoutChecklist'));
const ProjectStartupChecklist = lazyNamed(() => import('./pages/project/ProjectStartupChecklist'));
const ResponsibilityMatrices = lazyNamed(() => import('./pages/project/ResponsibilityMatrices'));
const ProjectRecord = lazyNamed(() => import('./pages/project/ProjectRecord'));
const RiskCostManagement = lazyNamed(() => import('./pages/project/RiskCostManagement'));
const QualityConcernsTracker = lazyNamed(() => import('./pages/project/QualityConcernsTracker'));
const SafetyConcernsTracker = lazyNamed(() => import('./pages/project/SafetyConcernsTracker'));
const SchedulePage = lazyNamed(() => import('./pages/project/SchedulePage'));
const SuperintendentPlanPage = lazyNamed(() => import('./pages/project/SuperintendentPlanPage'));
const LessonsLearnedPage = lazyNamed(() => import('./pages/project/LessonsLearnedPage'));
const ProjectManagementPlan = lazyNamed(() => import('./pages/project/pmp/ProjectManagementPlan'));
const MonthlyProjectReview = lazyNamed(() => import('./pages/project/MonthlyProjectReview'));
const BuyoutLogPage = lazyNamed(() => import('./pages/project/BuyoutLogPage'));
const ConstraintsLogPage = lazyNamed(() => import('./pages/project/ConstraintsLogPage'));
const PermitsLogPage = lazyNamed(() => import('./pages/project/PermitsLogPage'));
const ProjectSettingsPage = lazyNamed(() => import('./pages/project/ProjectSettingsPage'));

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

const AppRoutes: React.FC = () => {
  useTelemetryPageView();
  const { dataService, currentUser, selectedProject, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const isTanStackRouterPilotEnabled = isFeatureEnabled(TANSTACK_ROUTER_PILOT_FLAG);

  const renderTanStackPilotRoute = (): React.ReactElement => (
    <TanStackPilotRouter
      queryClient={queryClient}
      dataService={dataService}
      currentUser={currentUser}
      selectedProject={selectedProject}
      isFeatureEnabled={isFeatureEnabled}
      scope={scope}
    />
  );

  return (
  <React.Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Dashboard — universal landing page */}
      <Route path="/" element={<DashboardPage />} />

      {/* Marketing */}
      <Route path="/marketing" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.MARKETING_DASHBOARD_VIEW}>
          <MarketingDashboard />
        </ProtectedRoute>
      )} />

      {/* Preconstruction */}
      <Route path="/preconstruction" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pipeline" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pipeline/gonogo" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/gonogo" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/precon-tracker" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/estimate-log" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/kickoff-list" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
          <EstimatingKickoffList />
        </ProtectedRoute>
      )} />
      <Route path="/preconstruction/autopsy-list" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
            <PostBidAutopsyList />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <PursuitDetail />} />
      <Route path="/preconstruction/pursuit/:id/kickoff" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
          <EstimatingKickoffPage />
        </ProtectedRoute>
      )} />
      <Route path="/preconstruction/pursuit/:id/interview" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <InterviewPrep />} />
      <Route path="/preconstruction/pursuit/:id/winloss" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <WinLossRecorder />} />
      <Route path="/preconstruction/pursuit/:id/turnover" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="TurnoverWorkflow" fallback={<NotFoundPage />}>
          <TurnoverToOps />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id/autopsy" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <LossAutopsy />
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id/autopsy-form" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
            <PostBidAutopsyForm />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/preconstruction/pursuit/:id/deliverables" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <DeliverablesTracker />} />

      {/* Lead */}
      <Route path="/lead/new" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="LeadIntake" fallback={<NotFoundPage />}>
          <LeadFormPage />
        </FeatureGate>
      )} />
      <Route path="/lead/:id" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <LeadDetailPage />} />
      <Route path="/lead/:id/gonogo" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoScorecard />
        </FeatureGate>
      )} />
      <Route path="/lead/:id/gonogo/detail" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoDetail />
        </FeatureGate>
      )} />
      <Route path="/lead/:id/schedule-gonogo" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoMeetingScheduler />
        </FeatureGate>
      )} />

      {/* Operations */}
      <Route path="/operations" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.ACTIVE_PROJECTS_VIEW}>
          <ActiveProjectsDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/operations/project" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><ProjectDashboard /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/project-settings" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ContractTracking" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ProjectSettingsPage /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/startup-checklist" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ProjectStartupChecklist /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/management-plan" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ProjectManagementPlan" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute>
            <ProtectedRoute permission={PERMISSIONS.PMP_EDIT}>
              <ProjectManagementPlan />
            </ProtectedRoute>
          </ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/superintendent-plan" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><SuperintendentPlanPage /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/responsibility" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/responsibility/owner-contract" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/responsibility/sub-contract" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/closeout-checklist" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><CloseoutChecklist /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/buyout-log" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.BUYOUT_VIEW}>
            <BuyoutLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      )} />
      <Route path="/operations/contract-tracking" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><ContractTracking /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/compliance-log" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.COMPLIANCE_LOG_VIEW}>
          <ComplianceLog />
        </ProtectedRoute>
      )} />
      <Route path="/operations/risk-cost" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.RISK_EDIT}>
            <RiskCostManagement />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      )} />
      <Route path="/operations/schedule" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ScheduleModule" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><SchedulePage /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/quality-concerns" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><QualityConcernsTracker /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/safety-concerns" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><SafetyConcernsTracker /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/monthly-review" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="MonthlyProjectReview" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><MonthlyProjectReview /></ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/project-record" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><ProjectRecord /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/lessons-learned" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><LessonsLearnedPage /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/readicheck" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><ComingSoonPage title="ReadiCheck" /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/best-practices" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><ComingSoonPage title="Best Practices" /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/constraints" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="ConstraintsLog" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute>
            <ProtectedRoute permission={PERMISSIONS.CONSTRAINTS_VIEW}>
              <ConstraintsLogPage />
            </ProtectedRoute>
          </ProjectRequiredRoute>
        </FeatureGate>
      )} />
      <Route path="/operations/permits" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.PERMITS_VIEW}>
            <PermitsLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      )} />
      <Route path="/operations/sub-scorecard" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><ComingSoonPage title="Sub Scorecard" /></ProjectRequiredRoute>
      )} />
      <Route path="/operations/gonogo" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProjectRequiredRoute><GoNoGoScorecard /></ProjectRequiredRoute>
      )} />

      {/* Job Request */}
      <Route path="/job-request" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <JobNumberRequestForm />} />
      <Route path="/job-request/:leadId" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <JobNumberRequestForm />} />

      {/* Accounting */}
      <Route path="/accounting-queue" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.ACCOUNTING_QUEUE_VIEW}>
          <AccountingQueuePage />
        </ProtectedRoute>
      )} />

      {/* Admin */}
      <Route path="/admin" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
          <AdminPanel />
        </ProtectedRoute>
      )} />
      <Route path="/admin/performance" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="PerformanceMonitoring" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <PerformanceDashboard />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/admin/application-support" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="EnableHelpSystem" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <ApplicationSupportPage />
          </ProtectedRoute>
        </FeatureGate>
      )} />
      <Route path="/admin/telemetry" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : (
        <FeatureGate featureName="TelemetryDashboard" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <TelemetryDashboard />
          </ProtectedRoute>
        </FeatureGate>
      )} />

      {/* System */}
      <Route path="/access-denied" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <AccessDeniedPage />} />
      <Route path="*" element={isTanStackRouterPilotEnabled ? renderTanStackPilotRoute() : <NotFoundPage />} />
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
                    <AppShell>
                      <AppRoutes />
                    </AppShell>
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
