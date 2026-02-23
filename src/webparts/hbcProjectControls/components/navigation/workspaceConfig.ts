import { RoleName, PERMISSIONS } from '@hbc/sp-services';

export interface ISidebarItem {
  label: string;
  path: string;
  icon?: string;
  permission?: string;
  featureFlag?: string;
}

export interface ISidebarGroup {
  label: string;
  items: ISidebarItem[];
}

export interface IWorkspaceConfig {
  id: string;
  label: string;
  icon: string;
  basePath: string;
  roles: RoleName[];
  featureFlag?: string;
  sidebarGroups: ISidebarGroup[];
}

export const WORKSPACE_CONFIGS: IWorkspaceConfig[] = [
  {
    id: 'admin',
    label: 'Admin',
    icon: 'Settings24Regular',
    basePath: '/admin',
    roles: [
      RoleName.SharePointAdmin,
      RoleName.ExecutiveLeadership,
      RoleName.IDS,
    ],
    featureFlag: 'AdminWorkspace',
    sidebarGroups: [
      {
        label: 'System Configuration',
        items: [
          { label: 'Connections', path: '/admin/connections', permission: PERMISSIONS.ADMIN_CONNECTIONS },
          { label: 'Hub Site URL', path: '/admin/hub-site', permission: PERMISSIONS.ADMIN_CONFIG },
          { label: 'Workflows', path: '/admin/workflows', permission: PERMISSIONS.WORKFLOW_MANAGE, featureFlag: 'WorkflowDefinitions' },
        ],
      },
      {
        label: 'Security & Access',
        items: [
          { label: 'Roles', path: '/admin/roles', permission: PERMISSIONS.ADMIN_ROLES },
          { label: 'Permissions', path: '/admin/permissions', permission: PERMISSIONS.PERMISSION_TEMPLATES_MANAGE, featureFlag: 'PermissionEngine' },
          { label: 'Assignments', path: '/admin/assignments', permission: PERMISSIONS.PERMISSION_PROJECT_TEAM_MANAGE },
          { label: 'Sectors', path: '/admin/sectors', permission: PERMISSIONS.ADMIN_CONFIG },
        ],
      },
      {
        label: 'Provisioning',
        items: [
          { label: 'Provisioning', path: '/admin/provisioning', permission: PERMISSIONS.ADMIN_PROVISIONING },
        ],
      },
      {
        label: 'Dev Tools',
        items: [
          { label: 'Dev Users', path: '/admin/dev-users', permission: PERMISSIONS.ADMIN_FLAGS, featureFlag: 'DevUserManagement' },
          { label: 'Feature Flags', path: '/admin/feature-flags', permission: PERMISSIONS.ADMIN_FLAGS, featureFlag: 'DevUserManagement' },
          { label: 'Audit Log', path: '/admin/audit-log', permission: PERMISSIONS.ADMIN_FLAGS, featureFlag: 'DevUserManagement' },
        ],
      },
    ],
  },
  {
    id: 'preconstruction',
    label: 'Preconstruction',
    icon: 'DocumentSearch24Regular',
    basePath: '/preconstruction',
    roles: [
      RoleName.SharePointAdmin,
      RoleName.BDRepresentative,
      RoleName.EstimatingCoordinator,
      RoleName.ExecutiveLeadership,
      RoleName.OperationsTeam,
      RoleName.PreconstructionTeam,
      RoleName.IDS,
    ],
    featureFlag: 'PreconstructionWorkspace',
    sidebarGroups: [
      {
        label: 'Business Development',
        items: [
          { label: 'BD Dashboard', path: '/preconstruction/bd', permission: PERMISSIONS.PRECON_HUB_VIEW },
          { label: 'Lead Management', path: '/preconstruction/bd/leads', permission: PERMISSIONS.LEAD_READ },
          { label: 'Go / No-Go', path: '/preconstruction/bd/go-no-go', permission: PERMISSIONS.GONOGO_READ },
          { label: 'Pipeline', path: '/preconstruction/bd/pipeline', permission: PERMISSIONS.LEAD_READ },
          { label: 'Project Hub', path: '/preconstruction/bd/project-hub', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Documents', path: '/preconstruction/bd/documents', permission: PERMISSIONS.LEAD_READ },
        ],
      },
      {
        label: 'Estimating',
        items: [
          { label: 'Estimating Dashboard', path: '/preconstruction/estimating', permission: PERMISSIONS.ESTIMATING_READ },
          { label: 'Department Tracking', path: '/preconstruction/estimating/tracking', permission: PERMISSIONS.ESTIMATING_READ },
          { label: 'New Job Requests', path: '/preconstruction/estimating/job-requests', permission: PERMISSIONS.JOB_NUMBER_REQUEST_CREATE },
          { label: 'Post-Bid Autopsies', path: '/preconstruction/estimating/post-bid', permission: PERMISSIONS.ESTIMATING_READ },
          { label: 'Project Hub', path: '/preconstruction/estimating/project-hub', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Documents', path: '/preconstruction/estimating/documents', permission: PERMISSIONS.ESTIMATING_READ },
        ],
      },
      {
        label: 'Innovation & Digital Services',
        items: [
          { label: 'IDS Dashboard', path: '/preconstruction/ids', permission: PERMISSIONS.PRECON_HUB_VIEW },
          { label: 'IDS Tracking', path: '/preconstruction/ids/tracking', permission: PERMISSIONS.PRECON_READ },
          { label: 'Documents', path: '/preconstruction/ids/documents', permission: PERMISSIONS.PRECON_READ },
        ],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'BuildingFactory24Regular',
    basePath: '/operations',
    roles: [
      RoleName.SharePointAdmin,
      RoleName.OperationsTeam,
      RoleName.ExecutiveLeadership,
      RoleName.DepartmentDirector,
      RoleName.RiskManagement,
      RoleName.QualityControl,
      RoleName.Safety,
      RoleName.IDS,
    ],
    featureFlag: 'OperationsWorkspace',
    sidebarGroups: [
      {
        label: 'Operations',
        items: [
          { label: 'Operations Dashboard', path: '/operations', permission: PERMISSIONS.PROJECT_HUB_VIEW },
        ],
      },
      {
        label: 'Commercial Operations',
        items: [
          { label: 'Commercial Dashboard', path: '/operations/commercial', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Luxury Residential', path: '/operations/commercial/luxury', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Project Hub', path: '/operations/project/dashboard', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Project Settings', path: '/operations/project/settings', permission: PERMISSIONS.PROJECT_RECORD_OPS_EDIT },
          { label: 'Project Manual', path: '/operations/project/manual', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Financial Forecasting', path: '/operations/cost-time/forecasting', permission: PERMISSIONS.RISK_EDIT },
          { label: 'Schedule', path: '/operations/cost-time/schedule', permission: PERMISSIONS.SCHEDULE_VIEW },
          { label: 'Buyout Log', path: '/operations/logs/buyout', permission: PERMISSIONS.BUYOUT_VIEW },
          { label: 'Permit Log', path: '/operations/logs/permits', permission: PERMISSIONS.PERMITS_VIEW },
          { label: 'Constraints Log', path: '/operations/logs/constraints', permission: PERMISSIONS.CONSTRAINTS_VIEW },
          { label: 'Monthly Reports', path: '/operations/logs/monthly-reports', permission: PERMISSIONS.MONTHLY_REVIEW_PM },
          { label: 'Sub Scorecard', path: '/operations/logs/sub-scorecard', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Documents', path: '/operations/commercial/documents', permission: PERMISSIONS.PROJECT_HUB_VIEW },
        ],
      },
      {
        label: 'Operational Excellence',
        items: [
          { label: 'OpEx Dashboard', path: '/operations/opex', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Onboarding', path: '/operations/opex/onboarding', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Training', path: '/operations/opex/training', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Documents', path: '/operations/opex/documents', permission: PERMISSIONS.PROJECT_HUB_VIEW },
        ],
      },
      {
        label: 'Safety',
        items: [
          { label: 'Safety Dashboard', path: '/operations/safety', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Training & Certification', path: '/operations/safety/training', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Safety Scorecard', path: '/operations/safety/scorecard', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Resources', path: '/operations/safety/resources', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Documents', path: '/operations/safety/documents', permission: PERMISSIONS.SAFETY_EDIT },
        ],
      },
      {
        label: 'Quality Control & Warranty',
        items: [
          { label: 'QC & Warranty Dashboard', path: '/operations/qc', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Best Practices', path: '/operations/qc/best-practices', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'QA Tracking', path: '/operations/qc/tracking', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'QC Checklists', path: '/operations/qc/checklists', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Warranty', path: '/operations/qc/warranty', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Documents', path: '/operations/qc/documents', permission: PERMISSIONS.QUALITY_EDIT },
        ],
      },
    ],
  },
  {
    id: 'shared-services',
    label: 'Shared Services',
    icon: 'PeopleCommunity24Regular',
    basePath: '/shared-services',
    roles: [
      RoleName.SharePointAdmin,
      RoleName.ExecutiveLeadership,
      RoleName.DepartmentDirector,
      RoleName.Marketing,
      RoleName.BDRepresentative,
      RoleName.AccountingManager,
      RoleName.RiskManagement,
      RoleName.OperationsTeam,
      RoleName.IDS,
    ],
    featureFlag: 'SharedServicesWorkspace',
    sidebarGroups: [
      {
        label: 'Marketing',
        items: [
          { label: 'Marketing Dashboard', path: '/shared-services/marketing', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW },
          { label: 'Resources', path: '/shared-services/marketing/resources', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW },
          { label: 'Requests', path: '/shared-services/marketing/requests', permission: PERMISSIONS.MARKETING_EDIT },
          { label: 'Tracking', path: '/shared-services/marketing/tracking', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW },
          { label: 'Documents', path: '/shared-services/marketing/documents', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW },
        ],
      },
      {
        label: 'Human Resources',
        items: [
          { label: 'People & Culture Dashboard', path: '/shared-services/hr', permission: PERMISSIONS.HR_VIEW },
          { label: 'Openings', path: '/shared-services/hr/openings', permission: PERMISSIONS.HR_VIEW },
          { label: 'Announcements', path: '/shared-services/hr/announcements', permission: PERMISSIONS.SHARED_SERVICES_HUB_VIEW },
          { label: 'Initiatives', path: '/shared-services/hr/initiatives', permission: PERMISSIONS.HR_VIEW },
          { label: 'Documents', path: '/shared-services/hr/documents', permission: PERMISSIONS.HR_VIEW },
        ],
      },
      {
        label: 'Accounting',
        items: [
          { label: 'Accounting Dashboard', path: '/shared-services/accounting', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
          { label: 'New Project Setup', path: '/shared-services/accounting/new-project', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
          { label: 'Accounts Receivable Report', path: '/shared-services/accounting/receivables', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
          { label: 'Documents', path: '/shared-services/accounting/documents', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
        ],
      },
      {
        label: 'Risk Management',
        items: [
          { label: 'Risk Management Dashboard', path: '/shared-services/risk', permission: PERMISSIONS.RISK_MANAGEMENT_VIEW },
          { label: 'Knowledge Center', path: '/shared-services/risk/knowledge-center', permission: PERMISSIONS.RISK_MANAGEMENT_VIEW },
          { label: 'Requests', path: '/shared-services/risk/requests', permission: PERMISSIONS.RISK_MANAGEMENT_EDIT },
          { label: 'Enrollment Tracking', path: '/shared-services/risk/enrollment', permission: PERMISSIONS.RISK_MANAGEMENT_VIEW },
          { label: 'Documents', path: '/shared-services/risk/documents', permission: PERMISSIONS.RISK_MANAGEMENT_VIEW },
        ],
      },
    ],
  },
  {
    id: 'site-control',
    label: 'HB Site Control',
    icon: 'Toolbox24Regular',
    basePath: '/site-control',
    roles: [
      RoleName.SharePointAdmin,
      RoleName.ExecutiveLeadership,
      RoleName.DepartmentDirector,
      RoleName.OperationsTeam,
      RoleName.QualityControl,
      RoleName.Safety,
    ],
    featureFlag: 'SiteControlWorkspace',
    sidebarGroups: [
      {
        label: 'Jobsite Management',
        items: [
          { label: 'Sign-In / Sign-Out', path: '/site-control/signin', icon: 'PersonAvailable24Regular', permission: PERMISSIONS.SITE_CONTROL_HUB_VIEW },
          { label: 'Personnel Log', path: '/site-control/signin/log', icon: 'PeopleList24Regular', permission: PERMISSIONS.SITE_CONTROL_HUB_VIEW },
          { label: 'Documents', path: '/site-control/signin/documents', icon: 'DocumentFolder24Regular', permission: PERMISSIONS.SITE_CONTROL_HUB_VIEW },
        ],
      },
      {
        label: 'Safety',
        items: [
          { label: 'Safety Dashboard', path: '/site-control/safety', icon: 'ShieldCheckmark24Regular', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Inspections', path: '/site-control/safety/inspections', icon: 'ClipboardTask24Regular', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Warnings & Notices', path: '/site-control/safety/warnings', icon: 'Warning24Regular', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Tool-Box Talks', path: '/site-control/safety/toolbox-talks', icon: 'ChatMultiple24Regular', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Scorecard', path: '/site-control/safety/scorecard', icon: 'DataBarVertical24Regular', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'Documents', path: '/site-control/safety/documents', icon: 'DocumentFolder24Regular', permission: PERMISSIONS.SAFETY_EDIT },
        ],
      },
      {
        label: 'Quality Control',
        items: [
          { label: 'QC Dashboard', path: '/site-control/qc', icon: 'Checkmark24Regular', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Inspections', path: '/site-control/qc/inspections', icon: 'ClipboardSearch24Regular', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Issue Resolution', path: '/site-control/qc/issues', icon: 'ArrowRouting24Regular', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Metrics', path: '/site-control/qc/metrics', icon: 'DataTrending24Regular', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Documents', path: '/site-control/qc/documents', icon: 'DocumentFolder24Regular', permission: PERMISSIONS.QUALITY_EDIT },
        ],
      },
    ],
  },
];

/** Workspaces shown in the App Launcher grid */
export const LAUNCHER_WORKSPACES = WORKSPACE_CONFIGS;

/** Look up a workspace config by pathname prefix */
export function getWorkspaceFromPath(pathname: string): IWorkspaceConfig | undefined {
  return WORKSPACE_CONFIGS.find(w => pathname === w.basePath || pathname.startsWith(w.basePath + '/'));
}
