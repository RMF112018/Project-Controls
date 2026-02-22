/**
 * workspaceConfig.ts — Centralized workspace navigation configuration.
 * Single source of truth for all navigation structure per CLAUDE.md §23.
 *
 * Adding a new workspace or sidebar item requires ONLY editing this file.
 */
import { PERMISSIONS } from '@hbc/sp-services';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkspaceId = 'hub' | 'preconstruction' | 'operations' | 'shared-services' | 'admin' | 'qaqc-safety';

export interface ISidebarItem {
  label: string;
  path: string;
  requiresProject?: boolean;
  permission?: string;
  hubOnly?: boolean;
  featureFlag?: string;
}

export interface ISidebarSubGroup {
  label: string;
  items: ISidebarItem[];
  defaultExpanded?: boolean;
}

export interface ISidebarGroup {
  key: string;
  label: string;
  items: ISidebarItem[];
  subGroups?: ISidebarSubGroup[];
}

export interface IWorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  /** @fluentui/react-icons component name */
  iconName: string;
  basePath: string;
  /** Roles that can access this workspace (checked against NAV_GROUP_ROLES keys) */
  requiredGroupKeys: string[];
  /** Feature flag that must be enabled to show this workspace (optional) */
  featureFlag?: string;
  /** Sidebar groups for this workspace */
  sidebarGroups: ISidebarGroup[];
  /** Whether this workspace appears in the App Launcher grid */
  showInLauncher: boolean;
}

// ─── Workspace Definitions ───────────────────────────────────────────────────

export const WORKSPACES: IWorkspaceDefinition[] = [
  // Hub — always accessible, does NOT appear in launcher grid (it's the home page)
  {
    id: 'hub',
    label: 'Analytics Hub',
    shortLabel: 'Hub',
    iconName: 'Home24Regular',
    basePath: '/',
    requiredGroupKeys: [],
    sidebarGroups: [
      {
        key: 'hub-main',
        label: 'Hub',
        items: [
          { label: 'Dashboard', path: '/' },
          { label: 'New Lead', path: '/lead/new', permission: PERMISSIONS.LEAD_CREATE, featureFlag: 'LeadIntake' },
          { label: 'Job Number Request', path: '/job-request', permission: PERMISSIONS.JOB_NUMBER_REQUEST_CREATE },
        ],
      },
    ],
    showInLauncher: false,
  },

  // Preconstruction
  {
    id: 'preconstruction',
    label: 'Preconstruction',
    shortLabel: 'Precon',
    iconName: 'Notepad24Regular',
    basePath: '/preconstruction',
    requiredGroupKeys: ['Preconstruction'],
    sidebarGroups: [
      {
        key: 'precon-bd',
        label: 'Business Development',
        items: [
          { label: 'Estimating Dashboard', path: '/preconstruction', hubOnly: true, featureFlag: 'EstimatingTracker' },
          { label: 'Pipeline', path: '/preconstruction/pipeline', hubOnly: true, featureFlag: 'PipelineDashboard' },
          { label: 'Go/No-Go Tracker', path: '/preconstruction/pipeline/gonogo', hubOnly: true, featureFlag: 'GoNoGoScorecard' },
          { label: 'New Lead', path: '/lead/new', permission: PERMISSIONS.LEAD_CREATE, hubOnly: true, featureFlag: 'LeadIntake' },
        ],
      },
      {
        key: 'precon-estimating',
        label: 'Estimating',
        items: [
          { label: 'Precon Tracker', path: '/preconstruction/precon-tracker', hubOnly: true, featureFlag: 'EstimatingTracker' },
          { label: 'Estimate Log', path: '/preconstruction/estimate-log', hubOnly: true, featureFlag: 'EstimatingTracker' },
          { label: 'Kickoff List', path: '/preconstruction/kickoff-list', permission: PERMISSIONS.KICKOFF_VIEW },
          { label: 'Post-Bid Autopsies', path: '/preconstruction/autopsy-list', permission: PERMISSIONS.AUTOPSY_VIEW, featureFlag: 'LossAutopsy' },
          { label: 'Job Number Request', path: '/job-request', permission: PERMISSIONS.JOB_NUMBER_REQUEST_CREATE, hubOnly: true },
        ],
      },
    ],
    showInLauncher: true,
  },

  // Operations — with collapsible sub-groups per owner spec
  {
    id: 'operations',
    label: 'Operations',
    shortLabel: 'Ops',
    iconName: 'BuildingFactory24Regular',
    basePath: '/operations',
    requiredGroupKeys: ['Operations'],
    sidebarGroups: [
      {
        key: 'ops-project-hub',
        label: 'Project Hub',
        items: [
          { label: 'Project Dashboard', path: '/operations/project', requiresProject: true },
          { label: 'Project Settings', path: '/operations/project-settings', requiresProject: true, featureFlag: 'ContractTracking' },
          { label: 'Go/No-Go', path: '/operations/gonogo', requiresProject: true, featureFlag: 'GoNoGoScorecard' },
        ],
        subGroups: [
          {
            label: 'Project Manual',
            defaultExpanded: true,
            items: [
              { label: 'Management Plan', path: '/operations/management-plan', requiresProject: true, featureFlag: 'ProjectManagementPlan' },
              { label: "Super's Plan", path: '/operations/superintendent-plan', requiresProject: true },
              { label: 'Startup Checklist', path: '/operations/startup-checklist', requiresProject: true, featureFlag: 'ProjectStartup' },
              { label: 'ReadiCheck', path: '/operations/readicheck', requiresProject: true },
              { label: 'Best Practices', path: '/operations/best-practices', requiresProject: true },
              { label: 'Responsibility', path: '/operations/responsibility', requiresProject: true, featureFlag: 'ProjectStartup' },
              { label: 'Schedule', path: '/operations/schedule', requiresProject: true, featureFlag: 'ScheduleModule' },
              { label: 'Closeout Checklist', path: '/operations/closeout-checklist', requiresProject: true },
            ],
          },
          {
            label: 'Cost & Time',
            items: [
              { label: 'Buyout Log', path: '/operations/buyout-log', requiresProject: true, permission: PERMISSIONS.BUYOUT_VIEW },
              { label: 'Contract Tracking', path: '/operations/contract-tracking', requiresProject: true, featureFlag: 'ContractTracking' },
              { label: 'Risk/Cost Management', path: '/operations/risk-cost', requiresProject: true },
              { label: 'Monthly Review', path: '/operations/monthly-review', requiresProject: true, featureFlag: 'MonthlyProjectReview' },
            ],
          },
          {
            label: 'Logs & Reports',
            items: [
              { label: 'Constraints', path: '/operations/constraints-log', requiresProject: true, permission: PERMISSIONS.CONSTRAINTS_VIEW, featureFlag: 'ConstraintsLog' },
              { label: 'Permits', path: '/operations/permits-log', requiresProject: true, permission: PERMISSIONS.PERMITS_VIEW },
              { label: 'Compliance Log', path: '/operations/compliance-log', permission: PERMISSIONS.COMPLIANCE_LOG_VIEW },
            ],
          },
        ],
      },
      {
        key: 'ops-safety',
        label: 'Safety',
        items: [
          { label: 'Safety Concerns', path: '/operations/safety-concerns', requiresProject: true },
        ],
      },
      {
        key: 'ops-qc-warranty',
        label: 'QC & Warranty',
        items: [
          { label: 'Quality Concerns', path: '/operations/quality-concerns', requiresProject: true },
          { label: 'Sub Scorecard', path: '/operations/sub-scorecard', requiresProject: true },
        ],
      },
      {
        key: 'ops-project-record',
        label: 'Project Record',
        items: [
          { label: 'Lessons Learned', path: '/operations/lessons-learned', requiresProject: true },
          { label: 'Project Summary', path: '/operations/project-record', requiresProject: true },
        ],
      },
    ],
    showInLauncher: true,
  },

  // Shared Services — new workspace, routes at /shared-services/*
  {
    id: 'shared-services',
    label: 'Shared Services',
    shortLabel: 'Services',
    iconName: 'People24Regular',
    basePath: '/shared-services',
    requiredGroupKeys: ['Marketing', 'Accounting'],
    sidebarGroups: [
      {
        key: 'ss-marketing',
        label: 'Marketing',
        items: [
          { label: 'Marketing Dashboard', path: '/shared-services/marketing', permission: PERMISSIONS.MARKETING_DASHBOARD_VIEW, featureFlag: 'MarketingProjectRecord' },
          { label: 'Project Record', path: '/operations/project-record', requiresProject: true, featureFlag: 'MarketingProjectRecord' },
        ],
      },
      {
        key: 'ss-accounting',
        label: 'Accounting',
        items: [
          { label: 'Accounting Queue', path: '/shared-services/accounting', permission: PERMISSIONS.ACCOUNTING_QUEUE_VIEW },
        ],
      },
      {
        key: 'ss-hr',
        label: 'Human Resources',
        items: [
          { label: 'HR Dashboard', path: '/shared-services/hr' },
        ],
      },
      {
        key: 'ss-risk',
        label: 'Risk Management',
        items: [
          { label: 'Risk Management', path: '/shared-services/risk-management' },
        ],
      },
    ],
    showInLauncher: true,
  },

  // QA/QC & Safety — mobile-first workspace (Gen 3 readiness, Phase 4 full buildout)
  {
    id: 'qaqc-safety',
    label: 'QA/QC & Safety',
    shortLabel: 'QA/Safety',
    iconName: 'ShieldCheckmark24Regular',
    basePath: '/qaqc-safety',
    requiredGroupKeys: ['Operations'],
    featureFlag: 'QaqcSafetyWorkspace',
    sidebarGroups: [
      {
        key: 'qaqc-field',
        label: 'Field',
        items: [
          { label: 'Safety Inspections', path: '/qaqc-safety/inspections' },
          { label: 'Quality Checklists', path: '/qaqc-safety/checklists' },
        ],
      },
    ],
    showInLauncher: true,
  },

  // Admin
  {
    id: 'admin',
    label: 'Administration',
    shortLabel: 'Admin',
    iconName: 'Settings24Regular',
    basePath: '/admin',
    requiredGroupKeys: ['Admin'],
    sidebarGroups: [
      {
        key: 'admin-system',
        label: 'System',
        items: [
          { label: 'Admin Panel', path: '/admin', permission: PERMISSIONS.ADMIN_CONFIG },
          { label: 'Performance', path: '/admin/performance', permission: PERMISSIONS.ADMIN_CONFIG, featureFlag: 'PerformanceMonitoring' },
          { label: 'Application Support', path: '/admin/application-support', permission: PERMISSIONS.ADMIN_CONFIG, featureFlag: 'EnableHelpSystem' },
          { label: 'Telemetry', path: '/admin/telemetry', permission: PERMISSIONS.ADMIN_CONFIG, featureFlag: 'TelemetryDashboard' },
        ],
      },
    ],
    showInLauncher: true,
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Map of workspace ID to definition for O(1) lookup */
export const WORKSPACE_MAP: Record<WorkspaceId, IWorkspaceDefinition> = {} as Record<WorkspaceId, IWorkspaceDefinition>;
for (const ws of WORKSPACES) {
  WORKSPACE_MAP[ws.id] = ws;
}

/** Launcher-visible workspaces only */
export const LAUNCHER_WORKSPACES = WORKSPACES.filter(ws => ws.showInLauncher);

/**
 * Derive the active workspace from the current pathname.
 * Pure function — no state, no side effects.
 */
export function getWorkspaceFromPath(pathname: string): WorkspaceId {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/operations')) return 'operations';
  if (pathname.startsWith('/preconstruction') || pathname.startsWith('/lead') || pathname.startsWith('/job-request')) return 'preconstruction';
  if (pathname.startsWith('/shared-services')) return 'shared-services';
  if (pathname.startsWith('/qaqc-safety')) return 'qaqc-safety';
  return 'hub';
}
