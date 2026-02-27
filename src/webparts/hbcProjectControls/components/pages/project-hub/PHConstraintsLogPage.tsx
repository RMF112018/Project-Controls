import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type {
  ProjectHubConstraint as IConstraint,
  ProjectHubConstraintPriority as ConstraintPriority,
  ProjectHubConstraintStatus as ConstraintStatus,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_CONSTRAINTS: IConstraint[] = [
  { id: 'c-1', description: 'Structural steel delivery delayed by fabricator', category: 'Material', priority: 'Critical', status: 'In Progress', owner: 'Mike Thompson', dateIdentified: '2026-01-28', targetResolution: '2026-02-28', resolvedDate: null, impact: 'May delay 3rd floor slab by 5 days if not resolved.' },
  { id: 'c-2', description: 'Electrical room relocation per owner directive', category: 'Design', priority: 'High', status: 'Open', owner: 'Sarah Chen', dateIdentified: '2026-02-05', targetResolution: '2026-03-01', resolvedDate: null, impact: 'Requires revised MEP coordination drawings.' },
  { id: 'c-3', description: 'Adjacent property access for crane swing', category: 'Site Access', priority: 'High', status: 'In Progress', owner: 'David Rodriguez', dateIdentified: '2026-01-15', targetResolution: '2026-02-20', resolvedDate: null, impact: 'Crane path restricted until easement signed.' },
  { id: 'c-4', description: 'Fire sprinkler shop drawings pending approval', category: 'Submittal', priority: 'Medium', status: 'Open', owner: 'Mike Thompson', dateIdentified: '2026-02-10', targetResolution: '2026-03-10', resolvedDate: null, impact: 'Sprinkler rough-in cannot begin until approved.' },
  { id: 'c-5', description: 'Concrete batch plant scheduling conflict', category: 'Material', priority: 'Medium', status: 'Resolved', owner: 'David Rodriguez', dateIdentified: '2026-01-05', targetResolution: '2026-01-20', resolvedDate: '2026-01-18', impact: 'Resolved via alternate supplier agreement.' },
  { id: 'c-6', description: 'Weather delay: tropical storm warning', category: 'Weather', priority: 'Low', status: 'Closed', owner: 'Mike Thompson', dateIdentified: '2026-01-10', targetResolution: '2026-01-12', resolvedDate: '2026-01-11', impact: 'Half-day delay. Made up in subsequent week.' },
  { id: 'c-7', description: 'Owner RFI response pending for curtain wall spec', category: 'Owner Decision', priority: 'High', status: 'Open', owner: 'Sarah Chen', dateIdentified: '2026-02-12', targetResolution: '2026-02-26', resolvedDate: null, impact: 'Curtain wall procurement cannot proceed.' },
  { id: 'c-8', description: 'Underground utility conflict discovered', category: 'Site Conditions', priority: 'Medium', status: 'Resolved', owner: 'David Rodriguez', dateIdentified: '2025-12-15', targetResolution: '2026-01-05', resolvedDate: '2025-12-28', impact: 'Rerouted storm drain. No schedule impact.' },
];

const PRIORITY_CONFIG: Record<ConstraintPriority, { color: string; bg: string }> = {
  'Critical': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'High': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Medium': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'Low': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
};

const STATUS_CONFIG: Record<ConstraintStatus, { color: string; bg: string }> = {
  'Open': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'In Progress': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'Resolved': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Closed': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
};

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  tableHead: {
    backgroundColor: HBC_COLORS.gray50,
  },
  th: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'left' as const,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    ...shorthands.borderBottom('2px', 'solid', HBC_COLORS.gray200),
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
  },
  tdDescription: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
    maxWidth: '320px',
  },
  impactCard: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  impactItem: {
    display: 'grid',
    gridTemplateColumns: '4px 1fr',
    ...shorthands.gap('12px'),
    ...shorthands.padding('10px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  impactBar: {
    width: '4px',
    ...shorthands.borderRadius('2px'),
    alignSelf: 'stretch',
  },
  impactContent: {
    display: 'grid',
    ...shorthands.gap('2px'),
  },
  impactTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  impactDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const PHConstraintsLogPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const openCount = MOCK_CONSTRAINTS.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  const criticalCount = MOCK_CONSTRAINTS.filter(c => c.priority === 'Critical' && c.status !== 'Closed' && c.status !== 'Resolved').length;
  const resolvedCount = MOCK_CONSTRAINTS.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const activeConstraints = MOCK_CONSTRAINTS.filter(c => c.status === 'Open' || c.status === 'In Progress');

  return (
    <div className={styles.container}>
      <PageHeader
        title="Constraints Log"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Total Constraints" value={MOCK_CONSTRAINTS.length} />
        <KPICard
          title="Open / In Progress"
          value={openCount}
          subtitle={`${criticalCount} critical`}
        />
        <KPICard
          title="Resolved / Closed"
          value={resolvedCount}
          subtitle={`${Math.round((resolvedCount / MOCK_CONSTRAINTS.length) * 100)}% resolution rate`}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Avg. Resolution Time"
          value="11 days"
          subtitle="From identification to resolution"
        />
      </div>

      <HbcCard title="All Constraints" subtitle="Complete constraint tracking log">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Description</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Priority</th>
              <th className={styles.th}>Owner</th>
              <th className={styles.th}>Identified</th>
              <th className={styles.th}>Target</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CONSTRAINTS.map((constraint) => {
              const priorityCfg = PRIORITY_CONFIG[constraint.priority];
              const statusCfg = STATUS_CONFIG[constraint.status];
              return (
                <tr key={constraint.id}>
                  <td className={styles.tdDescription}>{constraint.description}</td>
                  <td className={styles.td}>{constraint.category}</td>
                  <td className={styles.td}>
                    <StatusBadge label={constraint.priority} color={priorityCfg.color} backgroundColor={priorityCfg.bg} />
                  </td>
                  <td className={styles.td}>{constraint.owner}</td>
                  <td className={styles.td}>{new Date(constraint.dateIdentified).toLocaleDateString()}</td>
                  <td className={styles.td}>{new Date(constraint.targetResolution).toLocaleDateString()}</td>
                  <td className={styles.td}>
                    <StatusBadge label={constraint.status} color={statusCfg.color} backgroundColor={statusCfg.bg} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </HbcCard>

      <HbcCard title="Active Constraint Impact" subtitle="Impact assessment for open and in-progress constraints">
        <div className={styles.impactCard}>
          {activeConstraints.map((constraint) => {
            const priorityCfg = PRIORITY_CONFIG[constraint.priority];
            return (
              <div key={constraint.id} className={styles.impactItem}>
                <div className={styles.impactBar} style={{ backgroundColor: priorityCfg.color }} />
                <div className={styles.impactContent}>
                  <span className={styles.impactTitle}>{constraint.description}</span>
                  <span className={styles.impactDesc}>{constraint.impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </HbcCard>
    </div>
  );
};
