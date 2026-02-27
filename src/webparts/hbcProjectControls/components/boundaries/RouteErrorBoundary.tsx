import * as React from 'react';
import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { ErrorComponentProps } from '@tanstack/react-router';
import AppContext from '../contexts/AppContext';

interface ITelemetryCorrelationCapable {
  newOperationId?: (scope: string) => string;
}

const useStyles = makeStyles({
  root: {
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    ...shorthands.border('1px', 'solid', tokens.colorStatusDangerBorderActive),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorStatusDangerBackground1,
    maxWidth: '640px',
    ...shorthands.margin(tokens.spacingVerticalXL, 'auto'),
  },
  heading: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    margin: '0',
    marginBottom: tokens.spacingVerticalS,
  },
  message: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase300,
    marginBottom: tokens.spacingVerticalM,
  },
  details: {
    marginTop: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  stack: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase100,
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  actions: { marginTop: tokens.spacingVerticalM },
});

export const RouteErrorBoundary: React.FC<ErrorComponentProps> = ({ error, info, reset }) => {
  const styles = useStyles();
  const appContext = React.useContext(AppContext);

  React.useEffect(() => {
    if (!error) {
      return;
    }
    const route = typeof window !== 'undefined'
      ? (window.location.hash.replace(/^#/, '') || '/')
      : '/';
    const workspace = route.replace(/^\//, '').split('/')[0] || 'hub';
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    const message = error instanceof Error ? error.message : String(error);
    const correlationCapable = appContext?.telemetryService as ITelemetryCorrelationCapable | undefined;
    const operationId = correlationCapable?.newOperationId?.('route-lazy-load');
    const isChunkLoadError = /chunk|loading chunk|importing a module script|dynamically imported module/i.test(message);
    const properties = {
      route,
      workspace,
      errorType,
      corr_operation_id: operationId ?? '',
    };

    appContext?.telemetryService.trackEvent({
      name: 'route:lazy:load:failure',
      properties,
      measurements: {
        componentStackLength: info?.componentStack?.length ?? 0,
      },
    });
    if (isChunkLoadError) {
      appContext?.telemetryService.trackEvent({
        name: 'chunk:load:error',
        properties: {
          ...properties,
          message: message.slice(0, 512),
        },
      });
    }
  }, [appContext, error, info?.componentStack]);

  return (
    <div role="alert" className={styles.root}>
      <h2 className={styles.heading}>Something went wrong</h2>
      <p className={styles.message}>
        {error instanceof Error ? error.message : 'An unexpected error occurred.'}
      </p>
      {info?.componentStack ? (
        <details className={styles.details}>
          <summary>Technical details</summary>
          <pre className={styles.stack}>{info.componentStack}</pre>
        </details>
      ) : null}
      <div className={styles.actions}>
        <Button appearance="primary" aria-label="Try loading the page again" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
};
