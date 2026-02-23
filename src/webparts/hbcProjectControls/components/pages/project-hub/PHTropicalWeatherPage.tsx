import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  alertBanner: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.borderLeft('4px', 'solid', HBC_COLORS.warning),
    backgroundColor: HBC_COLORS.warningLight,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
  },
  timelineGrid: {
    display: 'grid',
    ...shorthands.gap('0'),
  },
  timelineRow: {
    display: 'flex',
    ...shorthands.gap('16px'),
    ...shorthands.padding('14px', '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
  },
  timelineBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderRadius('4px'),
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    flexShrink: 0,
    minWidth: '60px',
    height: 'fit-content',
  },
  timelineContent: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  timelineTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
  },
  timelineText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  checklistGroup: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('10px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: HBC_COLORS.gray50,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
  checkBox: {
    width: '18px',
    height: '18px',
    ...shorthands.borderRadius('3px'),
    ...shorthands.border('2px', 'solid', HBC_COLORS.gray300),
    flexShrink: 0,
    marginTop: '1px',
  },
});

const PREPARATION_TIMELINE = [
  { hours: '72 hrs', title: 'Tropical Storm Watch', text: 'Begin monitoring. Review site-specific hurricane plan. Inventory securing materials and fuel supplies.', color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  { hours: '48 hrs', title: 'Hurricane Watch', text: 'Begin securing loose materials, scaffolding, and temporary structures. Back up all project data offsite. Fuel all generators and vehicles.', color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  { hours: '24 hrs', title: 'Hurricane Warning', text: 'Complete all securing operations. Weathervane or lower cranes per manufacturer specs. Remove or secure all signage and temporary fencing.', color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  { hours: '0 hrs', title: 'Site Shutdown', text: 'Evacuate all personnel. Secure the site perimeter. Confirm all personnel have reported to safe locations. Activate communication tree.', color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
];

const POST_STORM_ITEMS = [
  'Do not return to the site until authorities confirm it is safe',
  'Conduct a thorough damage assessment with photographs and video',
  'Check all structures for wind and water damage before entry',
  'Verify electrical systems are de-energized before inspection',
  'Document all damage for insurance claims with date-stamped photos',
  'Coordinate with utility companies for service restoration',
  'Prepare a recovery schedule and communicate to all stakeholders',
  'Conduct environmental assessment for spills or contamination',
];

export const PHTropicalWeatherPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Tropical Weather Guide"
        subtitle={projectLabel}
      />

      <div className={styles.alertBanner}>
        Hurricane season runs June 1 through November 30. All active project sites in hurricane-prone
        regions must maintain an updated tropical weather preparedness plan and conduct a pre-season
        readiness review no later than May 15.
      </div>

      <HbcCard title="Preparation Timeline" subtitle="Action triggers by storm proximity">
        <div className={styles.timelineGrid}>
          {PREPARATION_TIMELINE.map(item => (
            <div key={item.hours} className={styles.timelineRow}>
              <span
                className={styles.timelineBadge}
                style={{ backgroundColor: item.bg, color: item.color }}
              >
                {item.hours}
              </span>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>{item.title}</div>
                <div className={styles.timelineText}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Post-Storm Recovery Checklist" subtitle={`${POST_STORM_ITEMS.length} items`}>
        <div className={styles.checklistGroup}>
          {POST_STORM_ITEMS.map(item => (
            <div key={item} className={styles.checklistItem}>
              <div className={styles.checkBox} />
              {item}
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
