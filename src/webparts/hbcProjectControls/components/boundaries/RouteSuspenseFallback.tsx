import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { HbcSkeleton } from '../shared/HbcSkeleton';

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
  return (
    <div className={styles.container} aria-live="polite" aria-busy="true" aria-label="Loading page">
      <HbcSkeleton variant="kpi-grid" columns={3} />
      <HbcSkeleton variant="table" rows={4} columns={4} />
    </div>
  );
};
