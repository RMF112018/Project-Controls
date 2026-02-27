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

interface ITelemetryCorrelationCapable extends ITelemetryService {
  newOperationId: (scope: string) => string;
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
  const { dataService, currentUser, selectedProject, isFeatureEnabled, telemetryService, isLoading } = useAppContext();
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
    telemetryService,
  }), [queryClient, dataService, currentUser, selectedProject, isFeatureEnabled, scope, telemetryService]);

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
      const route = window.location.hash.replace(/^#/, '') || '/';
      const workspace = route.split('/').filter(Boolean)[0] ?? 'hub';
      telemetryService.trackMetric('react:commit:duration', actualDuration, {
        profilerId: id,
        phase,
        route,
        workspace,
      });
      telemetryService.trackEvent({
        name: 'react:commit:threshold',
        properties: {
          profilerId: id,
          phase,
          route,
          workspace,
        },
        measurements: {
          actualDurationMs: Math.round(actualDuration * 100) / 100,
          baseDurationMs: Math.round(baseDuration * 100) / 100,
        },
      });
    }
  }, [enableReactProfiling, telemetryService]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }
    const supportsLongTask = PerformanceObserver.supportedEntryTypes?.includes('longtask');
    if (!supportsLongTask) {
      return;
    }

    const durations: number[] = [];
    let windowStartedAt = Date.now();

    const emitSummary = (): void => {
      if (durations.length === 0) {
        return;
      }
      const route = window.location.hash.replace(/^#/, '') || '/';
      const workspace = route.split('/').filter(Boolean)[0] ?? 'hub';
      const correlationCapable = telemetryService as ITelemetryCorrelationCapable;
      const operationId = correlationCapable.newOperationId?.('longtask-jank') ?? '';
      const maxLongTaskMs = Math.max(...durations);
      const avgLongTaskMs = durations.reduce((sum, value) => sum + value, 0) / durations.length;
      const sampleWindowMs = Math.max(1, Date.now() - windowStartedAt);

      telemetryService.trackEvent({
        name: 'longtask:jank:summary',
        properties: {
          route,
          workspace,
          corr_operation_id: operationId,
        },
        measurements: {
          longTaskCount: durations.length,
          maxLongTaskMs: Math.round(maxLongTaskMs * 100) / 100,
          avgLongTaskMs: Math.round(avgLongTaskMs * 100) / 100,
          sampleWindowMs,
        },
      });
      telemetryService.trackMetric('longtask:jank:max', maxLongTaskMs, {
        route,
        workspace,
        corr_operation_id: operationId,
      });

      durations.length = 0;
      windowStartedAt = Date.now();
    };

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.duration > 0) {
          durations.push(entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    const intervalId = window.setInterval(emitSummary, 30000);

    return () => {
      window.clearInterval(intervalId);
      observer.disconnect();
      emitSummary();
    };
  }, [telemetryService]);

  const routeTree = isLoading
    ? ROUTE_SUSPENSE_FALLBACK
    : (
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
