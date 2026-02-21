import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useAppContext, type ProjectHealthStatus } from '../contexts/AppContext';
import { getStageLabel } from '@hbc/sp-services';
import { HBC_COLORS } from '../../theme/tokens';

const useStyles = makeStyles({
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('14px'),
    backgroundColor: 'rgba(255,255,255,0.12)',
    fontSize: '12px',
    fontWeight: '500',
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '2px',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
    },
  },
  healthDot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
  projectText: {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stageText: {
    opacity: 0.7,
    fontSize: '11px',
  },
  skeleton: {
    width: '120px',
    height: '20px',
    ...shorthands.borderRadius('10px'),
    backgroundColor: 'rgba(255,255,255,0.15)',
    animationName: {
      '0%': { opacity: 0.5 },
      '50%': { opacity: 0.8 },
      '100%': { opacity: 0.5 },
    },
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationTimingFunction: tokens.curveEasyEase,
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: '0s',
    },
  },
});

const HEALTH_DOT_COLORS: Record<ProjectHealthStatus, string> = {
  Green: HBC_COLORS.success,
  Yellow: HBC_COLORS.warning,
  Red: HBC_COLORS.error,
};

export const MacBarStatusPill: React.FC = () => {
  const styles = useStyles();
  const { selectedProject, isProjectSwitching } = useAppContext();

  if (!selectedProject) return null;

  if (isProjectSwitching) {
    return <div className={styles.skeleton} aria-label="Loading project status..." />;
  }

  const health = selectedProject.overallHealth;

  return (
    <div
      className={styles.pill}
      role="status"
      aria-label={`Current project: ${selectedProject.projectName}`}
      title={`${selectedProject.projectName} (${selectedProject.projectCode}) - ${getStageLabel(selectedProject.stage)}`}
    >
      {health && (
        <span
          className={styles.healthDot}
          style={{ backgroundColor: HEALTH_DOT_COLORS[health] }}
          aria-label={`Health: ${health}`}
        />
      )}
      <span className={styles.projectText}>{selectedProject.projectName}</span>
      <span className={styles.stageText}>({getStageLabel(selectedProject.stage)})</span>
    </div>
  );
};
