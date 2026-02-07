import * as React from 'react';

interface IStatusBadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<IStatusBadgeProps> = ({ label, color, backgroundColor, size = 'small' }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: size === 'small' ? '2px 8px' : '4px 12px',
    borderRadius: '12px',
    fontSize: size === 'small' ? '11px' : '13px',
    fontWeight: 500,
    color,
    backgroundColor,
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);
