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

const NotFoundPage: React.FC = () => (
  <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
    <h2 style={{ color: '#1B2A4A', marginBottom: '8px' }}>404 — Page Not Found</h2>
    <p>The page you are looking for does not exist or has been moved.</p>
    <a href="#/" style={{ color: '#E87722', textDecoration: 'underline' }}>Return to Home</a>
  </div>
);

export interface IAppProps {
  dataService: IDataService;
  renderMode: RenderMode;
}

const HubRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<PipelinePage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/lead/new" element={<LeadFormPage />} />
    <Route path="/lead/:id" element={<LeadDetailPage />} />
    <Route path="/lead/:id/gonogo" element={<GoNoGoScorecard />} />
    <Route path="/lead/:id/gonogo/detail" element={<GoNoGoDetail />} />
    <Route path="/lead/:id/schedule-gonogo" element={<GoNoGoMeetingScheduler />} />
    <Route path="/admin" element={<AdminPanel />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const ProjectRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<ProjectDashboard />} />
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
