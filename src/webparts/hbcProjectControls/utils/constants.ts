export const APP_VERSION = '1.0.0';

export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const CACHE_KEYS = {
  ROLES: 'hbc_roles',
  FEATURE_FLAGS: 'hbc_feature_flags',
  CONFIG: 'hbc_config',
  CURRENT_USER: 'hbc_current_user',
  LEADS: 'hbc_leads',
} as const;

export const LIST_NAMES = {
  LEADS_MASTER: 'Leads_Master',
  APP_ROLES: 'App_Roles',
  FEATURE_FLAGS: 'Feature_Flags',
  ESTIMATING_TRACKER: 'Estimating_Tracker',
  GNG_COMMITTEE: 'GNG_Committee',
  AUTOPSY_ATTENDEES: 'Autopsy_Attendees',
  TEMPLATE_REGISTRY: 'Template_Registry',
  REGIONS: 'Regions',
  SECTORS: 'Sectors',
  AUDIT_LOG: 'Audit_Log',
  PROVISIONING_LOG: 'Provisioning_Log',
  APP_CONTEXT_CONFIG: 'App_Context_Config',
  GONOGO_SCORECARD: 'GoNoGo_Scorecard',
  PROJECT_INFO: 'Project_Info',
  TEAM_MEMBERS: 'Team_Members',
  DELIVERABLES: 'Deliverables',
  ACTION_ITEMS: 'Action_Items',
  TURNOVER_CHECKLIST: 'Turnover_Checklist',
} as const;

export const ROUTES = {
  // Hub routes
  HUB_PIPELINE: '/',
  HUB_LEAD_NEW: '/lead/new',
  HUB_LEAD_EDIT: '/lead/:id',
  HUB_DASHBOARD: '/dashboard',
  HUB_ADMIN: '/admin',

  // Project routes
  PROJECT_HOME: '/',
  PROJECT_GONOGO: '/gonogo',
  PROJECT_GONOGO_MEETING: '/gonogo/meeting',
  PROJECT_KICKOFF: '/kickoff',
  PROJECT_DELIVERABLES: '/deliverables',
  PROJECT_INTERVIEW: '/interview',
  PROJECT_WINLOSS: '/winloss',
  PROJECT_LOSS_AUTOPSY: '/loss-autopsy',
  PROJECT_CONTRACT: '/contract',
  PROJECT_TURNOVER: '/turnover',
  PROJECT_DASHBOARD: '/project-dashboard',
  PROJECT_CLOSEOUT: '/closeout',

  // Precon routes
  PRECON_DASHBOARD: '/',
  PRECON_PURSUIT: '/pursuit/:id',
  PRECON_TRACKING: '/precon-tracking',
  PRECON_ESTIMATE_LOG: '/estimate-log',
  PRECON_GONOGO_TRACKER: '/gonogo-tracker',
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

export const OFFLINE_RETRY_INTERVAL_MS = 30000; // 30 seconds
export const MAX_OFFLINE_QUEUE_SIZE = 100;
export const FILE_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

export const SCORE_THRESHOLDS = {
  HIGH: 69,
  MID: 55,
} as const;
