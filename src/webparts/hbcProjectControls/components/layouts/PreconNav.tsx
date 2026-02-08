import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HBC_COLORS } from '../../theme/tokens';
import { PERMISSIONS } from '../../utils/permissions';
import { useAppContext } from '../contexts/AppContext';

interface INavItem {
  label: string;
  path: string;
  permission?: string;
}

const NAV_ITEMS: INavItem[] = [
  { label: 'Dashboard', path: '/', permission: PERMISSIONS.PRECON_HUB_VIEW },
  { label: 'Kick-Off Checklists', path: '/kickoff', permission: PERMISSIONS.KICKOFF_VIEW },
  { label: 'Post-Bid Autopsies', path: '/autopsies', permission: PERMISSIONS.AUTOPSY_VIEW },
  { label: 'Precon Tracking', path: '/precon-tracking', permission: PERMISSIONS.PRECON_HUB_VIEW },
  { label: 'Estimate Log', path: '/estimate-log', permission: PERMISSIONS.PRECON_HUB_VIEW },
  { label: 'Go/No-Go Tracker', path: '/gonogo-tracker', permission: PERMISSIONS.GONOGO_READ },
];

export const PreconNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAppContext();

  const visibleItems = NAV_ITEMS.filter(item => !item.permission || hasPermission(item.permission));

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
      {visibleItems.map(item => {
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
