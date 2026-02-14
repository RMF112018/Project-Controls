import * as React from 'react';
import { Spinner, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { SPACING } from '../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    ...shorthands.padding(SPACING.xxl),
    ...shorthands.gap(SPACING.md),
  },
  label: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
});

/**
 * Full-page loading fallback for React.lazy() Suspense boundaries.
 * Centered spinner matching HBC theme. Used as the Suspense fallback
 * for all lazy-loaded route chunks.
 */
export const PageLoader: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <Spinner size="large" />
      <span className={styles.label}>Loading page...</span>
    </div>
  );
};
