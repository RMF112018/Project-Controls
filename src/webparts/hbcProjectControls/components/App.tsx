import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { hbcLightTheme } from '../theme/hbcTheme';
import { AppProvider } from './contexts/AppContext';
import { HelpProvider } from './contexts/HelpContext';
import { SignalRProvider } from './contexts/SignalRContext';
import { AppShell } from './layouts/AppShell';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/ToastContainer';
import { PageLoader } from './shared/PageLoader';
import { IDataService, PERMISSIONS } from '@hbc/sp-services';
import { ProtectedRoute, ProjectRequiredRoute, FeatureGate } from './guards';

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
  siteUrl?: string;  // Provided by SPFx; undefined in dev server
}

const NotFoundPage: React.FC = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2>Page Not Found</h2>
    <p>The page you requested does not exist.</p>
  </div>
);

const AppRoutes: React.FC = () => (
  <React.Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Dashboard — universal landing page */}
      <Route path="/" element={<DashboardPage />} />

      {/* Marketing */}
      <Route path="/marketing" element={
        <ProtectedRoute permission={PERMISSIONS.MARKETING_DASHBOARD_VIEW}>
          <MarketingDashboard />
        </ProtectedRoute>
      } />

      {/* Preconstruction */}
      <Route path="/preconstruction" element={
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      } />
      <Route path="/preconstruction/pipeline" element={
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      } />
      <Route path="/preconstruction/pipeline/gonogo" element={
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      } />
      <Route path="/preconstruction/gonogo" element={
        <FeatureGate featureName="PipelineDashboard" fallback={<NotFoundPage />}>
          <PipelinePage />
        </FeatureGate>
      } />
      <Route path="/preconstruction/precon-tracker" element={
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      } />
      <Route path="/preconstruction/estimate-log" element={
        <FeatureGate featureName="EstimatingTracker" fallback={<NotFoundPage />}>
          <EstimatingDashboard />
        </FeatureGate>
      } />
      <Route path="/preconstruction/kickoff-list" element={
        <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
          <EstimatingKickoffList />
        </ProtectedRoute>
      } />
      <Route path="/preconstruction/autopsy-list" element={
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
            <PostBidAutopsyList />
          </ProtectedRoute>
        </FeatureGate>
      } />
      <Route path="/preconstruction/pursuit/:id" element={<PursuitDetail />} />
      <Route path="/preconstruction/pursuit/:id/kickoff" element={
        <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
          <EstimatingKickoffPage />
        </ProtectedRoute>
      } />
      <Route path="/preconstruction/pursuit/:id/interview" element={<InterviewPrep />} />
      <Route path="/preconstruction/pursuit/:id/winloss" element={<WinLossRecorder />} />
      <Route path="/preconstruction/pursuit/:id/turnover" element={
        <FeatureGate featureName="TurnoverWorkflow" fallback={<NotFoundPage />}>
          <TurnoverToOps />
        </FeatureGate>
      } />
      <Route path="/preconstruction/pursuit/:id/autopsy" element={
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <LossAutopsy />
        </FeatureGate>
      } />
      <Route path="/preconstruction/pursuit/:id/autopsy-form" element={
        <FeatureGate featureName="LossAutopsy" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
            <PostBidAutopsyForm />
          </ProtectedRoute>
        </FeatureGate>
      } />
      <Route path="/preconstruction/pursuit/:id/deliverables" element={<DeliverablesTracker />} />

      {/* Lead */}
      <Route path="/lead/new" element={
        <FeatureGate featureName="LeadIntake" fallback={<NotFoundPage />}>
          <LeadFormPage />
        </FeatureGate>
      } />
      <Route path="/lead/:id" element={<LeadDetailPage />} />
      <Route path="/lead/:id/gonogo" element={
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoScorecard />
        </FeatureGate>
      } />
      <Route path="/lead/:id/gonogo/detail" element={
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoDetail />
        </FeatureGate>
      } />
      <Route path="/lead/:id/schedule-gonogo" element={
        <FeatureGate featureName="GoNoGoScorecard" fallback={<NotFoundPage />}>
          <GoNoGoMeetingScheduler />
        </FeatureGate>
      } />

      {/* Operations */}
      <Route path="/operations" element={
        <ProtectedRoute permission={PERMISSIONS.ACTIVE_PROJECTS_VIEW}>
          <ActiveProjectsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/operations/project" element={
        <ProjectRequiredRoute><ProjectDashboard /></ProjectRequiredRoute>
      } />
      <Route path="/operations/project-settings" element={
        <FeatureGate featureName="ContractTracking" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ProjectSettingsPage /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/startup-checklist" element={
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ProjectStartupChecklist /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/management-plan" element={
        <FeatureGate featureName="ProjectManagementPlan" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute>
            <ProtectedRoute permission={PERMISSIONS.PMP_EDIT}>
              <ProjectManagementPlan />
            </ProtectedRoute>
          </ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/superintendent-plan" element={
        <ProjectRequiredRoute><SuperintendentPlanPage /></ProjectRequiredRoute>
      } />
      <Route path="/operations/responsibility" element={
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/responsibility/owner-contract" element={
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/responsibility/sub-contract" element={
        <FeatureGate featureName="ProjectStartup" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/closeout-checklist" element={
        <ProjectRequiredRoute><CloseoutChecklist /></ProjectRequiredRoute>
      } />
      <Route path="/operations/buyout-log" element={
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.BUYOUT_VIEW}>
            <BuyoutLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      } />
      <Route path="/operations/contract-tracking" element={
        <ProjectRequiredRoute><ContractTracking /></ProjectRequiredRoute>
      } />
      <Route path="/operations/compliance-log" element={
        <ProtectedRoute permission={PERMISSIONS.COMPLIANCE_LOG_VIEW}>
          <ComplianceLog />
        </ProtectedRoute>
      } />
      <Route path="/operations/risk-cost" element={
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.RISK_EDIT}>
            <RiskCostManagement />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      } />
      <Route path="/operations/schedule" element={
        <FeatureGate featureName="ScheduleModule" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><SchedulePage /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/quality-concerns" element={
        <ProjectRequiredRoute><QualityConcernsTracker /></ProjectRequiredRoute>
      } />
      <Route path="/operations/safety-concerns" element={
        <ProjectRequiredRoute><SafetyConcernsTracker /></ProjectRequiredRoute>
      } />
      <Route path="/operations/monthly-review" element={
        <FeatureGate featureName="MonthlyProjectReview" fallback={<NotFoundPage />}>
          <ProjectRequiredRoute><MonthlyProjectReview /></ProjectRequiredRoute>
        </FeatureGate>
      } />
      <Route path="/operations/project-record" element={
        <ProjectRequiredRoute><ProjectRecord /></ProjectRequiredRoute>
      } />
      <Route path="/operations/lessons-learned" element={
        <ProjectRequiredRoute><LessonsLearnedPage /></ProjectRequiredRoute>
      } />
      <Route path="/operations/readicheck" element={
        <ProjectRequiredRoute><ComingSoonPage title="ReadiCheck" /></ProjectRequiredRoute>
      } />
      <Route path="/operations/best-practices" element={
        <ProjectRequiredRoute><ComingSoonPage title="Best Practices" /></ProjectRequiredRoute>
      } />
      <Route path="/operations/constraints" element={
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.CONSTRAINTS_VIEW}>
            <ConstraintsLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      } />
      <Route path="/operations/permits" element={
        <ProjectRequiredRoute>
          <ProtectedRoute permission={PERMISSIONS.PERMITS_VIEW}>
            <PermitsLogPage />
          </ProtectedRoute>
        </ProjectRequiredRoute>
      } />
      <Route path="/operations/sub-scorecard" element={
        <ProjectRequiredRoute><ComingSoonPage title="Sub Scorecard" /></ProjectRequiredRoute>
      } />
      <Route path="/operations/gonogo" element={
        <ProjectRequiredRoute><GoNoGoScorecard /></ProjectRequiredRoute>
      } />

      {/* Job Request */}
      <Route path="/job-request" element={<JobNumberRequestForm />} />
      <Route path="/job-request/:leadId" element={<JobNumberRequestForm />} />

      {/* Accounting */}
      <Route path="/accounting-queue" element={
        <ProtectedRoute permission={PERMISSIONS.ACCOUNTING_QUEUE_VIEW}>
          <AccountingQueuePage />
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
          <AdminPanel />
        </ProtectedRoute>
      } />
      <Route path="/admin/performance" element={
        <FeatureGate featureName="PerformanceMonitoring" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <PerformanceDashboard />
          </ProtectedRoute>
        </FeatureGate>
      } />
      <Route path="/admin/application-support" element={
        <FeatureGate featureName="EnableHelpSystem" fallback={<NotFoundPage />}>
          <ProtectedRoute permission={PERMISSIONS.ADMIN_CONFIG}>
            <ApplicationSupportPage />
          </ProtectedRoute>
        </FeatureGate>
      } />

      {/* System */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </React.Suspense>
);

export const App: React.FC<IAppProps> = ({ dataService, siteUrl }) => {
  return (
    <FluentProvider theme={hbcLightTheme}>
      <ErrorBoundary>
        <AppProvider dataService={dataService} siteUrl={siteUrl}>
          <SignalRProvider>
            <HelpProvider>
              <ToastProvider>
                <HashRouter>
                  <AppShell>
                    <AppRoutes />
                  </AppShell>
                </HashRouter>
              </ToastProvider>
            </HelpProvider>
          </SignalRProvider>
        </AppProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
};

export default App;
