import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { IBestPractice } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  practiceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  practiceCard: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderLeft('3px', 'solid', HBC_COLORS.success),
  },
  practiceTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
    marginBottom: '8px',
  },
  practiceText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.margin('0'),
  },
  categoryBadge: {
    display: 'inline-flex',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '8px',
  },
  lessonsList: {
    display: 'grid',
    ...shorthands.gap('10px'),
  },
  lessonItem: {
    display: 'flex',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    alignItems: 'flex-start',
  },
  lessonIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: HBC_COLORS.successLight,
    color: HBC_COLORS.success,
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  lessonContent: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  lessonTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase200,
  },
  lessonText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
});

const BEST_PRACTICES: IBestPractice[] = [
  { title: 'Pre-Pour Walkdowns', category: 'Concrete', categoryColor: HBC_COLORS.info, categoryBg: HBC_COLORS.infoLight, text: 'Conduct a complete pre-pour walkdown with the superintendent, engineer, and concrete subcontractor 24 hours before every placement. Document findings with photographs.' },
  { title: 'Three-Week Look-Ahead', category: 'Scheduling', categoryColor: HBC_COLORS.warning, categoryBg: HBC_COLORS.warningLight, text: 'Maintain a rolling three-week look-ahead schedule updated weekly. Include manpower projections, material deliveries, and inspection milestones.' },
  { title: 'Daily Photo Documentation', category: 'Documentation', categoryColor: HBC_COLORS.success, categoryBg: HBC_COLORS.successLight, text: 'Capture comprehensive daily progress photos from consistent vantage points. Include before/after photos for all concealed work before cover-up.' },
  { title: 'Subcontractor Kick-Off', category: 'Coordination', categoryColor: HBC_COLORS.navy, categoryBg: HBC_COLORS.gray100, text: 'Hold a dedicated kick-off meeting with each subcontractor before mobilization. Review scope, safety requirements, logistics, and quality expectations.' },
  { title: 'Mock-Up Requirements', category: 'Quality', categoryColor: HBC_COLORS.info, categoryBg: HBC_COLORS.infoLight, text: 'Require mock-ups for all visible finish work including masonry, curtain wall, ceiling systems, and specialty flooring. Obtain owner approval before proceeding.' },
  { title: 'Weekly Safety Audits', category: 'Safety', categoryColor: HBC_COLORS.error, categoryBg: HBC_COLORS.errorLight, text: 'Conduct formal weekly safety audits with documented scores. Share results with all subcontractors and track trends. Address deficiencies within 24 hours.' },
];

const LESSONS_LEARNED = [
  { title: 'Early Utility Coordination', text: 'Engage utility companies at least 60 days before needed. Power company lead times frequently exceed initial estimates.' },
  { title: 'Elevator Lead Times', text: 'Order elevators within 30 days of contract execution. Manufacturing lead times of 16-24 weeks impact overall schedule.' },
  { title: 'Fire Stopping Documentation', text: 'Photograph all fire stopping installations before concealment. Missing documentation causes costly re-opening during final inspections.' },
  { title: 'Retainage Release Process', text: 'Begin collecting closeout documents 60 days before substantial completion. Late documentation delays final retainage release.' },
];

export const PHBestPracticesPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Best Practices"
        subtitle={projectLabel}
      />

      <HbcCard title="Construction Best Practices" subtitle={`${BEST_PRACTICES.length} recommended practices`}>
        <div className={styles.practiceGrid}>
          {BEST_PRACTICES.map(practice => (
            <div key={practice.title} className={styles.practiceCard}>
              <span
                className={styles.categoryBadge}
                style={{ backgroundColor: practice.categoryBg, color: practice.categoryColor }}
              >
                {practice.category}
              </span>
              <div className={styles.practiceTitle}>{practice.title}</div>
              <p className={styles.practiceText}>{practice.text}</p>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Lessons Learned" subtitle="Key takeaways from previous projects">
        <div className={styles.lessonsList}>
          {LESSONS_LEARNED.map((lesson, index) => (
            <div key={lesson.title} className={styles.lessonItem}>
              <div className={styles.lessonIcon}>{index + 1}</div>
              <div className={styles.lessonContent}>
                <div className={styles.lessonTitle}>{lesson.title}</div>
                <div className={styles.lessonText}>{lesson.text}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
