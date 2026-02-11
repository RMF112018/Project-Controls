import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { hbcLightTheme } from '../theme/hbcTheme';
import { AppProvider } from './contexts/AppContext';
import { AppShell } from './layouts/AppShell';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/ToastContainer';
import { IDataService } from '../services/IDataService';

// Hub pages
import { PipelinePage } from './pages/hub/PipelinePage';
import { DashboardPage } from './pages/hub/DashboardPage';
import { LeadDetailPage } from './pages/hub/LeadDetailPage';
import { LeadFormPage } from './pages/hub/LeadFormPage';
import { GoNoGoScorecard } from './pages/hub/GoNoGoScorecard';
import { GoNoGoDetail } from './pages/hub/GoNoGoDetail';
import { GoNoGoMeetingScheduler } from './pages/hub/GoNoGoMeetingScheduler';
import { AdminPanel } from './pages/hub/AdminPanel';
import { MarketingDashboard } from './pages/hub/MarketingDashboard';
import { JobNumberRequestForm } from './pages/hub/JobNumberRequestForm';
import { AccountingQueuePage } from './pages/hub/AccountingQueuePage';
import { ActiveProjectsDashboard } from './pages/hub/ActiveProjectsDashboard';
import { ComplianceLog } from './pages/hub/ComplianceLog';

// Precon pages
import { EstimatingDashboard } from './pages/precon/EstimatingDashboard';
import { PursuitDetail } from './pages/precon/PursuitDetail';
import { GoNoGoTracker } from './pages/precon/GoNoGoTracker';
import { EstimatingKickoffList } from './pages/precon/EstimatingKickoffList';
import { EstimatingKickoffPage } from './pages/precon/EstimatingKickoffPage';
import { PostBidAutopsyList } from './pages/precon/PostBidAutopsyList';
import { PostBidAutopsyForm } from './pages/precon/PostBidAutopsyForm';

// Project pages
import { ProjectDashboard } from './pages/project/ProjectDashboard';
import { PreconKickoff } from './pages/project/PreconKickoff';
import { DeliverablesTracker } from './pages/project/DeliverablesTracker';
import { InterviewPrep } from './pages/project/InterviewPrep';
import { WinLossRecorder } from './pages/project/WinLossRecorder';
import { LossAutopsy } from './pages/project/LossAutopsy';
import { ContractTracking } from './pages/project/ContractTracking';
import { TurnoverToOps } from './pages/project/TurnoverToOps';
import { CloseoutChecklist } from './pages/project/CloseoutChecklist';
import { ProjectStartupChecklist } from './pages/project/ProjectStartupChecklist';
import { ResponsibilityMatrices } from './pages/project/ResponsibilityMatrices';
import { ProjectRecord } from './pages/project/ProjectRecord';
import { RiskCostManagement } from './pages/project/RiskCostManagement';
import { QualityConcernsTracker } from './pages/project/QualityConcernsTracker';
import { SafetyConcernsTracker } from './pages/project/SafetyConcernsTracker';
import { ProjectScheduleCriticalPath } from './pages/project/ProjectScheduleCriticalPath';
import { SuperintendentPlanPage } from './pages/project/SuperintendentPlanPage';
import { LessonsLearnedPage } from './pages/project/LessonsLearnedPage';
import { ProjectManagementPlan } from './pages/project/pmp/ProjectManagementPlan';
import { MonthlyProjectReview } from './pages/project/MonthlyProjectReview';
import { BuyoutLogPage } from './pages/project/BuyoutLogPage';
import { AccessDeniedPage } from './pages/shared/AccessDeniedPage';
import { ProtectedRoute, ProjectRequiredRoute } from './guards';

import { PERMISSIONS } from '../utils/permissions';

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
    <Route path="/preconstruction" element={<EstimatingDashboard />} />
    <Route path="/preconstruction/pipeline" element={<PipelinePage />} />
    <Route path="/preconstruction/pipeline/gonogo" element={<PipelinePage />} />
    <Route path="/preconstruction/gonogo" element={<PipelinePage />} />
    <Route path="/preconstruction/precon-tracker" element={<EstimatingDashboard />} />
    <Route path="/preconstruction/estimate-log" element={<EstimatingDashboard />} />
    <Route path="/preconstruction/kickoff-list" element={
      <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
        <EstimatingKickoffList />
      </ProtectedRoute>
    } />
    <Route path="/preconstruction/autopsy-list" element={
      <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
        <PostBidAutopsyList />
      </ProtectedRoute>
    } />
    <Route path="/preconstruction/pursuit/:id" element={<PursuitDetail />} />
    <Route path="/preconstruction/pursuit/:id/kickoff" element={
      <ProtectedRoute permission={PERMISSIONS.KICKOFF_VIEW}>
        <EstimatingKickoffPage />
      </ProtectedRoute>
    } />
    <Route path="/preconstruction/pursuit/:id/interview" element={<InterviewPrep />} />
    <Route path="/preconstruction/pursuit/:id/winloss" element={<WinLossRecorder />} />
    <Route path="/preconstruction/pursuit/:id/turnover" element={<TurnoverToOps />} />
    <Route path="/preconstruction/pursuit/:id/autopsy" element={<LossAutopsy />} />
    <Route path="/preconstruction/pursuit/:id/autopsy-form" element={
      <ProtectedRoute permission={PERMISSIONS.AUTOPSY_VIEW}>
        <PostBidAutopsyForm />
      </ProtectedRoute>
    } />
    <Route path="/preconstruction/pursuit/:id/deliverables" element={<DeliverablesTracker />} />

    {/* Lead */}
    <Route path="/lead/new" element={<LeadFormPage />} />
    <Route path="/lead/:id" element={<LeadDetailPage />} />
    <Route path="/lead/:id/gonogo" element={<GoNoGoScorecard />} />
    <Route path="/lead/:id/gonogo/detail" element={<GoNoGoDetail />} />
    <Route path="/lead/:id/schedule-gonogo" element={<GoNoGoMeetingScheduler />} />

    {/* Operations */}
    <Route path="/operations" element={
      <ProtectedRoute permission={PERMISSIONS.ACTIVE_PROJECTS_VIEW}>
        <ActiveProjectsDashboard />
      </ProtectedRoute>
    } />
    <Route path="/operations/project" element={
      <ProjectRequiredRoute><ProjectDashboard /></ProjectRequiredRoute>
    } />
    <Route path="/operations/startup-checklist" element={
      <ProjectRequiredRoute><ProjectStartupChecklist /></ProjectRequiredRoute>
    } />
    <Route path="/operations/management-plan" element={
      <ProjectRequiredRoute>
        <ProtectedRoute permission={PERMISSIONS.PMP_EDIT}>
          <ProjectManagementPlan />
        </ProtectedRoute>
      </ProjectRequiredRoute>
    } />
    <Route path="/operations/superintendent-plan" element={
      <ProjectRequiredRoute><SuperintendentPlanPage /></ProjectRequiredRoute>
    } />
    <Route path="/operations/responsibility" element={
      <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
    } />
    <Route path="/operations/responsibility/owner-contract" element={
      <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
    } />
    <Route path="/operations/responsibility/sub-contract" element={
      <ProjectRequiredRoute><ResponsibilityMatrices /></ProjectRequiredRoute>
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
      <ProjectRequiredRoute><ProjectScheduleCriticalPath /></ProjectRequiredRoute>
    } />
    <Route path="/operations/quality-concerns" element={
      <ProjectRequiredRoute><QualityConcernsTracker /></ProjectRequiredRoute>
    } />
    <Route path="/operations/safety-concerns" element={
      <ProjectRequiredRoute><SafetyConcernsTracker /></ProjectRequiredRoute>
    } />
    <Route path="/operations/monthly-review" element={
      <ProjectRequiredRoute><MonthlyProjectReview /></ProjectRequiredRoute>
    } />
    <Route path="/operations/project-record" element={
      <ProjectRequiredRoute><ProjectRecord /></ProjectRequiredRoute>
    } />
    <Route path="/operations/lessons-learned" element={
      <ProjectRequiredRoute><LessonsLearnedPage /></ProjectRequiredRoute>
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

    {/* System */}
    <Route path="/access-denied" element={<AccessDeniedPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export const App: React.FC<IAppProps> = ({ dataService, siteUrl }) => {
  return (
    <FluentProvider theme={hbcLightTheme}>
      <ErrorBoundary>
        <AppProvider dataService={dataService} siteUrl={siteUrl}>
          <ToastProvider>
            <HashRouter>
              <AppShell>
                <AppRoutes />
              </AppShell>
            </HashRouter>
          </ToastProvider>
        </AppProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
};

export default App;
