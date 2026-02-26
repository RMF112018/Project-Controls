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

export interface IDevToolsConfig {
  currentRole: string;
  roleOptions: ReadonlyArray<{ label: string; value: string }>;
  onRoleChange: (role: string) => void;
  onSwitchMode?: () => void;
  mode: 'mock' | 'standalone';
}

export interface IAppProps {
  dataService: IDataService;
  telemetryService?: ITelemetryService;
  siteUrl?: string;
  dataServiceMode?: 'mock' | 'standalone' | 'sharepoint';
  hostTheme?: Partial<Theme>;
  devToolsConfig?: IDevToolsConfig;
}

function mergeThemes(baseTheme: Theme, hostThemePatch?: Partial<Theme>): Theme {
  return {
    ...baseTheme,
    ...(hostThemePatch ?? {}),
  };
}

const ROUTE_SUSPENSE_FALLBACK = <PhaseSuspenseFallback label="Loading project controls module..." />;

interface IReactProfileEvent {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDurationMs: number;
  baseDurationMs: number;
  startTime: number;
  commitTime: number;
  ts: string;
}

function isReactProfilingEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.location.hostname === 'localhost'
    && window.localStorage.getItem('showReactProfiler') === 'true'
  );
}

const AppRoutes: React.FC = () => {
  const { dataService, currentUser, selectedProject, isFeatureEnabled, telemetryService } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const enableReactProfiling = React.useMemo(() => isReactProfilingEnabled(), []);

  const routerProps = React.useMemo(() => ({
    queryClient,
    dataService,
    currentUser,
    selectedProject,
    isFeatureEnabled,
    scope,
  }), [queryClient, dataService, currentUser, selectedProject, isFeatureEnabled, scope]);

  const handleRender = React.useCallback<React.ProfilerOnRenderCallback>((id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    if (!enableReactProfiling || typeof window === 'undefined') {
      return;
    }

    const payload: IReactProfileEvent = {
      id,
      phase,
      actualDurationMs: Math.round(actualDuration * 100) / 100,
      baseDurationMs: Math.round(baseDuration * 100) / 100,
      startTime: Math.round(startTime * 100) / 100,
      commitTime: Math.round(commitTime * 100) / 100,
      ts: new Date().toISOString(),
    };

    const target = window as Window & { __hbcReactProfileEvents__?: IReactProfileEvent[] };
    const nextEvents = [...(target.__hbcReactProfileEvents__ ?? []), payload];
    target.__hbcReactProfileEvents__ = nextEvents.slice(-250);

    // Capture actionable commits without flooding App Insights.
    if (actualDuration >= 16) {
      telemetryService.trackMetric('react:commit:duration', actualDuration, {
        profilerId: id,
        phase,
      });
    }
  }, [enableReactProfiling, telemetryService]);

  const routeTree = (
    <React.Suspense fallback={ROUTE_SUSPENSE_FALLBACK}>
      <TanStackAppRouterProvider {...routerProps} />
    </React.Suspense>
  );

  if (!enableReactProfiling) {
    return routeTree;
  }

  return (
    <React.Profiler id="HbcAppRoutes" onRender={handleRender}>
      {routeTree}
    </React.Profiler>
  );
};

export const App: React.FC<IAppProps> = ({ dataService, telemetryService, siteUrl, dataServiceMode, hostTheme, devToolsConfig }) => {
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
      {/* Stage 7 Sub-task 2: localhost-gated exception telemetry for root render failures. */}
      <ErrorBoundary
        boundaryName="AppRoot"
        telemetryService={telemetryService}
        telemetryEnabled={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
      >
        <QueryClientProvider client={queryClient}>
          <AppProvider dataService={dataService} telemetryService={telemetryService} siteUrl={siteUrl} dataServiceMode={dataServiceMode} devToolsConfig={devToolsConfig}>
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
