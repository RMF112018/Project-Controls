import * as React from 'react';
import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { ErrorComponentProps } from '@tanstack/react-router';

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
