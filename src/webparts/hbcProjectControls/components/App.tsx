import * as React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FluentProvider } from '@fluentui/react-components';
import { hbcLightTheme } from '../theme/hbcTheme';
import { AppProvider } from './contexts/AppContext';
import { AppShell } from './layouts/AppShell';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { IDataService } from '../services/IDataService';
import { RenderMode } from '../models/enums';

// Hub pages
import { PipelinePage } from './pages/hub/PipelinePage';
import { DashboardPage } from './pages/hub/DashboardPage';
import { LeadDetailPage } from './pages/hub/LeadDetailPage';
import { LeadFormPage } from './pages/hub/LeadFormPage';
import { GoNoGoScorecard } from './pages/hub/GoNoGoScorecard';
import { GoNoGoDetail } from './pages/hub/GoNoGoDetail';
import { GoNoGoMeetingScheduler } from './pages/hub/GoNoGoMeetingScheduler';
import { AdminPanel } from './pages/hub/AdminPanel';

// Precon pages
import { EstimatingDashboard } from './pages/precon/EstimatingDashboard';
import { PursuitDetail } from './pages/precon/PursuitDetail';
import { GoNoGoTracker } from './pages/precon/GoNoGoTracker';

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

// Hub pages (Phase 9)
import { MarketingDashboard } from './pages/hub/MarketingDashboard';

export interface IAppProps {
  dataService: IDataService;
  renderMode: RenderMode;
}

const NotFoundPage: React.FC = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2>Page Not Found</h2>
    <p>The page you requested does not exist.</p>
  </div>
);

const HubRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<PipelinePage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/lead/new" element={<LeadFormPage />} />
    <Route path="/lead/:id" element={<LeadDetailPage />} />
    <Route path="/lead/:id/gonogo" element={<GoNoGoScorecard />} />
    <Route path="/lead/:id/gonogo/detail" element={<GoNoGoDetail />} />
    <Route path="/lead/:id/schedule-gonogo" element={<GoNoGoMeetingScheduler />} />
    <Route path="/marketing" element={<MarketingDashboard />} />
    <Route path="/admin" element={<AdminPanel />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const ProjectRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<ProjectDashboard />} />
    <Route path="/kickoff" element={<PreconKickoff />} />
    <Route path="/deliverables" element={<DeliverablesTracker />} />
    <Route path="/interview" element={<InterviewPrep />} />
    <Route path="/winloss" element={<WinLossRecorder />} />
    <Route path="/autopsy" element={<LossAutopsy />} />
    <Route path="/contract" element={<ContractTracking />} />
    <Route path="/turnover" element={<TurnoverToOps />} />
    <Route path="/closeout" element={<CloseoutChecklist />} />
    <Route path="/startup-checklist" element={<ProjectStartupChecklist />} />
    <Route path="/responsibility" element={<ResponsibilityMatrices />} />
    <Route path="/responsibility/owner-contract" element={<ResponsibilityMatrices />} />
    <Route path="/responsibility/sub-contract" element={<ResponsibilityMatrices />} />
    <Route path="/project-record" element={<ProjectRecord />} />
    <Route path="/risk-cost" element={<RiskCostManagement />} />
    <Route path="/quality-concerns" element={<QualityConcernsTracker />} />
    <Route path="/safety-concerns" element={<SafetyConcernsTracker />} />
    <Route path="/schedule-critical-path" element={<ProjectScheduleCriticalPath />} />
    <Route path="/superintendent-plan" element={<SuperintendentPlanPage />} />
    <Route path="/lessons-learned" element={<LessonsLearnedPage />} />
    <Route path="/pmp" element={<ProjectManagementPlan />} />
    <Route path="/monthly-review" element={<MonthlyProjectReview />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const PreconRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<EstimatingDashboard />} />
    <Route path="/pursuit/:id" element={<PursuitDetail />} />
    <Route path="/precon-tracking" element={<EstimatingDashboard />} />
    <Route path="/estimate-log" element={<EstimatingDashboard />} />
    <Route path="/gonogo-tracker" element={<GoNoGoTracker />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export const App: React.FC<IAppProps> = ({ dataService, renderMode }) => {
  const RoutesComponent = renderMode === RenderMode.Full ? HubRoutes
    : renderMode === RenderMode.Project ? ProjectRoutes
    : PreconRoutes;

  return (
    <FluentProvider theme={hbcLightTheme}>
      <ErrorBoundary>
        <AppProvider dataService={dataService} renderMode={renderMode}>
          <HashRouter>
            <AppShell>
              <RoutesComponent />
            </AppShell>
          </HashRouter>
        </AppProvider>
      </ErrorBoundary>
    </FluentProvider>
  );
};

export default App;
