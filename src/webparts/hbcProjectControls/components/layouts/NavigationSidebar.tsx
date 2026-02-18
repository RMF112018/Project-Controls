import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ProjectPicker } from '../shared/ProjectPicker';
import { HBC_COLORS, TRANSITION } from '../../theme/tokens';
import { NAV_GROUP_ROLES, PERMISSIONS } from '@hbc/sp-services';

const useStyles = makeStyles({
  nav: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  dashboardSection: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },

  // NavItem styles
  navItem: {
    fontSize: '13px',
    transitionProperty: 'all',
    transitionDuration: TRANSITION.fast,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
  },
  navItemActive: {
    fontWeight: '600',
    color: HBC_COLORS.navy,
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeft: `3px solid ${HBC_COLORS.orange}`,
  },
  navItemInactive: {
    fontWeight: '400',
    color: tokens.colorNeutralForeground2,
    borderLeft: '3px solid transparent',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  navItemDisabled: {
    fontWeight: '400',
    color: tokens.colorNeutralForegroundDisabled,
    borderLeft: '3px solid transparent',
    cursor: 'default',
  },

  // NavGroup styles
  groupContainer: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  groupHeader: {
    ...shorthands.padding('10px', '16px'),
    fontSize: '11px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    userSelect: 'none',
  },
  groupChevron: {
    fontSize: '10px',
    transitionProperty: 'transform',
    transitionDuration: TRANSITION.fast,
  },
  groupChevronExpanded: {
    transform: 'rotate(90deg)',
  },

  // NavSubGroup styles
  subGroupHeader: {
    ...shorthands.padding('6px', '16px', '6px', '20px'),
    fontSize: '10px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    userSelect: 'none',
  },
  subGroupChevron: {
    fontSize: '8px',
    transitionProperty: 'transform',
    transitionDuration: TRANSITION.fast,
  },
});

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
      { label: 'Project Dashboard', path: '/operations/project', requiresProject: true },
      { label: 'Project Settings', path: '/operations/project-settings', requiresProject: true, featureFlag: 'ContractTracking' },
    ],
    subGroups: [
      {
        label: 'Project Manual',
        items: [
          { label: 'Management Plan', path: '/operations/management-plan', requiresProject: true, featureFlag: 'ProjectManagementPlan' },
          { label: "Super's Plan", path: '/operations/superintendent-plan', requiresProject: true },
          { label: 'Startup Checklist', path: '/operations/startup-checklist', requiresProject: true, featureFlag: 'ProjectStartup' },
          { label: 'ReadiCheck', path: '/operations/readicheck', requiresProject: true },
          { label: 'Best Practices', path: '/operations/best-practices', requiresProject: true },
          { label: 'Responsibility', path: '/operations/responsibility', requiresProject: true, featureFlag: 'ProjectStartup' },
          { label: 'Schedule', path: '/operations/schedule', requiresProject: true, featureFlag: 'ScheduleModule' },
          { label: 'Safety Concerns', path: '/operations/safety-concerns', requiresProject: true },
          { label: 'Quality Concerns', path: '/operations/quality-concerns', requiresProject: true },
          { label: 'Closeout Checklist', path: '/operations/closeout-checklist', requiresProject: true },
        ],
      },
      {
        label: 'Logs & Reports',
        items: [
          { label: 'Buyout', path: '/operations/buyout-log', requiresProject: true, permission: PERMISSIONS.BUYOUT_VIEW },
          { label: 'Monthly Review', path: '/operations/monthly-review', requiresProject: true, featureFlag: 'MonthlyProjectReview' },
          { label: 'Constraints', path: '/operations/constraints', requiresProject: true, permission: PERMISSIONS.CONSTRAINTS_VIEW, featureFlag: 'ConstraintsLog' },
          { label: 'Permits', path: '/operations/permits', requiresProject: true, permission: PERMISSIONS.PERMITS_VIEW },
          { label: 'Compliance Log', path: '/operations/compliance-log', permission: PERMISSIONS.COMPLIANCE_LOG_VIEW },
        ],
      },
      {
        label: 'Project Record',
        items: [
          { label: 'Lessons Learned', path: '/operations/lessons-learned', requiresProject: true },
          { label: 'Sub Scorecard', path: '/operations/sub-scorecard', requiresProject: true },
          { label: 'Project Summary', path: '/operations/project-record', requiresProject: true },
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
      { label: 'Performance', path: '/admin/performance', permission: PERMISSIONS.ADMIN_CONFIG, featureFlag: 'PerformanceMonitoring' },
      { label: 'Application Support', path: '/admin/application-support', permission: PERMISSIONS.ADMIN_CONFIG, featureFlag: 'EnableHelpSystem' },
      { label: 'Telemetry', path: '/admin/telemetry', permission: PERMISSIONS.ADMIN_CONFIG, featureFlag: 'TelemetryDashboard' },
    ],
  },
];

// NavItem component
const NavItemComponent: React.FC<{
  label: string;
  path: string;
  isActive: boolean;
  indent?: number;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, isActive, indent = 0, disabled, onClick }) => {
  const styles = useStyles();

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={mergeClasses(
        styles.navItem,
        isActive ? styles.navItemActive : disabled ? styles.navItemDisabled : styles.navItemInactive,
      )}
      style={{ padding: `7px 16px 7px ${16 + indent * 12}px` }}
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
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div className={styles.groupContainer}>
      <div onClick={() => setExpanded(!expanded)} className={styles.groupHeader}>
        <span>{label}</span>
        <span className={mergeClasses(styles.groupChevron, expanded ? styles.groupChevronExpanded : undefined)}>
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
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div>
      <div onClick={() => setExpanded(!expanded)} className={styles.subGroupHeader}>
        <span className={mergeClasses(styles.subGroupChevron, expanded ? styles.groupChevronExpanded : undefined)}>
          &#9654;
        </span>
        <span>{label}</span>
      </div>
      {expanded && children}
    </div>
  );
};

export const NavigationSidebar: React.FC = () => {
  const styles = useStyles();
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

  const isActivePath = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={styles.nav}>
      {/* Project Picker */}
      <ProjectPicker selected={selectedProject} onSelect={setSelectedProject} locked={isProjectSite} />

      {/* Dashboard — always visible */}
      <div className={styles.dashboardSection}>
        <NavItemComponent
          label="Dashboard"
          path="/"
          isActive={isActivePath('/')}
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
            group.items.some(i => isActivePath(i.path)) ||
            (group.subGroups?.some(sg => sg.items.some(i => isActivePath(i.path))) ?? false)
          }>
            {visibleItems.map(item => (
              <NavItemComponent
                key={item.path}
                label={item.label}
                path={item.path}
                isActive={isActivePath(item.path)}
                disabled={item.requiresProject && !selectedProject}
                onClick={() => navigate(item.path)}
              />
            ))}

            {/* Dynamic project-scoped items when a project is selected */}
            {group.groupKey === 'Preconstruction' && selectedProject?.leadId && (
              <>
                <NavItemComponent
                  label="Lead Detail"
                  path={`/lead/${selectedProject.leadId}`}
                  isActive={isActivePath(`/lead/${selectedProject.leadId}`)}
                  onClick={() => navigate(`/lead/${selectedProject.leadId}`)}
                />
                <NavItemComponent
                  label="Go/No-Go"
                  path={`/lead/${selectedProject.leadId}/gonogo`}
                  isActive={isActivePath(`/lead/${selectedProject.leadId}/gonogo`)}
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
                    <NavItemComponent
                      key={item.path}
                      label={item.label}
                      path={item.path}
                      isActive={isActivePath(item.path)}
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
