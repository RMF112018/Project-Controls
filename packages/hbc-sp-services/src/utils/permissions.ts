// Permission keys used in RBAC
export const PERMISSIONS = {
  // Lead management
  LEAD_CREATE: 'lead:create',
  LEAD_READ: 'lead:read',
  LEAD_EDIT: 'lead:edit',
  LEAD_DELETE: 'lead:delete',

  // Go/No-Go
  GONOGO_SCORE_ORIGINATOR: 'gonogo:score:originator',
  GONOGO_SCORE_COMMITTEE: 'gonogo:score:committee',
  GONOGO_SUBMIT: 'gonogo:submit',
  GONOGO_DECIDE: 'gonogo:decide',
  GONOGO_READ: 'gonogo:read',

  // Preconstruction
  PRECON_READ: 'precon:read',
  PRECON_EDIT: 'precon:edit',

  // Proposal
  PROPOSAL_READ: 'proposal:read',
  PROPOSAL_EDIT: 'proposal:edit',

  // Win/Loss
  WINLOSS_RECORD: 'winloss:record',
  WINLOSS_READ: 'winloss:read',

  // Contract
  CONTRACT_READ: 'contract:read',
  CONTRACT_EDIT: 'contract:edit',
  CONTRACT_VIEW_FINANCIALS: 'contract:view:financials',

  // Turnover
  TURNOVER_READ: 'turnover:read',
  TURNOVER_EDIT: 'turnover:edit',

  // Closeout
  CLOSEOUT_READ: 'closeout:read',
  CLOSEOUT_EDIT: 'closeout:edit',

  // Estimating
  ESTIMATING_READ: 'estimating:read',
  ESTIMATING_EDIT: 'estimating:edit',

  // Module access
  PRECON_HUB_VIEW: 'precon:hub:view',
  PROJECT_HUB_VIEW: 'project:hub:view',

  // Admin
  ADMIN_ROLES: 'admin:roles',
  ADMIN_FLAGS: 'admin:flags',
  ADMIN_CONFIG: 'admin:config',
  ADMIN_CONNECTIONS: 'admin:connections',
  ADMIN_PROVISIONING: 'admin:provisioning',

  // Marketing
  MARKETING_EDIT: 'marketing:edit',
  MARKETING_DASHBOARD_VIEW: 'marketing:dashboard:view',

  // Site provisioning
  SITE_PROVISION: 'site:provision',

  // Meeting
  MEETING_SCHEDULE: 'meeting:schedule',
  MEETING_READ: 'meeting:read',

  // Project Startup
  STARTUP_CHECKLIST_EDIT: 'startup:checklist:edit',
  STARTUP_CHECKLIST_SIGNOFF: 'startup:checklist:signoff',
  MATRIX_EDIT: 'matrix:edit',
  PROJECT_RECORD_EDIT: 'projectrecord:edit',
  PROJECT_RECORD_OPS_EDIT: 'projectrecord:ops:edit',

  // Project Management Plan
  PMP_EDIT: 'pmp:edit',
  PMP_APPROVE: 'pmp:approve',
  PMP_FINAL_APPROVE: 'pmp:final:approve',
  PMP_SIGN: 'pmp:sign',

  // Operational Modules
  RISK_EDIT: 'risk:edit',
  QUALITY_EDIT: 'quality:edit',
  SAFETY_EDIT: 'safety:edit',
  SCHEDULE_VIEW: 'schedule:view',
  SCHEDULE_EDIT: 'schedule:edit',
  SCHEDULE_IMPORT: 'schedule:import',
  SCHEDULE_MANAGE: 'schedule:manage',
  SUPERINTENDENT_PLAN_EDIT: 'superintendent:plan:edit',
  LESSONS_EDIT: 'lessons:edit',

  // Monthly Review
  MONTHLY_REVIEW_PM: 'monthly:review:pm',
  MONTHLY_REVIEW_PX: 'monthly:review:px',
  MONTHLY_REVIEW_CREATE: 'monthly:review:create',

  // Job Number Requests / Project Number Requests
  PROJECT_NUMBER_REQUEST_VIEW: 'project_number_request:view',
  JOB_NUMBER_REQUEST_CREATE: 'job_number_request:create',
  JOB_NUMBER_REQUEST_FINALIZE: 'job_number_request:finalize',
  ACCOUNTING_QUEUE_VIEW: 'accounting_queue:view',

  // Estimating Kick-Off
  KICKOFF_VIEW: 'kickoff:view',
  KICKOFF_EDIT: 'kickoff:edit',
  KICKOFF_TEMPLATE_EDIT: 'kickoff:template:edit',

  // Post-Bid Autopsy
  AUTOPSY_VIEW: 'autopsy:view',
  AUTOPSY_CREATE: 'autopsy:create',
  AUTOPSY_EDIT: 'autopsy:edit',
  AUTOPSY_SCHEDULE: 'autopsy:schedule',

  // Buyout Log
  BUYOUT_VIEW: 'buyout:view',
  BUYOUT_EDIT: 'buyout:edit',
  BUYOUT_MANAGE: 'buyout:manage',

  // Commitment Approval
  COMMITMENT_SUBMIT: 'commitment:submit',
  COMMITMENT_APPROVE_PX: 'commitment:approve:px',
  COMMITMENT_APPROVE_COMPLIANCE: 'commitment:approve:compliance',
  COMMITMENT_APPROVE_CFO: 'commitment:approve:cfo',
  COMMITMENT_ESCALATE: 'commitment:escalate',

  // Contract Tracking
  CONTRACT_TRACKING_SUBMIT: 'contractTracking:submit',
  CONTRACT_TRACKING_APPROVE_APM: 'contractTracking:approve:apm',
  CONTRACT_TRACKING_APPROVE_PM: 'contractTracking:approve:pm',
  CONTRACT_TRACKING_APPROVE_RISK: 'contractTracking:approve:risk',
  CONTRACT_TRACKING_APPROVE_PX: 'contractTracking:approve:px',

  // Active Projects Portfolio
  ACTIVE_PROJECTS_VIEW: 'active_projects:view',
  ACTIVE_PROJECTS_SYNC: 'active_projects:sync',

  // Compliance Log
  COMPLIANCE_LOG_VIEW: 'compliance_log:view',

  // Workflow Definitions
  WORKFLOW_MANAGE: 'workflow:manage',

  // Turnover Agenda
  TURNOVER_AGENDA_EDIT: 'turnover:agenda:edit',
  TURNOVER_SIGN: 'turnover:sign',

  // Permission Engine
  PERMISSION_TEMPLATES_MANAGE: 'permission:templates:manage',
  PERMISSION_PROJECT_TEAM_MANAGE: 'permission:project_team:manage',
  PERMISSION_PROJECT_TEAM_VIEW: 'permission:project_team:view',

  // Go/No-Go Review (Director/Committee)
  GONOGO_REVIEW: 'gonogo:review',

  // Assignment Mappings Admin
  ADMIN_ASSIGNMENTS: 'admin:assignments:manage',

  // Constraints Log
  CONSTRAINTS_VIEW: 'constraints:view',
  CONSTRAINTS_EDIT: 'constraints:edit',
  CONSTRAINTS_MANAGE: 'constraints:manage',

  // Permits Log
  PERMITS_VIEW: 'permits:view',
  PERMITS_EDIT: 'permits:edit',
  PERMITS_MANAGE: 'permits:manage',

  // Template Sync (GitOps)
  ADMIN_TEMPLATE_SYNC: 'admin:template:sync',

  // External Connectors (Phase 4A)
  CONNECTOR_VIEW: 'connector:view',
  CONNECTOR_MANAGE: 'connector:manage',
  CONNECTOR_SYNC: 'connector:sync',

  // Procore Integration (Phase 4D)
  PROCORE_VIEW: 'procore:view',
  PROCORE_SYNC: 'procore:sync',

  // BambooHR Integration (Phase 4D)
  BAMBOO_VIEW: 'bamboo:view',
  BAMBOO_SYNC: 'bamboo:sync',

  // Shared Services (Phase 4)
  SHARED_SERVICES_HUB_VIEW: 'shared_services:hub:view',
  HR_VIEW: 'hr:view',
  HR_EDIT: 'hr:edit',
  RISK_MANAGEMENT_VIEW: 'risk_management:view',
  RISK_MANAGEMENT_EDIT: 'risk_management:edit',

  // HB Site Control (Phase 4)
  SITE_CONTROL_HUB_VIEW: 'site_control:hub:view',
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/** All permission values as an array — used for dev-mode full-access override */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/** All 16 role string values for convenience */
const ALL_ROLE_NAMES = [
  'Administrator', 'Leadership', 'Marketing Manager', 'Preconstruction Manager',
  'Business Development Manager', 'Estimator', 'IDS Manager',
  'Commercial Operations Manager', 'Luxury Residential Manager',
  'Manager of Operational Excellence', 'Safety Manager', 'Quality Control Manager',
  'Warranty Manager', 'Human Resources Manager', 'Accounting Manager', 'Risk Manager',
];

// Nav group visibility by role — every role has full access to all nav groups
export const NAV_GROUP_ROLES: Record<string, string[]> = {
  Marketing: ALL_ROLE_NAMES,
  Preconstruction: ALL_ROLE_NAMES,
  Operations: ALL_ROLE_NAMES,
  Accounting: ALL_ROLE_NAMES,
  Admin: ALL_ROLE_NAMES,
  'Human Resources': ALL_ROLE_NAMES,
  'Shared Services': ALL_ROLE_NAMES,
  'HB Site Control': ALL_ROLE_NAMES,
  'Procore Integration': ALL_ROLE_NAMES,
  'BambooHR': ALL_ROLE_NAMES,
};

// ---------------------------------------------------------------------------
// Stage 3 (sub-task 2): Granular per-role permission sets.
// Single source of truth — each role receives only the permissions it needs.
// Administrator retains ALL. Dev/mock mode can override via ALL_PERMISSIONS.
// ---------------------------------------------------------------------------

const P = PERMISSIONS;

const READ_VIEW_PERMISSIONS: string[] = ALL_PERMISSIONS.filter(
  p => p.includes(':read') || p.includes(':view')
);

export const ROLE_PERMISSION_SETS: Record<string, ReadonlySet<string>> = {
  'Administrator': new Set(ALL_PERMISSIONS),

  'Leadership': new Set(READ_VIEW_PERMISSIONS),

  'Preconstruction Manager': new Set([
    P.LEAD_CREATE, P.LEAD_READ, P.LEAD_EDIT, P.LEAD_DELETE,
    P.GONOGO_SCORE_ORIGINATOR, P.GONOGO_SCORE_COMMITTEE, P.GONOGO_SUBMIT, P.GONOGO_DECIDE, P.GONOGO_READ, P.GONOGO_REVIEW,
    P.PRECON_READ, P.PRECON_EDIT,
    P.PROPOSAL_READ, P.PROPOSAL_EDIT,
    P.WINLOSS_RECORD, P.WINLOSS_READ,
    P.ESTIMATING_READ,
    P.KICKOFF_VIEW, P.KICKOFF_EDIT, P.KICKOFF_TEMPLATE_EDIT,
    P.AUTOPSY_VIEW, P.AUTOPSY_CREATE, P.AUTOPSY_EDIT, P.AUTOPSY_SCHEDULE,
    P.ACTIVE_PROJECTS_VIEW,
    P.PROJECT_HUB_VIEW, P.PRECON_HUB_VIEW,
    P.MEETING_SCHEDULE, P.MEETING_READ,
    P.PROJECT_NUMBER_REQUEST_VIEW, P.JOB_NUMBER_REQUEST_CREATE,
    P.WORKFLOW_MANAGE,
  ]),

  'Business Development Manager': new Set([
    P.LEAD_CREATE, P.LEAD_READ, P.LEAD_EDIT, P.LEAD_DELETE,
    P.GONOGO_SCORE_ORIGINATOR, P.GONOGO_SUBMIT, P.GONOGO_READ,
    P.PRECON_READ,
    P.PROPOSAL_READ, P.PROPOSAL_EDIT,
    P.WINLOSS_RECORD, P.WINLOSS_READ,
    P.ACTIVE_PROJECTS_VIEW,
    P.PRECON_HUB_VIEW,
    P.MEETING_SCHEDULE, P.MEETING_READ,
  ]),

  'Estimator': new Set([
    P.ESTIMATING_READ, P.ESTIMATING_EDIT,
    P.KICKOFF_VIEW, P.KICKOFF_EDIT, P.KICKOFF_TEMPLATE_EDIT,
    P.AUTOPSY_VIEW, P.AUTOPSY_CREATE, P.AUTOPSY_EDIT, P.AUTOPSY_SCHEDULE,
    P.PRECON_READ,
    P.PRECON_HUB_VIEW,
    P.PROJECT_NUMBER_REQUEST_VIEW, P.JOB_NUMBER_REQUEST_CREATE,
    P.MEETING_READ,
  ]),

  'IDS Manager': new Set([
    P.PRECON_READ, P.PRECON_EDIT,
    P.PRECON_HUB_VIEW,
    P.ESTIMATING_READ,
    P.MEETING_READ,
  ]),

  'Marketing Manager': new Set([
    P.MARKETING_EDIT, P.MARKETING_DASHBOARD_VIEW,
    P.SHARED_SERVICES_HUB_VIEW,
  ]),

  'Commercial Operations Manager': new Set([
    P.PROJECT_HUB_VIEW,
    P.CONTRACT_READ, P.CONTRACT_EDIT, P.CONTRACT_VIEW_FINANCIALS,
    P.TURNOVER_READ, P.TURNOVER_EDIT, P.TURNOVER_AGENDA_EDIT, P.TURNOVER_SIGN,
    P.CLOSEOUT_READ, P.CLOSEOUT_EDIT,
    P.PMP_EDIT, P.PMP_APPROVE, P.PMP_FINAL_APPROVE, P.PMP_SIGN,
    P.SCHEDULE_VIEW, P.SCHEDULE_EDIT, P.SCHEDULE_IMPORT, P.SCHEDULE_MANAGE,
    P.BUYOUT_VIEW, P.BUYOUT_EDIT, P.BUYOUT_MANAGE,
    P.COMMITMENT_SUBMIT, P.COMMITMENT_APPROVE_PX, P.COMMITMENT_APPROVE_COMPLIANCE, P.COMMITMENT_APPROVE_CFO, P.COMMITMENT_ESCALATE,
    P.CONTRACT_TRACKING_SUBMIT, P.CONTRACT_TRACKING_APPROVE_APM, P.CONTRACT_TRACKING_APPROVE_PM, P.CONTRACT_TRACKING_APPROVE_RISK, P.CONTRACT_TRACKING_APPROVE_PX,
    P.STARTUP_CHECKLIST_EDIT, P.STARTUP_CHECKLIST_SIGNOFF, P.MATRIX_EDIT, P.PROJECT_RECORD_EDIT, P.PROJECT_RECORD_OPS_EDIT,
    P.MONTHLY_REVIEW_PM, P.MONTHLY_REVIEW_PX, P.MONTHLY_REVIEW_CREATE,
    P.CONSTRAINTS_VIEW, P.CONSTRAINTS_EDIT, P.CONSTRAINTS_MANAGE,
    P.PERMITS_VIEW, P.PERMITS_EDIT, P.PERMITS_MANAGE,
    P.SUPERINTENDENT_PLAN_EDIT,
    P.RISK_EDIT, P.QUALITY_EDIT, P.SAFETY_EDIT, P.LESSONS_EDIT,
    P.ACTIVE_PROJECTS_VIEW,
    P.COMPLIANCE_LOG_VIEW,
    P.PROCORE_VIEW,
    P.MEETING_SCHEDULE, P.MEETING_READ,
  ]),

  'Luxury Residential Manager': new Set([
    P.PROJECT_HUB_VIEW,
    P.CONTRACT_READ, P.CONTRACT_EDIT, P.CONTRACT_VIEW_FINANCIALS,
    P.TURNOVER_READ, P.TURNOVER_EDIT, P.TURNOVER_AGENDA_EDIT, P.TURNOVER_SIGN,
    P.CLOSEOUT_READ, P.CLOSEOUT_EDIT,
    P.PMP_EDIT, P.PMP_APPROVE, P.PMP_SIGN,
    P.SCHEDULE_VIEW, P.SCHEDULE_EDIT, P.SCHEDULE_IMPORT,
    P.BUYOUT_VIEW, P.BUYOUT_EDIT, P.BUYOUT_MANAGE,
    P.COMMITMENT_SUBMIT, P.COMMITMENT_ESCALATE,
    P.CONTRACT_TRACKING_SUBMIT, P.CONTRACT_TRACKING_APPROVE_APM, P.CONTRACT_TRACKING_APPROVE_PM,
    P.STARTUP_CHECKLIST_EDIT, P.STARTUP_CHECKLIST_SIGNOFF, P.MATRIX_EDIT, P.PROJECT_RECORD_EDIT, P.PROJECT_RECORD_OPS_EDIT,
    P.MONTHLY_REVIEW_PM, P.MONTHLY_REVIEW_CREATE,
    P.CONSTRAINTS_VIEW, P.CONSTRAINTS_EDIT,
    P.PERMITS_VIEW, P.PERMITS_EDIT,
    P.SUPERINTENDENT_PLAN_EDIT,
    P.RISK_EDIT, P.QUALITY_EDIT, P.SAFETY_EDIT, P.LESSONS_EDIT,
    P.ACTIVE_PROJECTS_VIEW,
    P.PROCORE_VIEW,
    P.MEETING_SCHEDULE, P.MEETING_READ,
  ]),

  'Manager of Operational Excellence': new Set([
    P.PROJECT_HUB_VIEW,
    P.STARTUP_CHECKLIST_EDIT, P.STARTUP_CHECKLIST_SIGNOFF,
    P.SCHEDULE_VIEW,
    P.ACTIVE_PROJECTS_VIEW,
    P.SAFETY_EDIT, P.QUALITY_EDIT, P.LESSONS_EDIT,
    P.MEETING_READ,
  ]),

  'Safety Manager': new Set([
    P.SAFETY_EDIT,
    P.SITE_CONTROL_HUB_VIEW,
    P.PROJECT_HUB_VIEW,
    P.SCHEDULE_VIEW,
    P.ACTIVE_PROJECTS_VIEW,
    P.MEETING_READ,
  ]),

  'Quality Control Manager': new Set([
    P.QUALITY_EDIT,
    P.SITE_CONTROL_HUB_VIEW,
    P.PROJECT_HUB_VIEW,
    P.SCHEDULE_VIEW,
    P.ACTIVE_PROJECTS_VIEW,
    P.MEETING_READ,
  ]),

  'Warranty Manager': new Set([
    P.QUALITY_EDIT,
    P.PROJECT_HUB_VIEW,
    P.MEETING_READ,
  ]),

  'Human Resources Manager': new Set([
    P.HR_VIEW, P.HR_EDIT,
    P.BAMBOO_VIEW, P.BAMBOO_SYNC,
    P.SHARED_SERVICES_HUB_VIEW,
  ]),

  'Accounting Manager': new Set([
    P.ACCOUNTING_QUEUE_VIEW,
    P.CONTRACT_VIEW_FINANCIALS, P.CONTRACT_READ,
    P.JOB_NUMBER_REQUEST_FINALIZE, P.PROJECT_NUMBER_REQUEST_VIEW,
    P.SHARED_SERVICES_HUB_VIEW,
  ]),

  'Risk Manager': new Set([
    P.RISK_MANAGEMENT_VIEW, P.RISK_MANAGEMENT_EDIT,
    P.COMPLIANCE_LOG_VIEW,
    P.CONTRACT_READ,
    P.CONTRACT_TRACKING_APPROVE_RISK,
    P.SHARED_SERVICES_HUB_VIEW,
  ]),
};

// Backward-compatible array form derived from the Set-based source of truth
export const ROLE_PERMISSIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(ROLE_PERMISSION_SETS).map(([role, perms]) => [role, Array.from(perms)])
);

/** Role-to-landing-page route mapping for the 16 standard roles */
export const ROLE_LANDING_ROUTES: Record<string, string> = {
  'Administrator': '/admin',
  'Leadership': '/hub',
  'Marketing Manager': '/marketing',
  'Preconstruction Manager': '/preconstruction',
  'Business Development Manager': '/business-development',
  'Estimator': '/estimating',
  'IDS Manager': '/ids',
  'Commercial Operations Manager': '/operations',
  'Luxury Residential Manager': '/operations',
  'Manager of Operational Excellence': '/opex',
  'Safety Manager': '/safety',
  'Quality Control Manager': '/qc-warranty',
  'Warranty Manager': '/qc-warranty',
  'Human Resources Manager': '/people-culture',
  'Accounting Manager': '/accounting',
  'Risk Manager': '/risk-management',
};

// ---------------------------------------------------------------------------
// Stage 2: Role-specific navigation config (sub-task 2)
// ---------------------------------------------------------------------------

/** Per-role navigation visibility — defines which workspaces and sidebar groups a role accesses */
export interface IRoleNavConfig {
  workspaces: string[];
  sidebarGroups?: Record<string, string[]>;
}

export const ROLE_NAV_ITEMS: Record<string, IRoleNavConfig> = {
  'Administrator': {
    workspaces: ['admin', 'preconstruction', 'operations', 'shared-services', 'site-control'],
  },
  'Leadership': {
    workspaces: [],
  },
  'Marketing Manager': {
    workspaces: ['shared-services'],
    sidebarGroups: { 'shared-services': ['Marketing'] },
  },
  'Preconstruction Manager': {
    workspaces: ['preconstruction'],
  },
  'Business Development Manager': {
    workspaces: ['preconstruction'],
    sidebarGroups: { preconstruction: ['Business Development'] },
  },
  'Estimator': {
    workspaces: ['preconstruction'],
    sidebarGroups: { preconstruction: ['Estimating'] },
  },
  'IDS Manager': {
    workspaces: ['preconstruction'],
    sidebarGroups: { preconstruction: ['Innovation & Digital Services'] },
  },
  'Commercial Operations Manager': {
    workspaces: ['operations'],
    sidebarGroups: { operations: ['Operations', 'Commercial Operations'] },
  },
  'Luxury Residential Manager': {
    workspaces: ['operations'],
    sidebarGroups: { operations: ['Operations', 'Commercial Operations'] },
  },
  'Manager of Operational Excellence': {
    workspaces: ['operations'],
    sidebarGroups: { operations: ['Operations', 'Operational Excellence'] },
  },
  'Safety Manager': {
    workspaces: ['operations', 'site-control'],
    sidebarGroups: { operations: ['Operations', 'Safety'], 'site-control': ['Safety'] },
  },
  'Quality Control Manager': {
    workspaces: ['operations', 'site-control'],
    sidebarGroups: { operations: ['Operations', 'Quality Control & Warranty'], 'site-control': ['Quality Control'] },
  },
  'Warranty Manager': {
    workspaces: ['operations'],
    sidebarGroups: { operations: ['Operations', 'Quality Control & Warranty'] },
  },
  'Human Resources Manager': {
    workspaces: ['shared-services'],
    sidebarGroups: { 'shared-services': ['Human Resources', 'BambooHR'] },
  },
  'Accounting Manager': {
    workspaces: ['shared-services'],
    sidebarGroups: { 'shared-services': ['Accounting'] },
  },
  'Risk Manager': {
    workspaces: ['shared-services'],
    sidebarGroups: { 'shared-services': ['Risk Management'] },
  },
};

/** Landing page metadata for each role — icon, title, description, default visible sections */
export interface ILandingPageConfig {
  icon: string;
  title: string;
  description: string;
  defaultVisibleSections: string[];
}

export const LANDING_PAGE_CONFIG: Record<string, ILandingPageConfig> = {
  'Administrator': {
    icon: 'Settings24Regular',
    title: 'System Administration',
    description: 'Manage system configuration, security, and provisioning',
    defaultVisibleSections: ['System Configuration', 'Security & Access', 'Provisioning', 'Dev Tools'],
  },
  'Leadership': {
    icon: 'Home24Regular',
    title: 'Analytics Hub',
    description: 'Enterprise-wide project intelligence and performance metrics',
    defaultVisibleSections: ['KPIs', 'Charts', 'Activity Feed'],
  },
  'Marketing Manager': {
    icon: 'Megaphone24Regular',
    title: 'Marketing Dashboard',
    description: 'Campaign management, resources, and request tracking',
    defaultVisibleSections: ['Resources', 'Requests', 'Tracking'],
  },
  'Preconstruction Manager': {
    icon: 'DocumentSearch24Regular',
    title: 'Preconstruction Hub',
    description: 'Business development, estimating, and IDS oversight',
    defaultVisibleSections: ['Business Development', 'Estimating', 'Innovation & Digital Services'],
  },
  'Business Development Manager': {
    icon: 'Handshake24Regular',
    title: 'Business Development',
    description: 'Lead management, Go/No-Go, pipeline, and opportunity tracking',
    defaultVisibleSections: ['Lead Management', 'Go/No-Go', 'Pipeline'],
  },
  'Estimator': {
    icon: 'Calculator24Regular',
    title: 'Estimating Dashboard',
    description: 'Department tracking, project number requests, and post-bid autopsies',
    defaultVisibleSections: ['Department Tracking', 'Project Number Requests', 'Post-Bid Autopsies'],
  },
  'IDS Manager': {
    icon: 'LaptopSettings24Regular',
    title: 'Innovation & Digital Services',
    description: 'IDS tracking, technology initiatives, and digital delivery',
    defaultVisibleSections: ['IDS Tracking', 'Documents'],
  },
  'Commercial Operations Manager': {
    icon: 'BuildingFactory24Regular',
    title: 'Operations Dashboard',
    description: 'Commercial project delivery, scheduling, and financial forecasting',
    defaultVisibleSections: ['Commercial Operations', 'Project Hub', 'Financial Forecasting'],
  },
  'Luxury Residential Manager': {
    icon: 'BuildingDesktop24Regular',
    title: 'Operations Dashboard',
    description: 'Luxury residential project delivery and operations oversight',
    defaultVisibleSections: ['Commercial Operations', 'Luxury Residential'],
  },
  'Manager of Operational Excellence': {
    icon: 'Lightbulb24Regular',
    title: 'Operational Excellence',
    description: 'Onboarding, training, and continuous improvement programs',
    defaultVisibleSections: ['Onboarding', 'Training'],
  },
  'Safety Manager': {
    icon: 'Shield24Regular',
    title: 'Safety Dashboard',
    description: 'Safety training, certifications, scorecards, and jobsite inspections',
    defaultVisibleSections: ['Training & Certification', 'Safety Scorecard', 'Inspections'],
  },
  'Quality Control Manager': {
    icon: 'Checkmark24Regular',
    title: 'QC & Warranty Dashboard',
    description: 'Quality assurance tracking, checklists, and issue resolution',
    defaultVisibleSections: ['QA Tracking', 'Checklists', 'Best Practices'],
  },
  'Warranty Manager': {
    icon: 'ReceiptMoney24Regular',
    title: 'QC & Warranty Dashboard',
    description: 'Warranty management and quality control oversight',
    defaultVisibleSections: ['Warranty', 'QA Tracking'],
  },
  'Human Resources Manager': {
    icon: 'People24Regular',
    title: 'People & Culture',
    description: 'HR operations, openings, announcements, and employee programs',
    defaultVisibleSections: ['Openings', 'Announcements', 'Initiatives'],
  },
  'Accounting Manager': {
    icon: 'Money24Regular',
    title: 'Accounting Dashboard',
    description: 'Project setup, accounts receivable, and financial reporting',
    defaultVisibleSections: ['New Project Setup', 'Accounts Receivable Report'],
  },
  'Risk Manager': {
    icon: 'ShieldTask24Regular',
    title: 'Risk Management',
    description: 'Knowledge center, risk requests, and enrollment tracking',
    defaultVisibleSections: ['Knowledge Center', 'Requests', 'Enrollment Tracking'],
  },
};

// ---------------------------------------------------------------------------
// Stage 3 (sub-task 2): Expanded granular permission checks.
// Role-based predicate functions for fine-grained access control across all
// major feature domains. Each checks the user's roles array, not permission
// strings, providing a readable API for component-level gating.
// ---------------------------------------------------------------------------

const roleCheck = (roles: string[], allowed: string[]): boolean =>
  roles.some(r => allowed.includes(r));

export const GRANULAR_PERMISSIONS = {
  // Financial & Accounting
  canViewFinancials: (roles: string[]): boolean =>
    roleCheck(roles, ['Accounting Manager', 'Leadership', 'Administrator']),
  canEditAccounting: (roles: string[]): boolean =>
    roleCheck(roles, ['Accounting Manager', 'Administrator']),
  canFinalizeJobNumbers: (roles: string[]): boolean =>
    roleCheck(roles, ['Accounting Manager', 'Administrator']),

  // Project Operations
  canEditProjects: (roles: string[]): boolean =>
    roleCheck(roles, ['Commercial Operations Manager', 'Luxury Residential Manager', 'Administrator']),
  canManageSchedule: (roles: string[]): boolean =>
    roleCheck(roles, ['Commercial Operations Manager', 'Luxury Residential Manager', 'Administrator']),
  canApprovePMP: (roles: string[]): boolean =>
    roleCheck(roles, ['Commercial Operations Manager', 'Administrator']),
  canManageBuyout: (roles: string[]): boolean =>
    roleCheck(roles, ['Commercial Operations Manager', 'Luxury Residential Manager', 'Administrator']),
  canApproveCommitments: (roles: string[]): boolean =>
    roleCheck(roles, ['Commercial Operations Manager', 'Administrator']),

  // Safety & Quality
  canManageSafety: (roles: string[]): boolean =>
    roleCheck(roles, ['Safety Manager', 'Administrator']),
  canManageQuality: (roles: string[]): boolean =>
    roleCheck(roles, ['Quality Control Manager', 'Warranty Manager', 'Administrator']),
  canManageWarranty: (roles: string[]): boolean =>
    roleCheck(roles, ['Warranty Manager', 'Administrator']),

  // Preconstruction
  canManageLeads: (roles: string[]): boolean =>
    roleCheck(roles, ['Preconstruction Manager', 'Business Development Manager', 'Administrator']),
  canDecideGoNoGo: (roles: string[]): boolean =>
    roleCheck(roles, ['Preconstruction Manager', 'Leadership', 'Administrator']),
  canEditEstimates: (roles: string[]): boolean =>
    roleCheck(roles, ['Estimator', 'Preconstruction Manager', 'Administrator']),
  canManageIDS: (roles: string[]): boolean =>
    roleCheck(roles, ['IDS Manager', 'Preconstruction Manager', 'Administrator']),

  // Shared Services
  canEditMarketing: (roles: string[]): boolean =>
    roleCheck(roles, ['Marketing Manager', 'Administrator']),
  canEditHR: (roles: string[]): boolean =>
    roleCheck(roles, ['Human Resources Manager', 'Administrator']),
  canEditRiskManagement: (roles: string[]): boolean =>
    roleCheck(roles, ['Risk Manager', 'Administrator']),

  // Administration
  canAccessAdmin: (roles: string[]): boolean =>
    roleCheck(roles, ['Administrator']),
  canManagePermissions: (roles: string[]): boolean =>
    roleCheck(roles, ['Administrator']),
} as const;

export interface IWorkspaceVisibilityOptions<TWorkspace extends { id: string; requireProject?: boolean }> {
  workspaces: readonly TWorkspace[];
  primaryRole: string;
  isMockMode: boolean;
  hasSelectedProject: boolean;
}

export function filterVisibleWorkspaces<TWorkspace extends { id: string; requireProject?: boolean }>(
  options: IWorkspaceVisibilityOptions<TWorkspace>
): TWorkspace[] {
  const { workspaces, primaryRole, isMockMode, hasSelectedProject } = options;

  let filtered = workspaces.filter((workspace) => !workspace.requireProject || hasSelectedProject);

  if (!isMockMode && primaryRole) {
    const navConfig = ROLE_NAV_ITEMS[primaryRole];
    if (navConfig) {
      filtered = filtered.filter((workspace) => navConfig.workspaces.includes(workspace.id));
    }
  }

  return filtered;
}

export interface ISidebarGroupVisibilityOptions<TGroup extends { label: string }> {
  groups: readonly TGroup[];
  workspaceId: string;
  primaryRole: string;
  isMockMode: boolean;
}

export function filterVisibleSidebarGroups<TGroup extends { label: string }>(
  options: ISidebarGroupVisibilityOptions<TGroup>
): TGroup[] {
  const { groups, workspaceId, primaryRole, isMockMode } = options;

  if (isMockMode || !primaryRole) {
    return [...groups];
  }

  const navConfig = ROLE_NAV_ITEMS[primaryRole];
  const allowedGroups = navConfig?.sidebarGroups?.[workspaceId];
  if (!allowedGroups) {
    return [...groups];
  }

  return groups.filter((group) => allowedGroups.includes(group.label));
}

// ---------------------------------------------------------------------------

export type PermissionValue = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type RolePermissionMap = typeof ROLE_PERMISSIONS;
export type RolePermissionKey = keyof typeof ROLE_PERMISSIONS;

// ---------------------------------------------------------------------------
// Config-driven permission resolution (Phase 2)
// ---------------------------------------------------------------------------

import { normalizeRoleName } from '../models/IRoleConfiguration';
import type { IRoleConfiguration } from '../models/IRoleConfiguration';

/**
 * Resolves permissions from role configurations (config-driven).
 * Falls back to hard-coded ROLE_PERMISSIONS if no config available.
 */
export function resolvePermissionsFromConfig(
  roleConfigurations: IRoleConfiguration[],
  userRoles: string[],
): string[] {
  const normalizedRoles = userRoles.map(normalizeRoleName);
  const uniqueRoles = [...new Set(normalizedRoles)];
  const allPermissions = new Set<string>();

  for (const role of uniqueRoles) {
    const config = roleConfigurations.find(c => c.roleName === role && c.isActive);
    if (config) {
      config.defaultPermissions.forEach(p => allPermissions.add(p));
    } else {
      const hardCoded = ROLE_PERMISSIONS[role];
      if (hardCoded) {
        hardCoded.forEach(p => allPermissions.add(p));
      }
    }
  }

  return Array.from(allPermissions);
}

/**
 * Checks if any of the user's roles (normalized) grant global access.
 */
export function hasGlobalAccess(
  roleConfigurations: IRoleConfiguration[],
  userRoles: string[],
): boolean {
  const normalizedRoles = userRoles.map(normalizeRoleName);
  return normalizedRoles.some(role => {
    const config = roleConfigurations.find(c => c.roleName === role && c.isActive);
    return config?.isGlobal ?? false;
  });
}

/**
 * Resolves nav group access from role configurations.
 * Falls back to NAV_GROUP_ROLES if no config available.
 */
export function resolveNavGroupAccess(
  roleConfigurations: IRoleConfiguration[],
  userRoles: string[],
): string[] {
  const normalizedRoles = userRoles.map(normalizeRoleName);
  const groups = new Set<string>();

  for (const role of normalizedRoles) {
    const config = roleConfigurations.find(c => c.roleName === role && c.isActive);
    if (config) {
      config.navGroupAccess.forEach(g => groups.add(g));
    } else {
      for (const [group, roles] of Object.entries(NAV_GROUP_ROLES)) {
        if (roles.includes(role)) groups.add(group);
      }
    }
  }

  return Array.from(groups);
}
