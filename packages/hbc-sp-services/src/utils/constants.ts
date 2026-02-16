export const APP_VERSION = '1.0.0';

export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const CACHE_KEYS = {
  ROLES: 'hbc_roles',
  FEATURE_FLAGS: 'hbc_feature_flags',
  CONFIG: 'hbc_config',
  CURRENT_USER: 'hbc_current_user',
  LEADS: 'hbc_leads',
  SCORECARDS: 'hbc_scorecards',
  ESTIMATES: 'hbc_estimates',
  MEETINGS: 'hbc_meetings',
  PROJECTS: 'hbc_projects',
  ACTIVE_PROJECTS: 'hbc_active_projects',
  MARKETING_RECORDS: 'hbc_marketing_records',
  JOB_REQUESTS: 'hbc_job_requests',
  AUTOPSIES: 'hbc_autopsies',
  COMPLIANCE: 'hbc_compliance',
  WORKFLOWS: 'hbc_workflows',
  PERMISSIONS: 'hbc_permissions',
  TEMPLATES: 'hbc_templates',
  SECTORS: 'hbc_sectors',
  ASSIGNMENTS: 'hbc_assignments',
  KICKOFFS: 'hbc_kickoffs',
  QUALITY: 'hbc_quality',
  SAFETY: 'hbc_safety',
  RISK_COST: 'hbc_risk_cost',
  SCHEDULE: 'hbc_schedule',
  SUPER_PLAN: 'hbc_super_plan',
  LESSONS: 'hbc_lessons',
  PMP: 'hbc_pmp',
  MONTHLY_REVIEW: 'hbc_monthly_review',
  BUYOUT: 'hbc_buyout',
  CHECKLIST: 'hbc_checklist',
  MATRIX: 'hbc_matrix',
  TURNOVER: 'hbc_turnover',
} as const;

export const HUB_LISTS = {
  LEADS_MASTER: 'Leads_Master',
  APP_ROLES: 'App_Roles',
  FEATURE_FLAGS: 'Feature_Flags',
  APP_CONTEXT_CONFIG: 'App_Context_Config',
  AUDIT_LOG: 'Audit_Log',
  AUDIT_LOG_ARCHIVE: 'Audit_Log_Archive',
  PROVISIONING_LOG: 'Provisioning_Log',
  ESTIMATING_TRACKER: 'Estimating_Tracker',
  GONOGO_SCORECARD: 'GoNoGo_Scorecard',
  GNG_COMMITTEE: 'GNG_Committee',
  ACTIVE_PROJECTS_PORTFOLIO: 'Active_Projects_Portfolio',
  TEMPLATE_REGISTRY: 'Template_Registry',
  REGIONS: 'Regions',
  SECTORS: 'Sectors',
  AUTOPSY_ATTENDEES: 'Autopsy_Attendees',
  JOB_NUMBER_REQUESTS: 'Job_Number_Requests',
  ESTIMATING_KICKOFFS: 'Estimating_Kickoffs',
  ESTIMATING_KICKOFF_ITEMS: 'Estimating_Kickoff_Items',
  LOSS_AUTOPSIES: 'Loss_Autopsies',
  MARKETING_PROJECT_RECORDS: 'Marketing_Project_Records',
  LESSONS_LEARNED_HUB: 'Lessons_Learned_Hub',
  PROJECT_TYPES: 'Project_Types',
  STANDARD_COST_CODES: 'Standard_Cost_Codes',
  SCORECARD_APPROVAL_CYCLES: 'Scorecard_Approval_Cycles',
  SCORECARD_APPROVAL_STEPS: 'Scorecard_Approval_Steps',
  SCORECARD_VERSIONS: 'Scorecard_Versions',
  WORKFLOW_DEFINITIONS: 'Workflow_Definitions',
  WORKFLOW_STEPS: 'Workflow_Steps',
  WORKFLOW_CONDITIONAL_ASSIGNMENTS: 'Workflow_Conditional_Assignments',
  WORKFLOW_STEP_OVERRIDES: 'Workflow_Step_Overrides',
  PERMISSION_TEMPLATES: 'Permission_Templates',
  SECURITY_GROUP_MAPPINGS: 'Security_Group_Mappings',
  PROJECT_TEAM_ASSIGNMENTS: 'Project_Team_Assignments',
  SECTOR_DEFINITIONS: 'Sector_Definitions',
  ASSIGNMENT_MAPPINGS: 'Assignment_Mappings',
  PERFORMANCE_LOGS: 'Performance_Logs',
  HELP_GUIDES: 'Help_Guides',
  DIVISION_APPROVERS: 'Division_Approvers',
  PMP_BOILERPLATE: 'PMP_Boilerplate',
  PROJECT_DATA_MART: 'Project_Data_Mart',
} as const;

export const PROJECT_LISTS = {
  PROJECT_INFO: 'Project_Info',
  TEAM_MEMBERS: 'Team_Members',
  DELIVERABLES: 'Deliverables',
  ACTION_ITEMS: 'Action_Items',
  TURNOVER_CHECKLIST: 'Turnover_Checklist',
  BUYOUT_LOG: 'Buyout_Log',
  COMMITMENT_APPROVALS: 'Commitment_Approvals',
  STARTUP_CHECKLIST: 'Startup_Checklist',
  CHECKLIST_ACTIVITY_LOG: 'Checklist_Activity_Log',
  INTERNAL_MATRIX: 'Internal_Matrix',
  TEAM_ROLE_ASSIGNMENTS: 'Team_Role_Assignments',
  OWNER_CONTRACT_MATRIX: 'Owner_Contract_Matrix',
  SUB_CONTRACT_MATRIX: 'Sub_Contract_Matrix',
  RISK_COST_MANAGEMENT: 'Risk_Cost_Management',
  RISK_COST_ITEMS: 'Risk_Cost_Items',
  QUALITY_CONCERNS: 'Quality_Concerns',
  SAFETY_CONCERNS: 'Safety_Concerns',
  PROJECT_SCHEDULE: 'Project_Schedule',
  CRITICAL_PATH_ITEMS: 'Critical_Path_Items',
  SUPERINTENDENT_PLAN: 'Superintendent_Plan',
  SUPERINTENDENT_PLAN_SECTIONS: 'Superintendent_Plan_Sections',
  LESSONS_LEARNED: 'Lessons_Learned',
  PMP: 'Project_Management_Plans',
  PMP_SIGNATURES: 'PMP_Signatures',
  PMP_APPROVAL_CYCLES: 'PMP_Approval_Cycles',
  PMP_APPROVAL_STEPS: 'PMP_Approval_Steps',
  MONTHLY_REVIEWS: 'Monthly_Reviews',
  MONTHLY_CHECKLIST_ITEMS: 'Monthly_Checklist_Items',
  MONTHLY_FOLLOW_UPS: 'Monthly_Follow_Ups',
  CLOSEOUT_ITEMS: 'Closeout_Items',
  MARKETING_PROJECT_RECORD: 'Marketing_Project_Record',
  CONTRACT_INFO: 'Contract_Info',
  INTERVIEW_PREP: 'Interview_Prep',
  TURNOVER_AGENDAS: 'Turnover_Agendas',
  TURNOVER_PREREQUISITES: 'Turnover_Prerequisites',
  TURNOVER_DISCUSSION_ITEMS: 'Turnover_Discussion_Items',
  TURNOVER_SUBCONTRACTORS: 'Turnover_Subcontractors',
  TURNOVER_EXHIBITS: 'Turnover_Exhibits',
  TURNOVER_SIGNATURES: 'Turnover_Signatures',
  TURNOVER_ATTACHMENTS: 'Turnover_Attachments',
  TURNOVER_ESTIMATE_OVERVIEWS: 'Turnover_Estimate_Overviews',
} as const;

export const LIST_NAMES = { ...HUB_LISTS, ...PROJECT_LISTS } as const;

export const ROUTES = {
  // Dashboard
  DASHBOARD: '/',

  // Marketing
  MARKETING: '/marketing',

  // Preconstruction
  PRECON: '/preconstruction',
  PRECON_GONOGO: '/preconstruction/gonogo',
  PRECON_PIPELINE: '/preconstruction/pipeline',
  PRECON_PIPELINE_GONOGO: '/preconstruction/pipeline/gonogo',
  PRECON_TRACKING: '/preconstruction/precon-tracker',
  PRECON_ESTIMATE_LOG: '/preconstruction/estimate-log',
  PRECON_KICKOFF_LIST: '/preconstruction/kickoff-list',
  PRECON_AUTOPSY_LIST: '/preconstruction/autopsy-list',
  PRECON_PURSUIT: '/preconstruction/pursuit/:id',
  PRECON_PURSUIT_KICKOFF: '/preconstruction/pursuit/:id/kickoff',
  PRECON_PURSUIT_INTERVIEW: '/preconstruction/pursuit/:id/interview',
  PRECON_PURSUIT_WINLOSS: '/preconstruction/pursuit/:id/winloss',
  PRECON_PURSUIT_TURNOVER: '/preconstruction/pursuit/:id/turnover',
  PRECON_PURSUIT_AUTOPSY: '/preconstruction/pursuit/:id/autopsy',
  PRECON_PURSUIT_AUTOPSY_FORM: '/preconstruction/pursuit/:id/autopsy-form',
  PRECON_PURSUIT_DELIVERABLES: '/preconstruction/pursuit/:id/deliverables',

  // Lead
  LEAD_NEW: '/lead/new',
  LEAD_DETAIL: '/lead/:id',
  LEAD_GONOGO: '/lead/:id/gonogo',
  LEAD_GONOGO_DETAIL: '/lead/:id/gonogo/detail',
  LEAD_SCHEDULE_GONOGO: '/lead/:id/schedule-gonogo',

  // Operations
  OPERATIONS: '/operations',
  OPS_PROJECT: '/operations/project',
  OPS_STARTUP_CHECKLIST: '/operations/startup-checklist',
  OPS_MANAGEMENT_PLAN: '/operations/management-plan',
  OPS_SUPERINTENDENT_PLAN: '/operations/superintendent-plan',
  OPS_RESPONSIBILITY: '/operations/responsibility',
  OPS_CLOSEOUT: '/operations/closeout-checklist',
  OPS_BUYOUT: '/operations/buyout-log',
  OPS_CONTRACT: '/operations/contract-tracking',
  OPS_COMPLIANCE: '/operations/compliance-log',
  OPS_RISK_COST: '/operations/risk-cost',
  OPS_SCHEDULE: '/operations/schedule',
  OPS_QUALITY: '/operations/quality-concerns',
  OPS_SAFETY: '/operations/safety-concerns',
  OPS_MONTHLY_REVIEW: '/operations/monthly-review',
  OPS_PROJECT_RECORD: '/operations/project-record',
  OPS_LESSONS: '/operations/lessons-learned',
  OPS_GONOGO: '/operations/gonogo',

  // Job Request
  JOB_REQUEST: '/job-request',
  JOB_REQUEST_LEAD: '/job-request/:leadId',

  // Accounting
  ACCOUNTING_QUEUE: '/accounting-queue',

  // Admin
  ADMIN: '/admin',
  ADMIN_PERFORMANCE: '/admin/performance',
  ADMIN_APPLICATION_SUPPORT: '/admin/application-support',

  // System
  ACCESS_DENIED: '/access-denied',
} as const;

export const STAGE_ORDER: string[] = [
  'Lead-Discovery',
  'GoNoGo-Pending',
  'GoNoGo-Wait',
  'Opportunity',
  'Pursuit',
  'Won-ContractPending',
  'Active-Construction',
  'Closeout',
  'Archived-NoGo',
  'Archived-Loss',
  'Archived-Historical',
];

export const STAGE_COLORS: Record<string, string> = {
  'Lead-Discovery': '#3B82F6',
  'GoNoGo-Pending': '#F59E0B',
  'GoNoGo-Wait': '#EF4444',
  'Opportunity': '#8B5CF6',
  'Pursuit': '#6366F1',
  'Won-ContractPending': '#10B981',
  'Active-Construction': '#059669',
  'Closeout': '#6B7280',
  'Archived-NoGo': '#9CA3AF',
  'Archived-Loss': '#DC2626',
  'Archived-Historical': '#D1D5DB',
};

export const DIRECTORY_STRUCTURE = [
  '00_Project_Admin',
  '00_Project_Admin/Contracts',
  '00_Project_Admin/Contracts/Templates',
  '00_Project_Admin/Change_Orders',
  '00_Project_Admin/Insurance',
  '00_Project_Admin/Permits',
  '00_Project_Admin/RFI',
  '00_Project_Admin/Submittals',
  '00_Project_Admin/Meeting_Minutes',
  '00_Project_Admin/Turnover',
  '01_Preconstruction',
  '01_Preconstruction/Proposals',
  '01_Preconstruction/Estimates',
  '01_Preconstruction/Value_Engineering',
  '02_Safety',
  '02_Safety/Plans',
  '02_Safety/Inspections',
  '02_Safety/Incidents',
  '03_Quality_Control',
  '04_Design',
  '04_Design/Drawings',
  '04_Design/Specifications',
  '04_Design/Finish_Schedules',
  '05_Budget',
  '05_Budget/Cost_Reports',
  '05_Budget/Pay_Applications',
  '10_Scheduling',
  '20_Field_Operations',
  '20_Field_Operations/Daily_Reports',
  '20_Field_Operations/Photos',
  '30_Subcontracts',
  '30_Subcontracts/Div_01_General',
  '30_Subcontracts/Div_02_Existing_Conditions',
  '30_Subcontracts/Div_03_Concrete',
  '30_Subcontracts/Div_04_Masonry',
  '30_Subcontracts/Div_05_Metals',
  '30_Subcontracts/Div_06_Wood_Plastics',
  '30_Subcontracts/Div_07_Thermal_Moisture',
  '30_Subcontracts/Div_08_Openings',
  '30_Subcontracts/Div_09_Finishes',
  '30_Subcontracts/Div_10_Specialties',
  '30_Subcontracts/Div_11_Equipment',
  '30_Subcontracts/Div_12_Furnishings',
  '30_Subcontracts/Div_13_Special_Construction',
  '30_Subcontracts/Div_14_Conveying',
  '30_Subcontracts/Div_21_Fire_Suppression',
  '30_Subcontracts/Div_22_Plumbing',
  '30_Subcontracts/Div_23_HVAC',
  '30_Subcontracts/Div_26_Electrical',
  '30_Subcontracts/Div_27_Communications',
  '30_Subcontracts/Div_28_Electronic_Safety',
  '30_Subcontracts/Div_31_Earthwork',
  '30_Subcontracts/Div_32_Exterior_Improvements',
  '30_Subcontracts/Div_33_Utilities',
  '40_Closeout',
  '40_Closeout/Warranties',
  '40_Closeout/As_Builts',
  '40_Closeout/O_and_M_Manuals',
  '50_Marketing',
  '50_Marketing/Photos',
  '50_Marketing/Awards',
  '60_Media',
];

export const EVERIFY_STATUS_OPTIONS = [
  'Not Sent', 'Sent', 'Reminder Sent', 'Received', 'Overdue',
] as const;

export const OFFLINE_RETRY_INTERVAL_MS = 30000; // 30 seconds
export const MAX_OFFLINE_QUEUE_SIZE = 100;
export const FILE_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

export const SCORE_THRESHOLDS = {
  HIGH: 69,
  MID: 55,
} as const;

export const DEFAULT_HUB_SITE_URL = 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral';

export const PERFORMANCE_THRESHOLDS = {
  SLOW_LOAD_MS: 5000,
  WARNING_LOAD_MS: 3000,
  SAMPLE_RATE: 1.0,
} as const;

// BD Leads Document Library
export const BD_LEADS_SITE_URL = 'https://hedrickbrotherscom.sharepoint.com/sites/PXPortfolioDashboard';
export const BD_LEADS_LIBRARY = 'BD Leads';
export const BD_LEADS_SUBFOLDERS = [
  'Client Information', 'Correspondence', 'Proposal Documents',
  'Site and Project Plans', 'Financial Estimates', 'Evaluations and Scorecards',
  'Contracts and Legal', 'Media and Visuals', 'Archives',
];
