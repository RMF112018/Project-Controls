import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import type { IBambooHRDirectory } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  departmentSection: {
    ...shorthands.margin('0', '0', '24px'),
  },
  departmentHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.margin('0', '0', '12px'),
  },
  departmentName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin('0'),
  },
  divisionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '0', '0', '16px'),
  },
  divisionLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin('0', '0', '4px'),
  },
  countText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  noData: {
    ...shorthands.padding('24px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
});

export const BambooOrgChartPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [directory, setDirectory] = React.useState<IBambooHRDirectory | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService
      .getBambooDirectory()
      .then(result => setDirectory(result))
      .catch(() => setDirectory(null))
      .finally(() => setLoading(false));
  }, [dataService]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Organization Chart" subtitle="Department and division structure from BambooHR." />
        <HbcSkeleton variant="card" />
      </div>
    );
  }

  if (!directory || directory.departments.length === 0) {
    return (
      <div>
        <PageHeader title="Organization Chart" subtitle="Department and division structure from BambooHR." />
        <p className={styles.noData}>No organizational data available. Sync from BambooHR first.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Organization Chart" subtitle="Department and division structure from BambooHR." />
      <div className={styles.container}>
        {directory.departments.map(dept => (
          <div key={dept.name} className={styles.departmentSection}>
            <div className={styles.departmentHeader}>
              <h3 className={styles.departmentName}>{dept.name}</h3>
              <Badge appearance="outline">{dept.employeeCount} employees</Badge>
            </div>
            <div className={styles.divisionGrid}>
              {dept.divisions.map(divName => (
                <HbcCard key={divName} title={divName}>
                  <span className={styles.countText}>Division</span>
                </HbcCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
