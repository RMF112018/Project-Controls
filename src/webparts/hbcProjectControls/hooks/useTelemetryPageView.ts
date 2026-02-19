import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../components/contexts/AppContext';

/**
 * Tracks a page view in telemetry on every route change.
 * Must be called from within a <HashRouter> context.
 */
export function useTelemetryPageView(pathnameOverride?: string): void {
  const { telemetryService } = useAppContext();
  const location = useLocation();
  const trackedPathname = pathnameOverride ?? location.pathname;

  React.useEffect(() => {
    telemetryService.trackPageView(trackedPathname, `/#${trackedPathname}`);
  }, [trackedPathname, telemetryService]);
}
