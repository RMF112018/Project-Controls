import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { StageBadge } from './StageBadge';
import { useDataMart } from '../hooks/useDataMart';
import { HBC_COLORS, SPACING } from '../../theme/tokens';
import type { ISelectedProject, ProjectHealthStatus } from '../contexts/AppContext';

const useStyles = makeStyles({
  pane: {
    ...shorthands.padding(SPACING.md),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow8,
    width: '240px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  projectName: {
    fontWeight: '600',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '160px',
  },
  projectCode: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  kpiRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('6px', '0'),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':last-child': {
      borderBottom: 'none',
    },
  },
  kpiLabel: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  kpiValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  healthDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    marginRight: '6px',
  },
  noData: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    ...shorthands.padding(SPACING.sm, '0'),
  },
});

const HEALTH_COLORS: Record<ProjectHealthStatus, string> = {
  Green: HBC_COLORS.success,
  Yellow: HBC_COLORS.warning,
  Red: HBC_COLORS.error,
};

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '--';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

interface IProjectPreviewPaneProps {
  project: ISelectedProject;
}

export const ProjectPreviewPane: React.FC<IProjectPreviewPaneProps> = ({ project }) => {
  const styles = useStyles();
  const { records } = useDataMart();

  const dataMart = React.useMemo(() => {
    return records.find(r => r.projectCode === project.projectCode);
  }, [records, project.projectCode]);

  const health = dataMart?.overallHealth ?? project.overallHealth;
  const contractValue = dataMart?.currentContractValue ?? project.projectValue;
  const percentComplete = dataMart?.percentComplete;

  return (
    <div className={styles.pane} role="complementary" aria-label={`Preview for ${project.projectName}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.projectName} title={project.projectName}>
            {project.projectName}
          </div>
          <div className={styles.projectCode}>{project.projectCode}</div>
        </div>
        <StageBadge stage={project.stage} size="small" />
      </div>

      <div className={styles.kpiRow}>
        <span className={styles.kpiLabel}>Contract Value</span>
        <span className={styles.kpiValue}>{formatCurrency(contractValue)}</span>
      </div>
      <div className={styles.kpiRow}>
        <span className={styles.kpiLabel}>Complete</span>
        <span className={styles.kpiValue}>
          {percentComplete !== undefined ? `${percentComplete}%` : '--'}
        </span>
      </div>
      <div className={styles.kpiRow}>
        <span className={styles.kpiLabel}>Health</span>
        <span className={styles.kpiValue}>
          {health ? (
            <>
              <span className={styles.healthDot} style={{ backgroundColor: HEALTH_COLORS[health] }} />
              {health}
            </>
          ) : '--'}
        </span>
      </div>
    </div>
  );
};
