import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HBC_COLORS } from '../../theme/tokens';
import { useAppContext } from '../contexts/AppContext';

interface INavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: INavItem[] = [
  { label: 'Project Home', path: '/' },
  { label: 'Startup Checklist', path: '/startup-checklist' },
  { label: 'Responsibility', path: '/responsibility' },
  { label: 'Project Record', path: '/project-record' },
  { label: 'Go/No-Go', path: '/gonogo' },
  { label: 'Deliverables', path: '/deliverables' },
  { label: 'Win/Loss', path: '/winloss' },
  { label: 'Turnover', path: '/turnover' },
  { label: 'Closeout', path: '/closeout' },
];

export const ProjectNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteContext } = useAppContext();

  return (
    <nav style={{
      width: '200px',
      backgroundColor: '#FFFFFF',
      borderRight: `1px solid ${HBC_COLORS.gray200}`,
      padding: '16px 0',
      flexShrink: 0,
    }}>
      {siteContext.projectCode && (
        <div style={{ padding: '8px 24px 16px', fontSize: '12px', color: HBC_COLORS.gray500, borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '8px' }}>
          Project: <strong>{siteContext.projectCode}</strong>
        </div>
      )}
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
