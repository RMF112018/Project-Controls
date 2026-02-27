import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { HbcSkeleton } from '../shared/HbcSkeleton';
import AppContext from '../contexts/AppContext';

interface ITelemetryCorrelationCapable {
  newOperationId?: (scope: string) => string;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
    ...shorthands.gap(tokens.spacingVerticalM),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
});

export const RouteSuspenseFallback: React.FC = () => {
  const styles = useStyles();
  const appContext = React.useContext(AppContext);
  const startedAtRef = React.useRef<number>(Date.now());
  const operationIdRef = React.useRef<string>('');

  React.useEffect(() => {
    startedAtRef.current = Date.now();
    const correlationCapable = appContext?.telemetryService as ITelemetryCorrelationCapable | undefined;
    operationIdRef.current = correlationCapable?.newOperationId?.('route-suspense') ?? '';
    return () => {
      const durationMs = Date.now() - startedAtRef.current;
      const route = typeof window !== 'undefined'
        ? (window.location.hash.replace(/^#/, '') || '/')
        : '/';
      const properties = {
        route,
        corr_operation_id: operationIdRef.current,
      };

      appContext?.telemetryService.trackMetric('route:lazy:fallback:visible', durationMs, properties);
      appContext?.telemetryService.trackEvent({
        name: 'route:lazy:fallback:visible',
        properties,
        measurements: { durationMs },
      });
    };
  }, [appContext]);

  return (
    <div className={styles.container} aria-live="polite" aria-busy="true" aria-label="Loading page">
      <HbcSkeleton variant="kpi-grid" columns={3} />
      <HbcSkeleton variant="table" rows={4} columns={4} />
    </div>
  );
};
