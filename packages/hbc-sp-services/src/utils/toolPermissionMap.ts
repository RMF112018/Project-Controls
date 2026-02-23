import { IToolDefinition, IToolAccess } from '../models/IPermissionTemplate';
import { PermissionLevel } from '../models/enums';

export const TOOL_DEFINITIONS: IToolDefinition[] = [
  // Marketing group
  {
    toolKey: 'marketing_dashboard',
    toolGroup: 'marketing',
    label: 'Marketing Dashboard',
    description: 'Marketing dashboard and reporting',
    levels: {
      NONE: [],
      READ_ONLY: ['marketing:dashboard:view'],
      STANDARD: ['marketing:dashboard:view', 'marketing:edit'],
      ADMIN: ['marketing:dashboard:view', 'marketing:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'project_record',
    toolGroup: 'marketing',
    label: 'Marketing Project Record',
    description: 'Project record management for marketing team',
    levels: {
      NONE: [],
      READ_ONLY: ['projectrecord:edit'], // read access implied by projectrecord:edit for viewing
      STANDARD: ['projectrecord:edit', 'projectrecord:ops:edit'],
      ADMIN: ['projectrecord:edit', 'projectrecord:ops:edit'],
    },
    granularFlags: [],
  },
  // Preconstruction group
  {
    toolKey: 'leads',
    toolGroup: 'preconstruction',
    label: 'Lead Management',
    description: 'Create, edit, and manage project leads',
    levels: {
      NONE: [],
      READ_ONLY: ['lead:read'],
      STANDARD: ['lead:read', 'lead:edit', 'lead:create'],
      ADMIN: ['lead:read', 'lead:edit', 'lead:create', 'lead:delete'],
    },
    granularFlags: [
      { key: 'can_delete_leads', label: 'Delete Leads', description: 'Allow deleting leads from the system', permissions: ['lead:delete'] },
      { key: 'can_decide_gonogo', label: 'Go/No-Go Decision', description: 'Allow making Go/No-Go final decisions', permissions: ['gonogo:decide'] },
    ],
  },
  {
    toolKey: 'gonogo',
    toolGroup: 'preconstruction',
    label: 'Go/No-Go Scorecard',
    description: 'Score and evaluate project opportunities',
    levels: {
      NONE: [],
      READ_ONLY: ['gonogo:read'],
      STANDARD: ['gonogo:read', 'gonogo:score:originator', 'gonogo:submit'],
      ADMIN: ['gonogo:read', 'gonogo:score:originator', 'gonogo:score:committee', 'gonogo:submit', 'gonogo:decide'],
    },
    granularFlags: [
      { key: 'can_score_committee', label: 'Committee Scoring', description: 'Allow entering committee scores', permissions: ['gonogo:score:committee'] },
    ],
  },
  {
    toolKey: 'estimating',
    toolGroup: 'preconstruction',
    label: 'Estimating Tracker',
    description: 'Track estimating activities and pursuits',
    levels: {
      NONE: [],
      READ_ONLY: ['estimating:read', 'precon:read'],
      STANDARD: ['estimating:read', 'estimating:edit', 'precon:read', 'precon:edit'],
      ADMIN: ['estimating:read', 'estimating:edit', 'precon:read', 'precon:edit', 'precon:hub:view'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'pipeline',
    toolGroup: 'preconstruction',
    label: 'Pipeline Dashboard',
    description: 'Pipeline visualization and reporting',
    levels: {
      NONE: [],
      READ_ONLY: ['precon:read'],
      STANDARD: ['precon:read', 'precon:hub:view'],
      ADMIN: ['precon:read', 'precon:hub:view'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'kickoff',
    toolGroup: 'preconstruction',
    label: 'Estimating Kick-Off',
    description: 'Estimating kick-off checklists and meetings',
    levels: {
      NONE: [],
      READ_ONLY: ['kickoff:view'],
      STANDARD: ['kickoff:view', 'kickoff:edit'],
      ADMIN: ['kickoff:view', 'kickoff:edit', 'kickoff:template:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'autopsy',
    toolGroup: 'preconstruction',
    label: 'Post-Bid Autopsy',
    description: 'Loss analysis and post-bid review',
    levels: {
      NONE: [],
      READ_ONLY: ['autopsy:view'],
      STANDARD: ['autopsy:view', 'autopsy:edit'],
      ADMIN: ['autopsy:view', 'autopsy:edit', 'autopsy:schedule'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'job_number',
    toolGroup: 'preconstruction',
    label: 'Job Number Request',
    description: 'Request and manage job numbers',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['job_number_request:create'],
      ADMIN: ['job_number_request:create', 'job_number_request:finalize'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'accounting_queue',
    toolGroup: 'preconstruction',
    label: 'Accounting Queue',
    description: 'Job number finalization and accounting queue',
    levels: {
      NONE: [],
      READ_ONLY: ['accounting_queue:view'],
      STANDARD: ['accounting_queue:view', 'job_number_request:finalize'],
      ADMIN: ['accounting_queue:view', 'job_number_request:finalize'],
    },
    granularFlags: [],
  },
  // Operations group
  {
    toolKey: 'project_hub',
    toolGroup: 'operations',
    label: 'Project Hub',
    description: 'Project hub overview and navigation',
    levels: {
      NONE: [],
      READ_ONLY: ['project:hub:view'],
      STANDARD: ['project:hub:view'],
      ADMIN: ['project:hub:view'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'active_projects',
    toolGroup: 'operations',
    label: 'Active Projects',
    description: 'Active project portfolio dashboard',
    levels: {
      NONE: [],
      READ_ONLY: ['active_projects:view'],
      STANDARD: ['active_projects:view'],
      ADMIN: ['active_projects:view', 'active_projects:sync'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'startup_checklist',
    toolGroup: 'operations',
    label: 'Startup Checklist',
    description: 'Project startup checklist management',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['startup:checklist:edit'],
      ADMIN: ['startup:checklist:edit', 'startup:checklist:signoff'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'pmp',
    toolGroup: 'operations',
    label: 'Management Plan',
    description: 'Project Management Plan (PMP) lifecycle',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['pmp:edit', 'pmp:sign'],
      ADMIN: ['pmp:edit', 'pmp:approve', 'pmp:final:approve', 'pmp:sign'],
    },
    granularFlags: [
      { key: 'can_final_approve', label: 'Final Approve', description: 'Allow final PMP approval', permissions: ['pmp:final:approve'] },
      { key: 'can_bypass_signatures', label: 'Bypass Signatures', description: 'Allow bypassing signature requirements', permissions: [] },
    ],
  },
  {
    toolKey: 'superintendent_plan',
    toolGroup: 'operations',
    label: "Superintendent's Plan",
    description: "Superintendent's project execution plan",
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['superintendent:plan:edit'],
      ADMIN: ['superintendent:plan:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'responsibility_matrices',
    toolGroup: 'operations',
    label: 'Responsibility Matrices',
    description: 'Internal, owner contract, and sub-contract matrices',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['matrix:edit'],
      ADMIN: ['matrix:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'buyout_log',
    toolGroup: 'operations',
    label: 'Buyout Log & Commitments',
    description: 'Buyout tracking and commitment approval workflow',
    levels: {
      NONE: [],
      READ_ONLY: ['buyout:view'],
      STANDARD: ['buyout:view', 'buyout:edit', 'commitment:submit'],
      ADMIN: ['buyout:view', 'buyout:edit', 'buyout:manage', 'commitment:submit', 'commitment:approve:px', 'commitment:approve:cfo', 'commitment:escalate'],
    },
    granularFlags: [
      { key: 'can_bypass_workflow', label: 'Bypass Approval', description: 'Allow bypassing commitment approval workflow', permissions: [] },
      { key: 'can_edit_closed_items', label: 'Edit Closed', description: 'Allow editing closed buyout items', permissions: [] },
      { key: 'can_approve_compliance', label: 'Compliance Approval', description: 'Allow compliance review approval', permissions: ['commitment:approve:compliance'] },
    ],
  },
  {
    toolKey: 'risk_cost',
    toolGroup: 'operations',
    label: 'Risk & Cost',
    description: 'Risk and cost management tracking',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['risk:edit'],
      ADMIN: ['risk:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'quality_safety',
    toolGroup: 'operations',
    label: 'Quality & Safety',
    description: 'Quality concerns and safety tracking',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['quality:edit', 'safety:edit'],
      ADMIN: ['quality:edit', 'safety:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'constraints_log',
    toolGroup: 'operations',
    label: 'Constraints Log',
    description: 'Project constraints tracking and management',
    levels: {
      NONE: [],
      READ_ONLY: ['constraints:view'],
      STANDARD: ['constraints:view', 'constraints:edit'],
      ADMIN: ['constraints:view', 'constraints:edit', 'constraints:manage'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'permits_log',
    toolGroup: 'operations',
    label: 'Permits Log',
    description: 'Permit tracking and management',
    levels: {
      NONE: [],
      READ_ONLY: ['permits:view'],
      STANDARD: ['permits:view', 'permits:edit'],
      ADMIN: ['permits:view', 'permits:edit', 'permits:manage'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'schedule',
    toolGroup: 'operations',
    label: 'Project Schedule',
    description: 'Project schedule and critical path management',
    levels: {
      NONE: [],
      READ_ONLY: ['schedule:view'],
      STANDARD: ['schedule:view', 'schedule:edit', 'schedule:import'],
      ADMIN: ['schedule:view', 'schedule:edit', 'schedule:import', 'schedule:manage'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'monthly_review',
    toolGroup: 'operations',
    label: 'Monthly Review',
    description: 'Monthly project review workflow',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['monthly:review:pm'],
      ADMIN: ['monthly:review:pm', 'monthly:review:px', 'monthly:review:create'],
    },
    granularFlags: [
      { key: 'can_create_reviews', label: 'Create Reviews', description: 'Allow creating new monthly reviews', permissions: ['monthly:review:create'] },
    ],
  },
  {
    toolKey: 'lessons_learned',
    toolGroup: 'operations',
    label: 'Lessons Learned',
    description: 'Project lessons learned documentation',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['lessons:edit'],
      ADMIN: ['lessons:edit'],
    },
    granularFlags: [],
  },
  // Shared Services group
  {
    toolKey: 'shared_services_hub',
    toolGroup: 'shared_services',
    label: 'Shared Services Hub',
    description: 'Shared Services workspace hub and cross-department access',
    levels: {
      NONE: [],
      READ_ONLY: ['shared_services:hub:view'],
      STANDARD: ['shared_services:hub:view'],
      ADMIN: ['shared_services:hub:view'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'hr',
    toolGroup: 'shared_services',
    label: 'Human Resources',
    description: 'Human Resources module — people & culture, openings, announcements',
    levels: {
      NONE: [],
      READ_ONLY: ['hr:view'],
      STANDARD: ['hr:view', 'hr:edit'],
      ADMIN: ['hr:view', 'hr:edit'],
    },
    granularFlags: [],
  },
  {
    toolKey: 'risk_management',
    toolGroup: 'shared_services',
    label: 'Risk Management',
    description: 'Risk Management module — knowledge center, requests, enrollment',
    levels: {
      NONE: [],
      READ_ONLY: ['risk_management:view'],
      STANDARD: ['risk_management:view', 'risk_management:edit'],
      ADMIN: ['risk_management:view', 'risk_management:edit'],
    },
    granularFlags: [],
  },
  // Admin group
  {
    toolKey: 'admin_panel',
    toolGroup: 'admin',
    label: 'Admin Panel',
    description: 'System administration and configuration',
    levels: {
      NONE: [],
      READ_ONLY: ['admin:config'],
      STANDARD: ['admin:config', 'admin:flags'],
      ADMIN: ['admin:roles', 'admin:flags', 'admin:config', 'admin:connections', 'admin:provisioning', 'permission:templates:manage', 'permission:project_team:manage'],
    },
    granularFlags: [
      { key: 'can_manage_provisioning', label: 'Manage Provisioning', description: 'Allow managing site provisioning', permissions: ['admin:provisioning'] },
    ],
  },
  {
    toolKey: 'workflow_definitions',
    toolGroup: 'admin',
    label: 'Workflow Definitions',
    description: 'Workflow definition and approval chain configuration',
    levels: {
      NONE: [],
      READ_ONLY: [],
      STANDARD: ['workflow:manage'],
      ADMIN: ['workflow:manage'],
    },
    granularFlags: [],
  },
];

/**
 * Resolve an array of tool access entries into a flat set of permission strings
 */
export function resolveToolPermissions(
  toolAccess: IToolAccess[],
  toolDefinitions: IToolDefinition[] = TOOL_DEFINITIONS
): string[] {
  const permissions: Set<string> = new Set();

  for (const access of toolAccess) {
    const def = toolDefinitions.find(t => t.toolKey === access.toolKey);
    if (!def) continue;

    // Add level-based permissions
    const levelPerms = def.levels[access.level] || [];
    for (const p of levelPerms) {
      permissions.add(p);
    }

    // Add granular flag permissions
    if (access.granularFlags) {
      for (const flagKey of access.granularFlags) {
        const flagDef = def.granularFlags.find(f => f.key === flagKey);
        if (flagDef) {
          for (const p of flagDef.permissions) {
            permissions.add(p);
          }
        }
      }
    }
  }

  // Always grant common read permissions for authenticated users
  permissions.add('meeting:read');
  permissions.add('precon:read');
  permissions.add('proposal:read');
  permissions.add('winloss:read');
  permissions.add('contract:read');
  permissions.add('turnover:read');
  permissions.add('closeout:read');

  return Array.from(permissions);
}

/**
 * Get tool definitions for a specific group
 */
export function getToolsByGroup(group: string): IToolDefinition[] {
  return TOOL_DEFINITIONS.filter(t => t.toolGroup === group);
}

/**
 * Get all available tool group names
 */
export const TOOL_GROUPS = ['marketing', 'preconstruction', 'operations', 'shared_services', 'admin'] as const;
export type ToolGroup = typeof TOOL_GROUPS[number];
