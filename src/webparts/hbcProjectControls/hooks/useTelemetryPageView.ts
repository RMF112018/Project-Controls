import * as React from 'react';
import { useAppLocation } from '../components/hooks/router/useAppLocation';
import { useAppContext } from '../components/contexts/AppContext';

/**
 * Tracks a page view in telemetry on every route change.
 */
export function useTelemetryPageView(pathnameOverride?: string): void {
  const { telemetryService } = useAppContext();
  const location = useAppLocation();
  const trackedPathname = pathnameOverride ?? location.pathname;

  React.useEffect(() => {
    telemetryService.trackPageView(trackedPathname, `/#${trackedPathname}`);
  }, [trackedPathname, telemetryService]);
}
