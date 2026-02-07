import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';

interface IEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<IEmptyStateProps> = ({ title, description, icon, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center' }}>
    {icon && <div style={{ marginBottom: '16px', color: HBC_COLORS.gray400, fontSize: '48px' }}>{icon}</div>}
    <h3 style={{ margin: '0 0 8px 0', color: HBC_COLORS.gray700, fontSize: '18px' }}>{title}</h3>
    {description && <p style={{ margin: '0 0 16px 0', color: HBC_COLORS.gray500, fontSize: '14px', maxWidth: '400px' }}>{description}</p>}
    {action}
  </div>
);
