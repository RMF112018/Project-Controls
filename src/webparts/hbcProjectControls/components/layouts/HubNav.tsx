import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HBC_COLORS } from '../../theme/tokens';
import { useAppContext } from '../contexts/AppContext';
import { PERMISSIONS } from '../../utils/permissions';

interface INavItem {
  label: string;
  path: string;
  permission?: string;
}

const NAV_ITEMS: INavItem[] = [
  { label: 'Pipeline', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Job Number Request', path: '/job-request', permission: PERMISSIONS.JOB_NUMBER_REQUEST_CREATE },
  { label: 'Accounting Queue', path: '/accounting-queue', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
  { label: 'Marketing', path: '/marketing', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW },
  { label: 'Admin', path: '/admin', permission: PERMISSIONS.ADMIN_CONFIG },
];

export const HubNav: React.FC = () => {
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
