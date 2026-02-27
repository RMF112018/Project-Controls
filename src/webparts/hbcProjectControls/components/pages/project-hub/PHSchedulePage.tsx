import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  Calendar24Regular,
  ArrowTrending24Regular,
  Warning24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import type { IMilestone } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_MILESTONES: IMilestone[] = [
  { name: 'Notice to Proceed', plannedDate: '2025-09-15', forecastDate: '2025-09-15', status: 'Complete' },
  { name: 'Foundation Complete', plannedDate: '2025-12-20', forecastDate: '2025-12-18', status: 'Complete' },
  { name: 'Structure Topped Out', plannedDate: '2026-03-15', forecastDate: '2026-03-18', status: 'On Track' },
  { name: 'Exterior Envelope Complete', plannedDate: '2026-05-30', forecastDate: '2026-06-05', status: 'At Risk' },
  { name: 'MEP Rough-In Complete', plannedDate: '2026-07-15', forecastDate: '2026-07-22', status: 'At Risk' },
  { name: 'Substantial Completion', plannedDate: '2026-10-01', forecastDate: '2026-10-08', status: 'On Track' },
  { name: 'Final Completion', plannedDate: '2026-11-15', forecastDate: '2026-11-22', status: 'On Track' },
];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  'Complete': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'On Track': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'At Risk': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Behind': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
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
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  scheduleV2Banner: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: HBC_COLORS.infoLight,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', HBC_COLORS.info),
  },
  bannerIcon: {
    color: HBC_COLORS.info,
    flexShrink: 0,
  },
  bannerText: {
    fontSize: tokens.fontSizeBase200,
    color: HBC_COLORS.navy,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  label: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  value: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

export const PHSchedulePage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const completedMilestones = MOCK_MILESTONES.filter(m => m.status === 'Complete').length;
  const atRiskMilestones = MOCK_MILESTONES.filter(m => m.status === 'At Risk').length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Schedule"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.scheduleV2Banner}>
        <Info24Regular className={styles.bannerIcon} />
        <span className={styles.bannerText}>
          <strong>Schedule v2 Integration Coming Soon.</strong> This page will integrate with
          the full Schedule v2 module including Gantt chart, critical path analysis, activity
          tracking, and schedule import (CSV, XER, XML). Currently showing milestone summary view.
        </span>
      </div>

      <div className={styles.kpiGrid}>
        <KPICard
          title="Schedule Variance"
          value="+3 days"
          subtitle="Ahead of baseline"
          trend={{ value: 2.1, isPositive: true }}
          icon={<ArrowTrending24Regular />}
        />
        <KPICard
          title="% Complete"
          value="47%"
          subtitle="Based on earned value"
          icon={<Calendar24Regular />}
        />
        <KPICard
          title="Milestones Complete"
          value={`${completedMilestones}/${MOCK_MILESTONES.length}`}
          subtitle={`${atRiskMilestones} at risk`}
        />
        <KPICard
          title="Critical Path Float"
          value="5 days"
          subtitle="Total float on longest path"
          icon={<Warning24Regular />}
        />
      </div>

      <HbcCard title="Key Milestones" subtitle="Project milestone tracking with planned vs. forecast dates">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Milestone</th>
              <th className={styles.th}>Planned Date</th>
              <th className={styles.th}>Forecast Date</th>
              <th className={styles.th}>Variance (Days)</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MILESTONES.map((ms) => {
              const planned = new Date(ms.plannedDate);
              const forecast = new Date(ms.forecastDate);
              const varianceDays = Math.round((forecast.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
              const colors = STATUS_COLORS[ms.status] || STATUS_COLORS['On Track'];
              return (
                <tr key={ms.name}>
                  <td className={styles.td} style={{ fontWeight: tokens.fontWeightSemibold as string }}>{ms.name}</td>
                  <td className={styles.td}>{planned.toLocaleDateString()}</td>
                  <td className={styles.td}>{forecast.toLocaleDateString()}</td>
                  <td className={styles.td} style={{ color: varianceDays > 0 ? HBC_COLORS.warning : HBC_COLORS.success }}>
                    {varianceDays > 0 ? `+${varianceDays}` : varianceDays === 0 ? 'On Time' : `${varianceDays}`}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.statusBadge} style={{ color: colors.color, backgroundColor: colors.bg }}>
                      {ms.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </HbcCard>

      <div className={styles.summaryGrid}>
        <HbcCard title="Schedule Details" subtitle="Current schedule information">
          <div className={styles.infoRow}>
            <span className={styles.label}>Baseline Schedule</span>
            <span className={styles.value}>Rev. 3 (Jan 2026)</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Last Schedule Update</span>
            <span className={styles.value}>Feb 18, 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Total Activities</span>
            <span className={styles.value}>1,247</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Critical Activities</span>
            <span className={styles.value}>89</span>
          </div>
        </HbcCard>

        <HbcCard title="Look-Ahead (2 Weeks)" subtitle="Upcoming critical activities">
          <div className={styles.infoRow}>
            <span className={styles.label}>3rd Floor Slab Pour</span>
            <span className={styles.value}>Feb 25, 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Tower Crane Dismantle</span>
            <span className={styles.value}>Mar 01, 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Curtain Wall Install Start</span>
            <span className={styles.value}>Mar 03, 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Fire Sprinkler Rough-In</span>
            <span className={styles.value}>Mar 05, 2026</span>
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
