import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../components/contexts/AppContext';

/**
 * Tracks a page view in telemetry on every route change.
 * Must be called from within a <HashRouter> context.
 */
export function useTelemetryPageView(): void {
  const { telemetryService } = useAppContext();
  const location = useLocation();

  React.useEffect(() => {
    telemetryService.trackPageView(location.pathname, `/#${location.pathname}`);
  }, [location.pathname, telemetryService]);
}
