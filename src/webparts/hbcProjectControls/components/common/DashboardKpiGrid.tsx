import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { KPICard } from '../shared/KPICard';
import { SkeletonLoader } from '../shared/SkeletonLoader';

// P2.1: Reusable KPI grid extracted from ProjectHubDashboardPage and DepartmentTrackingPage

export interface IDashboardKpiItem {
  key: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  badge?: string;
  onClick?: () => void;
  drillDown?: React.ReactNode;
}

export interface IDashboardKpiGridProps {
  items: IDashboardKpiItem[];
  isLoading?: boolean;
  loadingColumns?: number;
  ariaLabel?: string;
}

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
});

export const DashboardKpiGrid: React.FC<IDashboardKpiGridProps> = ({
  items,
  isLoading,
  loadingColumns = 5,
  ariaLabel = 'Key performance indicators',
}) => {
  const styles = useStyles();

  if (isLoading) {
    return <SkeletonLoader variant="table" rows={1} columns={loadingColumns} />;
  }

  return (
    <div className={styles.grid} role="region" aria-label={ariaLabel} aria-live="polite">
      {items.map((item) => (
        <KPICard
          key={item.key}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          trend={item.trend}
          badge={item.badge}
          onClick={item.onClick}
          drillDown={item.drillDown}
        />
      ))}
    </div>
  );
};
