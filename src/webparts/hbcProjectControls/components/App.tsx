import * as React from 'react';
import { FluentProvider, type Theme } from '@fluentui/react-components';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { hbcLightTheme } from '../theme/hbcTheme';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { HelpProvider } from './contexts/HelpContext';
import { SignalRProvider } from './contexts/SignalRContext';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/ToastContainer';
import { PhaseSuspenseFallback } from './shared/PhaseSuspenseFallback';
import { OfflineMonitor } from './shared/OfflineMonitor';
import { SwUpdateMonitor } from './shared/SwUpdateMonitor';
import { IDataService } from '@hbc/sp-services';
import type { ITelemetryService } from '@hbc/sp-services';
import { getQueryClient } from '../tanstack/query/queryClient';
import { useQueryScope } from '../tanstack/query/useQueryScope';
import { TanStackAppRouterProvider } from '../tanstack/router/router';

export interface IAppProps {
  dataService: IDataService;
  telemetryService?: ITelemetryService;
  siteUrl?: string;
  dataServiceMode?: 'mock' | 'standalone' | 'sharepoint';
  hostTheme?: Partial<Theme>;
}

function mergeThemes(baseTheme: Theme, hostThemePatch?: Partial<Theme>): Theme {
  return {
    ...baseTheme,
    ...(hostThemePatch ?? {}),
  };
}

const AppRoutes: React.FC = () => {
  const { dataService, currentUser, selectedProject, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();

  return (
    <React.Suspense fallback={<PhaseSuspenseFallback label="Loading project controls module..." />}>
      <TanStackAppRouterProvider
        queryClient={queryClient}
        dataService={dataService}
        currentUser={currentUser}
        selectedProject={selectedProject}
        isFeatureEnabled={isFeatureEnabled}
        scope={scope}
      />
    </React.Suspense>
  );
};

export const App: React.FC<IAppProps> = ({ dataService, telemetryService, siteUrl, dataServiceMode, hostTheme }) => {
  const queryClient = React.useMemo(() => getQueryClient(), []);
  const showQueryDevtools =
    typeof window !== 'undefined'
    && window.location.hostname === 'localhost'
    && window.localStorage.getItem('showQueryDevtools') === 'true';
  // Merge SharePoint host tokens over the design-system base theme when available.
  const mergedTheme = React.useMemo<Theme>(
    () => mergeThemes(hbcLightTheme, hostTheme ?? {}),
    [hostTheme]
  );

  return (
    <FluentProvider theme={mergedTheme}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider dataService={dataService} telemetryService={telemetryService} siteUrl={siteUrl} dataServiceMode={dataServiceMode}>
            <SignalRProvider>
              <HelpProvider>
                <ToastProvider>
                  <OfflineMonitor />
                  <SwUpdateMonitor />
                  <AppRoutes />
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
