import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Warning24Regular,
  Circle24Regular,
} from '@fluentui/react-icons';
import {
  formatCurrency,
  type IReviewSection,
  type SectionStatus,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_REVIEW_SECTIONS: IReviewSection[] = [
  {
    title: 'Executive Summary',
    status: 'On Track',
    items: [
      { label: 'Overall Project Status', value: 'Green' },
      { label: 'Period', value: 'February 2026' },
      { label: 'Reporting PM', value: 'Mike Thompson' },
      { label: 'Review Date', value: 'Feb 20, 2026' },
    ],
    commentary: 'Project is progressing well. Structural steel erection completed on the second floor. Third floor slab pour scheduled for end of February. One material delivery constraint being actively managed with the steel fabricator. No safety incidents this period.',
  },
  {
    title: 'Financial Status',
    status: 'On Track',
    items: [
      { label: 'Contract Value', value: formatCurrency(16_690_000) },
      { label: 'Approved COs to Date', value: formatCurrency(690_000) },
      { label: 'Projected Final Cost', value: formatCurrency(16_625_000) },
      { label: 'Projected Profit', value: formatCurrency(65_000) },
      { label: 'Billings to Date', value: formatCurrency(7_850_000) },
      { label: 'Collections Rate', value: '96%' },
    ],
    commentary: 'Financial performance is on track. Buyout savings of $195K realized to date. Contingency balance of $185K remains. Steel price escalation being monitored but currently within allowance.',
  },
  {
    title: 'Schedule Status',
    status: 'Attention',
    items: [
      { label: 'Schedule Variance', value: '+3 days ahead' },
      { label: '% Complete', value: '47%' },
      { label: 'Critical Path Float', value: '5 days' },
      { label: 'Milestones On Track', value: '5 of 7' },
      { label: 'Weather Days Used', value: '4 of 12' },
    ],
    commentary: 'Schedule shows 3 days ahead on baseline. However, structural steel delivery delay (5-day risk) and pending curtain wall RFI response may impact exterior envelope milestone. Two-week look-ahead focuses on 3rd floor slab and crane dismantle.',
  },
  {
    title: 'Safety Performance',
    status: 'On Track',
    items: [
      { label: 'TRIR (Total Recordable)', value: '0.00' },
      { label: 'Days Since Last Incident', value: '142' },
      { label: 'Toolbox Talks Completed', value: '22 this period' },
      { label: 'Safety Inspections', value: '8 completed' },
      { label: 'Open Safety Items', value: '0' },
    ],
    commentary: 'Outstanding safety performance continues. Zero recordable incidents since project start. Weekly toolbox talks maintained. All subcontractors compliant with site safety plan. Crane operation safety plan reviewed and updated for upcoming dismantle.',
  },
  {
    title: 'Key Issues & Action Items',
    status: 'Attention',
    items: [
      { label: 'Open RFIs', value: '12 (3 overdue)' },
      { label: 'Pending Submittals', value: '8' },
      { label: 'Open Constraints', value: '5' },
      { label: 'Pending Change Orders', value: '3 ($320K)' },
    ],
    commentary: 'Three overdue RFIs require escalation to architect. Fire sprinkler shop drawings resubmission due next week. Steel fabricator delivery constraint being tracked daily. Curtain wall specification RFI escalated to owner.',
  },
];

const STATUS_CONFIG: Record<SectionStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  'On Track': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight, icon: <Checkmark24Regular /> },
  'Attention': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight, icon: <Warning24Regular /> },
  'At Risk': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight, icon: <Circle24Regular /> },
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
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    ...shorthands.gap('0'),
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
  commentary: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
    marginTop: '12px',
    ...shorthands.padding('12px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderRadius('6px'),
  },
  statusIcon: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  approvalSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  signatureBlock: {
    display: 'grid',
    ...shorthands.gap('8px'),
    ...shorthands.padding('16px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderRadius('8px'),
  },
  signatureLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  signatureLine: {
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray400),
    height: '32px',
  },
  signatureDate: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
  },
});

export const PHPXReviewPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const onTrackCount = MOCK_REVIEW_SECTIONS.filter(s => s.status === 'On Track').length;
  const attentionCount = MOCK_REVIEW_SECTIONS.filter(s => s.status === 'Attention').length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="PX Review"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="Review Period"
          value="Feb 2026"
          subtitle="Monthly PX review"
        />
        <KPICard
          title="Sections On Track"
          value={`${onTrackCount}/${MOCK_REVIEW_SECTIONS.length}`}
          trend={{ value: 20, isPositive: true }}
        />
        <KPICard
          title="Items Needing Attention"
          value={attentionCount}
          subtitle="Requires PX action"
        />
        <KPICard
          title="Overall Status"
          value="Green"
          subtitle="Favorable trajectory"
        />
      </div>

      {MOCK_REVIEW_SECTIONS.map((section) => {
        const statusCfg = STATUS_CONFIG[section.status];
        return (
          <HbcCard
            key={section.title}
            title={section.title}
            headerActions={
              <StatusBadge label={section.status} color={statusCfg.color} backgroundColor={statusCfg.bg} size="medium" />
            }
          >
            <div className={styles.itemsGrid}>
              {section.items.map((item) => (
                <div key={item.label} className={styles.infoRow}>
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.value}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.commentary}>
              <strong>Commentary:</strong> {section.commentary}
            </div>
          </HbcCard>
        );
      })}

      <HbcCard title="Review Sign-Off" subtitle="PX approval and acknowledgment">
        <div className={styles.approvalSection}>
          <div className={styles.signatureBlock}>
            <span className={styles.signatureLabel}>Project Manager</span>
            <div className={styles.signatureLine} />
            <span className={styles.signatureDate}>Date: _______________</span>
          </div>
          <div className={styles.signatureBlock}>
            <span className={styles.signatureLabel}>Project Executive</span>
            <div className={styles.signatureLine} />
            <span className={styles.signatureDate}>Date: _______________</span>
          </div>
        </div>
      </HbcCard>
    </div>
  );
};
