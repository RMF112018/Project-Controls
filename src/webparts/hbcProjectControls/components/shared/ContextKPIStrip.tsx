import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useAppContext, type ProjectHealthStatus } from '../contexts/AppContext';
import { useDataMart } from '../hooks/useDataMart';
import { HBC_COLORS } from '../../theme/tokens';

const useStyles = makeStyles({
  strip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('6px', '12px'),
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  kpiItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    whiteSpace: 'nowrap',
  },
  kpiLabel: {
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    fontSize: '10px',
    letterSpacing: '0.3px',
  },
  kpiValue: {
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    fontSize: '12px',
  },
  healthDot: {
    width: '6px',
    height: '6px',
    ...shorthands.borderRadius('50%'),
    display: 'inline-block',
  },
});

const HEALTH_COLORS: Record<ProjectHealthStatus, string> = {
  Green: HBC_COLORS.success,
  Yellow: HBC_COLORS.warning,
  Red: HBC_COLORS.error,
};

function formatCompact(value: number | undefined): string {
  if (value === undefined || value === null) return '--';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

/**
 * Compact inline KPI strip shown below project picker in sidebar.
 * Displays Contract Value, % Complete, and Health when a project is selected.
 */
export const ContextKPIStrip: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const { records } = useDataMart();

  const dataMart = React.useMemo(() => {
    if (!selectedProject) return undefined;
    return records.find(r => r.projectCode === selectedProject.projectCode);
  }, [records, selectedProject]);

  if (!selectedProject) return null;

  const contractValue = dataMart?.currentContractValue ?? selectedProject.projectValue;
  const percentComplete = dataMart?.percentComplete;
  const health = dataMart?.overallHealth ?? selectedProject.overallHealth;

  return (
    <div className={styles.strip} role="status" aria-label="Project KPI summary">
      <div className={styles.kpiItem}>
        <span className={styles.kpiLabel}>Contract</span>
        <span className={styles.kpiValue}>{formatCompact(contractValue)}</span>
      </div>
      <div className={styles.kpiItem}>
        <span className={styles.kpiLabel}>Complete</span>
        <span className={styles.kpiValue}>
          {percentComplete !== undefined ? `${percentComplete}%` : '--'}
        </span>
      </div>
      <div className={styles.kpiItem}>
        {health && (
          <span
            className={styles.healthDot}
            style={{ backgroundColor: HEALTH_COLORS[health] }}
          />
        )}
        <span className={styles.kpiValue}>
          {health ?? '--'}
        </span>
      </div>
    </div>
  );
};
