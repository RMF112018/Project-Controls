import * as React from 'react';
import { Stage } from '../../models/enums';
import { STAGE_COLORS } from '../../utils/constants';
import { getStageLabel } from '../../utils/stageEngine';

interface IStageBadgeProps {
  stage: Stage;
  size?: 'small' | 'medium';
}

export const StageBadge: React.FC<IStageBadgeProps> = ({ stage, size = 'small' }) => {
  const color = STAGE_COLORS[stage] || '#6B7280';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'small' ? '2px 8px' : '4px 12px',
      borderRadius: '12px',
      fontSize: size === 'small' ? '11px' : '13px',
      fontWeight: 500,
      color: '#FFFFFF',
      backgroundColor: color,
      whiteSpace: 'nowrap',
    }}>
      {getStageLabel(stage)}
    </span>
  );
};
