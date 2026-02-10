import * as React from 'react';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { SlideDrawer } from './SlideDrawer';

interface IKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
  drillDown?: React.ReactNode;
}

export const KPICard: React.FC<IKPICardProps> = ({ title, value, subtitle, icon, trend, onClick, drillDown }) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isClickable = !!(onClick || drillDown);

  const handleClick = (): void => {
    if (onClick) {
      onClick();
    } else if (drillDown) {
      setDrawerOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={isClickable ? handleClick : undefined}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: ELEVATION.level1,
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'box-shadow 0.2s',
          minWidth: '200px',
        }}
        onMouseEnter={e => isClickable && ((e.currentTarget as HTMLElement).style.boxShadow = ELEVATION.level2)}
        onMouseLeave={e => isClickable && ((e.currentTarget as HTMLElement).style.boxShadow = ELEVATION.level1)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: HBC_COLORS.navy }}>{value}</div>
            {subtitle && <div style={{ fontSize: '12px', color: HBC_COLORS.gray400, marginTop: '4px' }}>{subtitle}</div>}
            {trend && (
              <div style={{ fontSize: '12px', marginTop: '6px', color: trend.isPositive ? HBC_COLORS.success : HBC_COLORS.error }}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </div>
            )}
          </div>
          {icon && <div style={{ color: HBC_COLORS.gray400 }}>{icon}</div>}
        </div>
      </div>
      {drillDown && (
        <SlideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={title}>
          {drillDown}
        </SlideDrawer>
      )}
    </>
  );
};
