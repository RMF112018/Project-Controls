import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HBC_COLORS } from '../../theme/tokens';
import { useAppContext } from '../contexts/AppContext';
import { useLeads } from '../hooks/useLeads';
import { ILead, Stage } from '../../models';
import { getStageScreens, getStageLabel } from '../../utils/stageEngine';

interface INavItem {
  label: string;
  path: string;
  screenKey?: string;
}

const ALL_NAV_ITEMS: INavItem[] = [
  { label: 'Project Home', path: '/' },
  { label: 'Startup Checklist', path: '/startup-checklist' },
  { label: 'Responsibility', path: '/responsibility' },
  { label: 'Project Record', path: '/project-record' },
  { label: 'Kickoff', path: '/kickoff', screenKey: 'kickoff' },
  { label: 'Deliverables', path: '/deliverables', screenKey: 'deliverables' },
  { label: 'Interview Prep', path: '/interview', screenKey: 'interview' },
  { label: 'Win/Loss', path: '/winloss', screenKey: 'winloss' },
  { label: 'Loss Autopsy', path: '/autopsy', screenKey: 'autopsy' },
  { label: 'Contract', path: '/contract', screenKey: 'contract' },
  { label: 'Turnover', path: '/turnover', screenKey: 'turnover' },
  { label: 'Closeout', path: '/closeout', screenKey: 'closeout' },
];

export const ProjectNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { siteContext } = useAppContext();
  const { leads, fetchLeads } = useLeads();
  const [project, setProject] = React.useState<ILead | null>(null);

  const projectCode = siteContext.projectCode ?? '';

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);
  React.useEffect(() => {
    if (leads.length > 0 && projectCode) {
      setProject(leads.find(l => l.ProjectCode === projectCode) ?? null);
    }
  }, [leads, projectCode]);

  const stage = project?.Stage ?? Stage.Opportunity;
  const activeScreens = getStageScreens(stage);

  const visibleItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.screenKey) return true; // Project Home always visible
    return activeScreens.includes(item.screenKey);
  });

  return (
    <nav style={{
      width: '200px',
      backgroundColor: '#FFFFFF',
      borderRight: `1px solid ${HBC_COLORS.gray200}`,
      padding: '16px 0',
      flexShrink: 0,
    }}>
      {projectCode && (
        <div style={{ padding: '8px 24px 16px', fontSize: '12px', color: HBC_COLORS.gray500, borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '8px' }}>
          <div>Project: <strong>{projectCode}</strong></div>
          <div style={{ marginTop: 4, fontSize: 11, color: HBC_COLORS.gray400 }}>{getStageLabel(stage)}</div>
        </div>
      )}
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
