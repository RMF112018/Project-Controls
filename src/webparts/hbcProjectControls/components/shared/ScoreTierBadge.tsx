import * as React from 'react';
import { getScoreTierLabel, getScoreTierColor } from '../../utils/scoreCalculator';

interface IScoreTierBadgeProps {
  score: number;
  showLabel?: boolean;
}

export const ScoreTierBadge: React.FC<IScoreTierBadgeProps> = ({ score, showLabel = false }) => {
  const color = getScoreTierColor(score);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '24px',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#FFFFFF',
        backgroundColor: color,
      }}>
        {score}
      </span>
      {showLabel && <span style={{ fontSize: '12px', color: '#6B7280' }}>{getScoreTierLabel(score)}</span>}
    </span>
  );
};
