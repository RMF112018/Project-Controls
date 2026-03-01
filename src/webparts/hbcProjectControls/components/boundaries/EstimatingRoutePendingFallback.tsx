/**
 * Phase 1 Task 2 — Form-oriented pending fallback for Estimating routes.
 *
 * Renders a KPI grid (4 cards) + form skeleton (6 rows) that matches the
 * visual structure of EstimatingKickoffPage, PostBidAutopsyPage, and
 * PHEstimatePage. Used as `pendingComponent` on estimating routes so users
 * see a relevant placeholder during `ensureQueryData` prefetch.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { HbcSkeleton } from '../shared/HbcSkeleton';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '300px',
    ...shorthands.gap(tokens.spacingVerticalL),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
});

export const EstimatingRoutePendingFallback: React.FC = () => {
  const styles = useStyles();
  return (
    <div
      className={styles.container}
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading estimating data"
    >
      <HbcSkeleton variant="kpi-grid" columns={4} />
      <HbcSkeleton variant="form" rows={6} />
    </div>
  );
};
