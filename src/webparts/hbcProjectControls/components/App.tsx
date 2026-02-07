import * as React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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

// Precon pages
import { EstimatingDashboard } from './pages/precon/EstimatingDashboard';

// Project pages
import { ProjectDashboard } from './pages/project/ProjectDashboard';

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
  </Routes>
);

const ProjectRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<ProjectDashboard />} />
  </Routes>
);

const PreconRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<EstimatingDashboard />} />
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
