import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HBC_COLORS } from '../../theme/tokens';

interface INavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: INavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Precon Tracking', path: '/precon-tracking' },
  { label: 'Estimate Log', path: '/estimate-log' },
  { label: 'Go/No-Go Tracker', path: '/gonogo-tracker' },
];

export const PreconNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      width: '200px',
      backgroundColor: '#FFFFFF',
      borderRight: `1px solid ${HBC_COLORS.gray200}`,
      padding: '16px 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '8px 24px 16px', fontSize: '12px', color: HBC_COLORS.orange, fontWeight: 600, borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '8px' }}>
        PRECONSTRUCTION
      </div>
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: '10px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? HBC_COLORS.navy : HBC_COLORS.gray600,
              backgroundColor: isActive ? HBC_COLORS.gray100 : 'transparent',
              borderLeft: isActive ? `3px solid ${HBC_COLORS.orange}` : '3px solid transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => !isActive && ((e.currentTarget as HTMLElement).style.backgroundColor = HBC_COLORS.gray50)}
            onMouseLeave={e => !isActive && ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            {item.label}
          </div>
        );
      })}
    </nav>
  );
};
