import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { ELEVATION } from '../../theme/tokens';
import { useEstimatingMotionStyles } from './HbcMotion';

const useStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: ELEVATION.level1,
    marginBottom: tokens.spacingVerticalMNudge,
    ...shorthands.overflow('hidden'),
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...shorthands.padding(tokens.spacingVerticalMNudge, tokens.spacingHorizontalL),
    backgroundColor: 'transparent',
    ...shorthands.border('0'),
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  headerGroup: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalSNudge),
  },
  chevron: {
    display: 'inline-block',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    // Rotation set via inline transform; transition via chevronRotate motion style
  },
  chevronExpanded: {
    transform: 'rotate(90deg)',
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
  },
  subtitle: {
    marginLeft: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  // CSS grid technique replaces max-height: 5000px for consistent animation speed
  contentInner: {
    ...shorthands.overflow('hidden'),
  },
  contentPadding: {
    ...shorthands.padding('0', tokens.spacingHorizontalL, tokens.spacingVerticalM, tokens.spacingHorizontalL),
  },
});

interface ICollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<ICollapsibleSectionProps> = ({
  title,
  subtitle,
  defaultExpanded = true,
  badge,
  children,
}) => {
  const styles = useStyles();
  const motionStyles = useEstimatingMotionStyles();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div className={styles.root}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={styles.trigger}
        aria-expanded={expanded}
      >
        <div className={styles.headerGroup}>
          <span
            className={mergeClasses(
              styles.chevron,
              motionStyles.chevronRotate,
              expanded && styles.chevronExpanded,
            )}
          >
            {'\u25B6'}
          </span>
          <div>
            <span className={styles.title}>{title}</span>
            {subtitle && (
              <span className={styles.subtitle}>{subtitle}</span>
            )}
          </div>
          {badge && <span>{badge}</span>}
        </div>
      </button>
      <div
        className={mergeClasses(
          motionStyles.accordionContent,
          expanded && motionStyles.accordionContentExpanded,
        )}
      >
        <div className={styles.contentInner}>
          <div className={styles.contentPadding}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
