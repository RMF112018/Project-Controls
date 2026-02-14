import * as React from 'react';
import { Stage, STAGE_COLORS, STAGE_ORDER, getStageLabel, isArchived } from '@hbc/sp-services';
import { HBC_COLORS } from '../../theme/tokens';

interface IStageIndicatorProps {
  currentStage: Stage;
  size?: 'small' | 'medium';
}

const ACTIVE_STAGES = STAGE_ORDER.filter(s => !isArchived(s as Stage));

export const StageIndicator: React.FC<IStageIndicatorProps> = ({ currentStage, size = 'medium' }) => {
  const currentIndex = ACTIVE_STAGES.indexOf(currentStage);
  const isArchivedStage = isArchived(currentStage);
  const dotSize = size === 'small' ? 10 : 14;
  const lineHeight = size === 'small' ? 2 : 3;

  if (isArchivedStage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: STAGE_COLORS[currentStage] || HBC_COLORS.gray400,
        }} />
        <span style={{ fontSize: size === 'small' ? '11px' : '13px', color: HBC_COLORS.gray500 }}>
          {getStageLabel(currentStage)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {ACTIVE_STAGES.map((stage, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const color = isCurrent
          ? (STAGE_COLORS[stage] || HBC_COLORS.gray400)
          : isPast ? HBC_COLORS.success : HBC_COLORS.gray200;

        return (
          <React.Fragment key={stage}>
            <div
              title={getStageLabel(stage as Stage)}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                backgroundColor: color,
                border: isCurrent ? `2px solid ${color}` : 'none',
                boxShadow: isCurrent ? `0 0 0 3px ${color}33` : 'none',
                flexShrink: 0,
              }}
            />
            {idx < ACTIVE_STAGES.length - 1 && (
              <div style={{
                height: lineHeight,
                flex: 1,
                minWidth: size === 'small' ? '6px' : '12px',
                backgroundColor: idx < currentIndex ? HBC_COLORS.success : HBC_COLORS.gray200,
                borderRadius: '1px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
