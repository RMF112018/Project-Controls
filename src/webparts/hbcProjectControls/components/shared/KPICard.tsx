import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';

interface IKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  onClick?: () => void;
}

export const KPICard: React.FC<IKPICardProps> = ({ title, value, subtitle, icon, trend, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s',
      minWidth: '200px',
    }}
    onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
    onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
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
);
