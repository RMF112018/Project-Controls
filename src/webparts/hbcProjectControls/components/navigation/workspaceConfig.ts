import { RoleName, PERMISSIONS } from '@hbc/sp-services';
import type { IWorkspaceConfig } from '@hbc/sp-services';

const ALL_ROLES = Object.values(RoleName) as RoleName[];

export type { IWorkspaceConfig, ISidebarGroup, ISidebarItem } from '@hbc/sp-services';

export const WORKSPACE_CONFIGS: IWorkspaceConfig[] = [
  {
    id: 'admin',
    label: 'Admin',
    icon: 'Settings24Regular',
    basePath: '/admin',
    roles: ALL_ROLES,
    featureFlag: 'AdminWorkspace',
    sidebarGroups: [
      {
        label: 'System Configuration',
        items: [
          { label: 'Connections', path: '/admin/connections', permission: PERMISSIONS.ADMIN_CONNECTIONS },
          { label: 'Hub Site URL', path: '/admin/hub-site', permission: PERMISSIONS.ADMIN_CONFIG },
          { label: 'Workflows', path: '/admin/workflows', permission: PERMISSIONS.WORKFLOW_MANAGE },
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
          { label: 'Dev Users', path: '/admin/dev-users', permission: PERMISSIONS.ADMIN_FLAGS },
          { label: 'Feature Flags', path: '/admin/feature-flags', permission: PERMISSIONS.ADMIN_FLAGS },
          { label: 'Audit Log', path: '/admin/audit-log', permission: PERMISSIONS.ADMIN_FLAGS },
        ],
      },
    ],
  },
  {
    id: 'preconstruction',
    label: 'Preconstruction',
    icon: 'DocumentSearch24Regular',
    basePath: '/preconstruction',
    roles: ALL_ROLES,
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
          { label: 'Department Tracking', path: '/preconstruction/estimating/tracking', permission: PERMISSIONS.ESTIMATING_READ, featureFlag: 'EstimatingDepartmentTracking' },
          { label: 'Project Number Requests', path: '/preconstruction/project-number-requests', permission: PERMISSIONS.PROJECT_NUMBER_REQUEST_VIEW, featureFlag: 'ProjectNumberRequestsModule' },
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
    roles: ALL_ROLES,
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
      {
        label: 'Procore Integration',
        items: [
          { label: 'Procore Dashboard', path: '/operations/procore', permission: PERMISSIONS.PROCORE_VIEW, featureFlag: 'ProcoreIntegration' },
          { label: 'RFIs', path: '/operations/procore/rfis', permission: PERMISSIONS.PROCORE_VIEW, featureFlag: 'ProcoreIntegration' },
          { label: 'Budget', path: '/operations/procore/budget', permission: PERMISSIONS.PROCORE_VIEW, featureFlag: 'ProcoreIntegration' },
          { label: 'Sync Conflicts', path: '/operations/procore/conflicts', permission: PERMISSIONS.CONNECTOR_MANAGE, featureFlag: 'ProcoreIntegration' },
        ],
      },
    ],
  },
  {
    id: 'shared-services',
    label: 'Shared Services',
    icon: 'PeopleCommunity24Regular',
    basePath: '/shared-services',
    roles: ALL_ROLES,
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
      {
        label: 'BambooHR',
        items: [
          { label: 'Employee Directory', path: '/shared-services/hr/bamboo/directory', permission: PERMISSIONS.BAMBOO_VIEW, featureFlag: 'BambooHRIntegration' },
          { label: 'Org Chart', path: '/shared-services/hr/bamboo/org-chart', permission: PERMISSIONS.BAMBOO_VIEW, featureFlag: 'BambooHRIntegration' },
          { label: 'Time Off', path: '/shared-services/hr/bamboo/time-off', permission: PERMISSIONS.BAMBOO_VIEW, featureFlag: 'BambooHRIntegration' },
          { label: 'Employee Mappings', path: '/shared-services/hr/bamboo/mappings', permission: PERMISSIONS.BAMBOO_SYNC, featureFlag: 'BambooHRIntegration' },
        ],
      },
    ],
  },
  {
    id: 'site-control',
    label: 'HB Site Control',
    icon: 'Toolbox24Regular',
    basePath: '/site-control',
    roles: ALL_ROLES,
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
  // ── Project Hub workspace — visible only when a project is selected ────────────
  {
    id: 'project-hub',
    label: 'Project Hub',
    icon: 'Briefcase24Regular',
    basePath: '/project-hub',
    roles: [],  // accessible to all authenticated roles
    featureFlag: 'ProjectHubWorkspace',
    requireProject: true,
    sidebarGroups: [
      {
        label: 'Project Hub',
        items: [
          { label: 'Project Dashboard', path: '/project-hub/dashboard', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Project Settings', path: '/project-hub/settings', permission: PERMISSIONS.PROJECT_RECORD_OPS_EDIT },
        ],
      },
      {
        label: 'Preconstruction',
        items: [
          { label: 'Go / No-Go', path: '/project-hub/precon/go-no-go', permission: PERMISSIONS.GONOGO_READ },
          { label: 'Estimating Kick-Off', path: '/project-hub/precon/estimating-kickoff', permission: PERMISSIONS.ESTIMATING_READ },
          { label: 'Estimate', path: '/project-hub/precon/estimate', permission: PERMISSIONS.ESTIMATING_READ },
          { label: 'Project Turnover', path: '/project-hub/precon/turnover', permission: PERMISSIONS.TURNOVER_READ },
          { label: 'Post-Bid Autopsy', path: '/project-hub/precon/post-bid', permission: PERMISSIONS.ESTIMATING_READ },
        ],
      },
      {
        label: 'Project Manual',
        items: [
          { label: 'Project Management Plan', path: '/project-hub/manual/pmp', permission: PERMISSIONS.PMP_EDIT },
          { label: "Superintendent's Plan", path: '/project-hub/manual/superintendent', permission: PERMISSIONS.SUPERINTENDENT_PLAN_EDIT },
          { label: 'Responsibility Matrix', path: '/project-hub/manual/responsibility', permission: PERMISSIONS.MATRIX_EDIT },
          { label: 'Meeting Agenda Templates', path: '/project-hub/manual/meetings', permission: PERMISSIONS.MEETING_READ },
          { label: 'Pay Application Process', path: '/project-hub/manual/pay-app', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Safety Plan', path: '/project-hub/manual/safety-plan', permission: PERMISSIONS.SAFETY_EDIT },
          { label: 'OSHA Site Visit Guide', path: '/project-hub/manual/osha', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Tropical Weather Guide', path: '/project-hub/manual/weather', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'Crisis Management & ICE', path: '/project-hub/manual/crisis', permission: PERMISSIONS.PROJECT_HUB_VIEW },
          { label: 'IDS Requirements', path: '/project-hub/manual/ids', permission: PERMISSIONS.PROJECT_HUB_VIEW },
        ],
      },
      {
        label: 'Startup & Closeout',
        items: [
          { label: 'Project Startup Guide', path: '/project-hub/manual/startup/guide', permission: PERMISSIONS.STARTUP_CHECKLIST_EDIT },
          { label: 'Startup Checklist', path: '/project-hub/manual/startup/checklist', permission: PERMISSIONS.STARTUP_CHECKLIST_EDIT },
          { label: 'Project Closeout Guide', path: '/project-hub/manual/startup/closeout-guide', permission: PERMISSIONS.CLOSEOUT_EDIT },
          { label: 'Completion & Acceptance', path: '/project-hub/manual/startup/completion', permission: PERMISSIONS.CLOSEOUT_EDIT },
          { label: 'Closeout Checklist', path: '/project-hub/manual/startup/closeout-checklist', permission: PERMISSIONS.CLOSEOUT_EDIT },
        ],
      },
      {
        label: 'QA / QC Program',
        items: [
          { label: 'QC Checklists', path: '/project-hub/manual/qaqc/checklists', permission: PERMISSIONS.QUALITY_EDIT },
          { label: 'Best Practices', path: '/project-hub/manual/qaqc/best-practices', permission: PERMISSIONS.QUALITY_EDIT },
        ],
      },
      {
        label: 'Financial Forecasting',
        items: [
          { label: 'Review Checklist', path: '/project-hub/cost-time/forecast/checklist', permission: PERMISSIONS.RISK_EDIT },
          { label: 'Forecast Summary', path: '/project-hub/cost-time/forecast/summary', permission: PERMISSIONS.RISK_EDIT },
          { label: 'GC/GR Forecast', path: '/project-hub/cost-time/forecast/gcgr', permission: PERMISSIONS.RISK_EDIT },
          { label: 'Cash Flow Forecast', path: '/project-hub/cost-time/forecast/cashflow', permission: PERMISSIONS.RISK_EDIT },
        ],
      },
      {
        label: 'Schedule',
        items: [
          { label: 'Schedule', path: '/project-hub/cost-time/schedule', permission: PERMISSIONS.SCHEDULE_VIEW },
        ],
      },
      {
        label: 'Logs & Reports',
        items: [
          { label: 'Buyout Log', path: '/project-hub/logs/buyout', permission: PERMISSIONS.BUYOUT_VIEW },
          { label: 'Permit Log', path: '/project-hub/logs/permits', permission: PERMISSIONS.PERMITS_VIEW },
          { label: 'Constraints Log', path: '/project-hub/logs/constraints', permission: PERMISSIONS.CONSTRAINTS_VIEW },
          { label: 'Subcontractor Scorecard', path: '/project-hub/logs/sub-scorecard', permission: PERMISSIONS.PROJECT_HUB_VIEW },
        ],
      },
      {
        label: 'Monthly Reports',
        items: [
          { label: 'PX Review', path: '/project-hub/logs/monthly/px-review', permission: PERMISSIONS.MONTHLY_REVIEW_PM },
          { label: 'Owner Report', path: '/project-hub/logs/monthly/owner-report', permission: PERMISSIONS.MONTHLY_REVIEW_PM },
        ],
      },
      {
        label: 'Documents',
        items: [
          { label: 'Project Documents', path: '/project-hub/documents', permission: PERMISSIONS.PROJECT_HUB_VIEW },
        ],
      },
    ],
  },
  // Hub workspace — MUST be last so getWorkspaceFromPath matches other basePaths first
  {
    id: 'hub',
    label: 'Analytics Hub',
    icon: 'Home24Regular',
    basePath: '/',
    roles: [],  // accessible to all roles
    sidebarGroups: [
      {
        label: 'Workspaces',
        items: [
          { label: 'Preconstruction', path: '/preconstruction' },
          { label: 'Operations', path: '/operations' },
          { label: 'Shared Services', path: '/shared-services' },
          { label: 'HB Site Control', path: '/site-control' },
          { label: 'Admin', path: '/admin' },
        ],
      },
    ],
  },
];

/** Workspaces shown in the App Launcher grid (excludes hub — hub is the home page) */
export const LAUNCHER_WORKSPACES = WORKSPACE_CONFIGS.filter(w => w.id !== 'hub');

/** Look up a workspace config by pathname prefix */
export function getWorkspaceFromPath(pathname: string): IWorkspaceConfig | undefined {
  return WORKSPACE_CONFIGS.find(w => pathname === w.basePath || pathname.startsWith(w.basePath + '/'));
}
