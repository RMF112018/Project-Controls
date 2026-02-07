import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';

interface IPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export const PageHeader: React.FC<IPageHeaderProps> = ({ title, subtitle, actions, breadcrumb }) => (
  <div style={{ marginBottom: '24px' }}>
    {breadcrumb && <div style={{ marginBottom: '8px' }}>{breadcrumb}</div>}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: HBC_COLORS.navy }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: HBC_COLORS.gray500 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
    </div>
  </div>
);
