import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { Stage, STAGE_COLORS, getStageLabel } from '@hbc/sp-services';

const useStyles = makeStyles({
  badgeSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '500',
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
  },
  badgeMedium: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF',
    whiteSpace: 'nowrap',
  },
});

interface IStageBadgeProps {
  stage: Stage;
  size?: 'small' | 'medium';
}

export const StageBadge: React.FC<IStageBadgeProps> = ({ stage, size = 'small' }) => {
  const styles = useStyles();
  const color = STAGE_COLORS[stage] || '#6B7280';
  return (
    <span
      className={size === 'small' ? styles.badgeSmall : styles.badgeMedium}
      style={{ backgroundColor: color }}
    >
      {getStageLabel(stage)}
    </span>
  );
};
