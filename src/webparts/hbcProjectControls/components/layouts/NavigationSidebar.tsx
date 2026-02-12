import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { ProjectPicker } from '../shared/ProjectPicker';
import { HBC_COLORS } from '../../theme/tokens';
import { NAV_GROUP_ROLES, PERMISSIONS } from '../../utils/permissions';

interface INavItem {
  label: string;
  path: string;
  requiresProject?: boolean;
  permission?: string;
  hubOnly?: boolean;
  featureFlag?: string;
}

interface INavGroupDef {
  label: string;
  groupKey: string;
  items: INavItem[];
  subGroups?: { label: string; items: INavItem[] }[];
}

const NAV_STRUCTURE: INavGroupDef[] = [
  {
    label: 'Marketing',
    groupKey: 'Marketing',
    items: [
      { label: 'Marketing Dashboard', path: '/marketing', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW, hubOnly: true, featureFlag: 'MarketingProjectRecord' },
      { label: 'Project Record', path: '/operations/project-record', requiresProject: true, featureFlag: 'MarketingProjectRecord' },
    ],
  },
  {
    label: 'Preconstruction',
    groupKey: 'Preconstruction',
    items: [
      { label: 'Estimating Dashboard', path: '/preconstruction', hubOnly: true, featureFlag: 'EstimatingTracker' },
      { label: 'Pipeline', path: '/preconstruction/pipeline', hubOnly: true, featureFlag: 'PipelineDashboard' },
      { label: 'Go/No-Go Tracker', path: '/preconstruction/pipeline/gonogo', hubOnly: true, featureFlag: 'GoNoGoScorecard' },
      { label: 'Precon Tracker', path: '/preconstruction/precon-tracker', hubOnly: true, featureFlag: 'EstimatingTracker' },
      { label: 'Estimate Log', path: '/preconstruction/estimate-log', hubOnly: true, featureFlag: 'EstimatingTracker' },
      { label: 'Post-Bid Autopsies', path: '/preconstruction/autopsy-list', permission: PERMISSIONS.AUTOPSY_VIEW, featureFlag: 'LossAutopsy' },
      { label: 'New Lead', path: '/lead/new', permission: PERMISSIONS.LEAD_CREATE, hubOnly: true, featureFlag: 'LeadIntake' },
      { label: 'Job Number Request', path: '/job-request', permission: PERMISSIONS.JOB_NUMBER_REQUEST_CREATE, hubOnly: true },
    ],
  },
  {
    label: 'Operations',
    groupKey: 'Operations',
    items: [
      { label: 'Active Projects', path: '/operations', permission: PERMISSIONS.ACTIVE_PROJECTS_VIEW, hubOnly: true, featureFlag: 'ExecutiveDashboard' },
      { label: 'Compliance Log', path: '/operations/compliance-log', permission: PERMISSIONS.COMPLIANCE_LOG_VIEW, hubOnly: true },
    ],
    subGroups: [
      {
        label: 'Project Manual',
        items: [
          { label: 'Project Dashboard', path: '/operations/project', requiresProject: true },
          { label: 'Startup Checklist', path: '/operations/startup-checklist', requiresProject: true, featureFlag: 'ProjectStartup' },
          { label: 'Management Plan', path: '/operations/management-plan', requiresProject: true, featureFlag: 'ProjectManagementPlan' },
          { label: "Super's Plan", path: '/operations/superintendent-plan', requiresProject: true },
          { label: 'Responsibility', path: '/operations/responsibility', requiresProject: true, featureFlag: 'ProjectStartup' },
        ],
      },
      {
        label: 'Commitments',
        items: [
          { label: 'Buyout Log', path: '/operations/buyout-log', requiresProject: true, permission: PERMISSIONS.BUYOUT_VIEW },
          { label: 'Contract Tracking', path: '/operations/contract-tracking', requiresProject: true },
          { label: 'Closeout Checklist', path: '/operations/closeout-checklist', requiresProject: true },
        ],
      },
      {
        label: 'Project Controls',
        items: [
          { label: 'Risk & Cost', path: '/operations/risk-cost', requiresProject: true },
          { label: 'Schedule', path: '/operations/schedule', requiresProject: true },
          { label: 'Quality Concerns', path: '/operations/quality-concerns', requiresProject: true },
          { label: 'Safety Concerns', path: '/operations/safety-concerns', requiresProject: true },
          { label: 'Monthly Review', path: '/operations/monthly-review', requiresProject: true, featureFlag: 'MonthlyProjectReview' },
          { label: 'Lessons Learned', path: '/operations/lessons-learned', requiresProject: true },
        ],
      },
    ],
  },
  {
    label: 'Accounting',
    groupKey: 'Accounting',
    items: [
      { label: 'Accounting Queue', path: '/accounting-queue', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
    ],
  },
  {
    label: 'Admin',
    groupKey: 'Admin',
    items: [
      { label: 'Admin Panel', path: '/admin', permission: PERMISSIONS.ADMIN_CONFIG },
    ],
  },
];

// NavItem component
const NavItem: React.FC<{
  label: string;
  path: string;
  isActive: boolean;
  indent?: number;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, isActive, indent = 0, disabled, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: `7px 16px 7px ${16 + indent * 12}px`,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 400,
        color: disabled ? HBC_COLORS.gray300 : isActive ? HBC_COLORS.navy : HBC_COLORS.gray600,
        backgroundColor: isActive ? HBC_COLORS.gray100 : hovered && !disabled ? HBC_COLORS.gray50 : 'transparent',
        borderLeft: isActive ? `3px solid ${HBC_COLORS.orange}` : '3px solid transparent',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </div>
  );
};

// NavGroup component
const NavGroup: React.FC<{
  label: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ label, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div style={{ borderBottom: `1px solid ${HBC_COLORS.gray200}` }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 16px',
          fontSize: '11px',
          fontWeight: 700,
          color: HBC_COLORS.gray500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '10px', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          &#9654;
        </span>
      </div>
      {expanded && children}
    </div>
  );
};

// NavSubGroup component
const NavSubGroup: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '6px 16px 6px 20px',
          fontSize: '10px',
          fontWeight: 600,
          color: HBC_COLORS.gray400,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '8px', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          &#9654;
        </span>
        <span>{label}</span>
      </div>
      {expanded && children}
    </div>
  );
};

export const NavigationSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, selectedProject, setSelectedProject, hasPermission, isFeatureEnabled, isProjectSite } = useAppContext();

  const userRoles = currentUser?.roles ?? [];

  const isGroupVisible = (groupKey: string): boolean => {
    const allowedRoles = NAV_GROUP_ROLES[groupKey];
    if (!allowedRoles) return false;
    return userRoles.some(r => allowedRoles.includes(r));
  };

  const isItemVisible = (item: INavItem): boolean => {
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.hubOnly && selectedProject) return false;
    return true;
  };

  const isActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav style={{
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRight: `1px solid ${HBC_COLORS.gray200}`,
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Project Picker */}
      <ProjectPicker selected={selectedProject} onSelect={setSelectedProject} locked={isProjectSite} />

      {/* Dashboard — always visible */}
      <div style={{ borderBottom: `1px solid ${HBC_COLORS.gray200}` }}>
        <NavItem
          label="Dashboard"
          path="/"
          isActive={isActive('/')}
          onClick={() => navigate('/')}
        />
      </div>

      {/* Nav Groups */}
      {NAV_STRUCTURE.map(group => {
        if (!isGroupVisible(group.groupKey)) return null;
        const visibleItems = group.items.filter(isItemVisible);
        const hasContent = visibleItems.length > 0 || (group.subGroups && group.subGroups.length > 0);
        if (!hasContent) return null;

        return (
          <NavGroup key={group.groupKey} label={group.label} defaultExpanded={
            // Auto-expand if current location is within this group
            group.items.some(i => isActive(i.path)) ||
            (group.subGroups?.some(sg => sg.items.some(i => isActive(i.path))) ?? false)
          }>
            {visibleItems.map(item => (
              <NavItem
                key={item.path}
                label={item.label}
                path={item.path}
                isActive={isActive(item.path)}
                disabled={item.requiresProject && !selectedProject}
                onClick={() => navigate(item.path)}
              />
            ))}

            {/* Dynamic project-scoped items when a project is selected */}
            {group.groupKey === 'Preconstruction' && selectedProject?.leadId && (
              <>
                <NavItem
                  label="Lead Detail"
                  path={`/lead/${selectedProject.leadId}`}
                  isActive={isActive(`/lead/${selectedProject.leadId}`)}
                  onClick={() => navigate(`/lead/${selectedProject.leadId}`)}
                />
                <NavItem
                  label="Go/No-Go"
                  path={`/lead/${selectedProject.leadId}/gonogo`}
                  isActive={isActive(`/lead/${selectedProject.leadId}/gonogo`)}
                  onClick={() => navigate(`/lead/${selectedProject.leadId}/gonogo`)}
                />
              </>
            )}

            {group.subGroups?.map(sg => {
              const sgItems = sg.items.filter(isItemVisible);
              if (sgItems.length === 0) return null;
              return (
                <NavSubGroup key={sg.label} label={sg.label}>
                  {sgItems.map(item => (
                    <NavItem
                      key={item.path}
                      label={item.label}
                      path={item.path}
                      isActive={isActive(item.path)}
                      indent={1}
                      disabled={item.requiresProject && !selectedProject}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </NavSubGroup>
              );
            })}
          </NavGroup>
        );
      })}
    </nav>
  );
};
