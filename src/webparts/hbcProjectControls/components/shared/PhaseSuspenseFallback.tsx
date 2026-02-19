import * as React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { SkeletonLoader } from './SkeletonLoader';
import { PageLoader } from './PageLoader';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
  },
});

export interface IPhaseSuspenseFallbackProps {
  label?: string;
}

export const PhaseSuspenseFallback: React.FC<IPhaseSuspenseFallbackProps> = ({
  label = 'Loading module...',
}) => {
  const styles = useStyles();

  return (
    <div className={styles.container} aria-live="polite" aria-busy="true">
      <Text>{label}</Text>
      <SkeletonLoader variant="kpi-grid" columns={3} />
      <SkeletonLoader variant="table" rows={5} columns={4} />
      <PageLoader />
    </div>
  );
};

