/**
 * Permission Dual-Path Parity Tests (Phase 7S4)
 *
 * Validates that the PermissionEngine path (TOOL_DEFINITIONS + permissionTemplates.json)
 * and the ROLE_PERMISSIONS fallback path produce consistent permission sets for all roles.
 *
 * Path A (legacy): ROLE_PERMISSIONS — hard-coded arrays of permission strings per role name
 * Path B (engine): resolveToolPermissions(template.toolAccess, TOOL_DEFINITIONS) — resolves
 *   from permission template toolAccess entries + TOOL_DEFINITIONS levels + granular flags
 *
 * Known state: The engine path does not yet cover every legacy permission for all roles.
 * These tests establish the baseline, document known gaps, and verify that the engine
 * path correctly resolves permissions for the tool definitions it does cover.
 *
 * ~35 tests, 585+ individual assertions across parity, completeness, negative, and correctness.
 */
import { ROLE_PERMISSIONS, PERMISSIONS } from '../permissions';
import { resolveToolPermissions, TOOL_DEFINITIONS } from '../toolPermissionMap';
import type { IToolAccess } from '../../models/IPermissionTemplate';
import { PermissionLevel } from '../../models/enums';
import permissionTemplates from '../../mock/permissionTemplates.json';
import securityGroupMappings from '../../mock/securityGroupMappings.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve engine-path permissions for a given template ID.
 * Finds the template in permissionTemplates.json, passes its toolAccess
 * through resolveToolPermissions with the production TOOL_DEFINITIONS.
 */
function resolveEnginePerms(templateId: number): string[] {
  const template = permissionTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found in permissionTemplates.json`);
  }
  return resolveToolPermissions(
    template.toolAccess as IToolAccess[],
    TOOL_DEFINITIONS,
  );
}

// ---------------------------------------------------------------------------
// Legacy role name -> template ID mapping
//
// Only roles with a direct template counterpart are mapped. Roles without
// a 1:1 template (Preconstruction Team, Legal, Marketing, Quality Control,
// Safety) are intentionally excluded from parity checks — they have no
// engine-path template yet and rely on ROLE_PERMISSIONS exclusively.
// ---------------------------------------------------------------------------
const LEGACY_TO_TEMPLATE: Array<{ legacyRole: string; templateId: number; templateName: string }> = [
  { legacyRole: 'Executive Leadership', templateId: 1, templateName: 'President / VP Operations' },
  { legacyRole: 'IDS',                  templateId: 2, templateName: 'OpEx Manager' },
  { legacyRole: 'Department Director',  templateId: 3, templateName: 'Project Executive' },
  { legacyRole: 'Operations Team',      templateId: 4, templateName: 'Project Manager' },
  { legacyRole: 'Estimating Coordinator', templateId: 5, templateName: 'Estimating Coordinator' },
  { legacyRole: 'BD Representative',    templateId: 6, templateName: 'BD Representative' },
  { legacyRole: 'Accounting Manager',   templateId: 7, templateName: 'Accounting Controller' },
  { legacyRole: 'Risk Management',      templateId: 8, templateName: 'Read-Only Observer' },
  { legacyRole: 'SharePoint Admin',     templateId: 9, templateName: 'SharePoint Admin' },
];

// Roles that have no direct template mapping — documented for clarity.
const UNMAPPED_ROLES = ['Preconstruction Team', 'Legal', 'Marketing', 'Quality Control', 'Safety'];

// ---------------------------------------------------------------------------
// Known gap baselines per role.
// These are legacy permissions that the engine path does not yet resolve.
// When TOOL_DEFINITIONS is extended to cover these permissions, the
// corresponding entries should be removed and the parity test will enforce it.
// ---------------------------------------------------------------------------
const KNOWN_GAPS: Record<string, string[]> = {
  'Executive Leadership': [
    'gonogo:review', 'contract:view:financials', 'admin:template:sync',
    'admin:assignments:manage', 'meeting:schedule', 'autopsy:create',
    'contractTracking:approve:px', 'compliance_log:view', 'turnover:agenda:edit',
    'turnover:sign', 'permission:project_team:view', 'connector:view',
    'connector:manage', 'connector:sync', 'project_number_request:view',
  ],
  'IDS': [
    'admin:template:sync', 'permission:project_team:view',
  ],
  'Department Director': [
    'gonogo:review', 'contract:view:financials', 'meeting:schedule',
    'kickoff:edit', 'kickoff:template:edit', 'autopsy:create', 'autopsy:edit',
    'autopsy:schedule', 'precon:hub:view', 'contractTracking:approve:px',
    'compliance_log:view', 'turnover:agenda:edit', 'turnover:sign',
    'permission:project_team:view', 'hr:edit', 'risk_management:edit',
    'project_number_request:view', 'job_number_request:create', 'bamboo:sync',
  ],
  'Operations Team': [
    'turnover:edit', 'closeout:edit', 'projectrecord:ops:edit', 'schedule:manage',
    'buyout:manage', 'contractTracking:submit', 'contractTracking:approve:apm',
    'contractTracking:approve:pm', 'compliance_log:view', 'turnover:agenda:edit',
    'turnover:sign', 'constraints:manage', 'permits:manage',
    'project_number_request:view', 'procore:sync',
  ],
  'Estimating Coordinator': [
    'proposal:edit', 'project_number_request:view', 'autopsy:create',
    'turnover:agenda:edit', 'turnover:sign',
  ],
  'BD Representative': [
    'lead:delete', 'winloss:record', 'meeting:schedule', 'site:provision',
    'autopsy:create', 'autopsy:edit', 'autopsy:schedule',
    'marketing:dashboard:view', 'marketing:edit', 'projectrecord:edit',
    'precon:hub:view',
  ],
  'Accounting Manager': [
    'contract:view:financials', 'project_number_request:view',
  ],
  'Risk Management': [
    'risk:edit', 'commitment:approve:compliance', 'commitment:escalate',
    'contractTracking:approve:risk', 'compliance_log:view', 'risk_management:edit',
  ],
  'SharePoint Admin': [
    'proposal:edit', 'winloss:record', 'contract:edit', 'contract:view:financials',
    'turnover:edit', 'closeout:edit', 'project:hub:view', 'site:provision',
    'meeting:schedule', 'project_number_request:view', 'autopsy:create',
    'commitment:approve:compliance', 'contractTracking:submit',
    'contractTracking:approve:apm', 'contractTracking:approve:pm',
    'contractTracking:approve:risk', 'contractTracking:approve:px',
    'compliance_log:view', 'turnover:agenda:edit', 'turnover:sign',
    'permission:project_team:view', 'gonogo:review', 'admin:assignments:manage',
    'constraints:view', 'constraints:edit', 'constraints:manage',
    'permits:view', 'permits:edit', 'permits:manage', 'admin:template:sync',
    'connector:view', 'connector:manage', 'connector:sync',
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Permission Dual-Path Parity (Phase 7S4)', () => {

  // =========================================================================
  // Section 1: Engine path covers legacy path modulo known gaps
  // =========================================================================
  describe('Engine path covers legacy path (modulo known gaps)', () => {

    it.each(LEGACY_TO_TEMPLATE)(
      '$legacyRole (template $templateId: $templateName): all non-gap legacy permissions exist in engine-path resolution',
      ({ legacyRole, templateId }) => {
        const legacyPerms = ROLE_PERMISSIONS[legacyRole];
        expect(legacyPerms).toBeDefined();
        expect(legacyPerms.length).toBeGreaterThan(0);

        const enginePerms = resolveEnginePerms(templateId);
        const knownGaps = KNOWN_GAPS[legacyRole] || [];

        // Every legacy permission not in the known gap list must be in engine perms.
        const unexpected: string[] = [];
        for (const perm of legacyPerms) {
          if (knownGaps.includes(perm)) continue;
          if (!enginePerms.includes(perm)) {
            unexpected.push(perm);
          }
        }

        expect(unexpected).toEqual([]);
      },
    );

    it('unmapped roles are documented and present in ROLE_PERMISSIONS', () => {
      for (const role of UNMAPPED_ROLES) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Section 2: Known gaps are real — verify they are actually missing
  // =========================================================================
  describe('Known gaps baseline is accurate', () => {

    it.each(LEGACY_TO_TEMPLATE)(
      '$legacyRole (template $templateId): every documented gap is genuinely missing from engine path',
      ({ legacyRole, templateId }) => {
        const enginePerms = resolveEnginePerms(templateId);
        const knownGaps = KNOWN_GAPS[legacyRole] || [];

        // If a gap entry IS found in engine perms, it means the gap was closed
        // and the KNOWN_GAPS baseline should be updated (test enforces accuracy).
        const falsGaps: string[] = [];
        for (const gap of knownGaps) {
          if (enginePerms.includes(gap)) {
            falsGaps.push(gap);
          }
        }

        expect(falsGaps).toEqual([]);
      },
    );
  });

  // =========================================================================
  // Section 3: Template completeness — tool key coverage
  // =========================================================================
  describe('Template completeness — tool key coverage', () => {
    const allToolKeys = TOOL_DEFINITIONS.map(d => d.toolKey);

    // Templates 1-5 cover all tool keys
    it.each([
      { id: 1, name: 'President / VP Operations' },
      { id: 2, name: 'OpEx Manager' },
      { id: 3, name: 'Project Executive' },
      { id: 4, name: 'Project Manager' },
      { id: 5, name: 'Estimating Coordinator' },
    ])(
      'template $id ($name) covers all TOOL_DEFINITIONS tool keys',
      ({ id }) => {
        const template = permissionTemplates.find(t => t.id === id);
        expect(template).toBeDefined();

        const toolKeys = template!.toolAccess.map((ta: { toolKey: string }) => ta.toolKey);

        const missingKeys: string[] = [];
        for (const defKey of allToolKeys) {
          if (!toolKeys.includes(defKey)) {
            missingKeys.push(defKey);
          }
        }

        expect(missingKeys).toEqual([]);
      },
    );

    // Templates 6-9 are missing project_hub, constraints_log, permits_log
    const KNOWN_MISSING_KEYS = ['project_hub', 'constraints_log', 'permits_log'];

    it.each([
      { id: 6, name: 'BD Representative' },
      { id: 7, name: 'Accounting Controller' },
      { id: 8, name: 'Read-Only Observer' },
      { id: 9, name: 'SharePoint Admin' },
    ])(
      'template $id ($name) covers all keys except known missing: project_hub, constraints_log, permits_log',
      ({ id }) => {
        const template = permissionTemplates.find(t => t.id === id);
        expect(template).toBeDefined();

        const toolKeys = template!.toolAccess.map((ta: { toolKey: string }) => ta.toolKey);

        const missingKeys: string[] = [];
        for (const defKey of allToolKeys) {
          if (!toolKeys.includes(defKey)) {
            missingKeys.push(defKey);
          }
        }

        // Should only be missing the known keys, no more, no fewer
        expect(missingKeys.sort()).toEqual(KNOWN_MISSING_KEYS.sort());
      },
    );

    it('TOOL_DEFINITIONS has exactly 32 tool definitions', () => {
      expect(TOOL_DEFINITIONS.length).toBe(32);
    });
  });

  // =========================================================================
  // Section 4: Negative assertions — restricted templates lack admin perms
  // =========================================================================
  describe('Negative assertions — restricted templates lack admin permissions', () => {
    const ADMIN_PERMS = [
      PERMISSIONS.ADMIN_ROLES,
      PERMISSIONS.ADMIN_FLAGS,
      PERMISSIONS.ADMIN_CONFIG,
      PERMISSIONS.ADMIN_CONNECTIONS,
      PERMISSIONS.ADMIN_PROVISIONING,
      PERMISSIONS.ADMIN_TEMPLATE_SYNC,
      PERMISSIONS.PERMISSION_TEMPLATES_MANAGE,
      PERMISSIONS.PERMISSION_PROJECT_TEAM_MANAGE,
    ];

    it('Read-Only Observer (template 8) has zero admin-level permissions', () => {
      const perms = resolveEnginePerms(8);
      for (const adminPerm of ADMIN_PERMS) {
        expect(perms).not.toContain(adminPerm);
      }
      // Also verify no write-level operations permissions
      expect(perms).not.toContain(PERMISSIONS.LEAD_CREATE);
      expect(perms).not.toContain(PERMISSIONS.LEAD_EDIT);
      expect(perms).not.toContain(PERMISSIONS.LEAD_DELETE);
      expect(perms).not.toContain(PERMISSIONS.PMP_EDIT);
      expect(perms).not.toContain(PERMISSIONS.BUYOUT_EDIT);
      expect(perms).not.toContain(PERMISSIONS.WORKFLOW_MANAGE);
    });

    it('BD Representative (template 6) does not grant admin:config', () => {
      const perms = resolveEnginePerms(6);
      expect(perms).not.toContain(PERMISSIONS.ADMIN_CONFIG);
    });

    it('BD Representative (template 6) does not grant admin:roles', () => {
      const perms = resolveEnginePerms(6);
      expect(perms).not.toContain(PERMISSIONS.ADMIN_ROLES);
    });

    it('Estimating Coordinator (template 5) does not grant buyout:manage', () => {
      const perms = resolveEnginePerms(5);
      expect(perms).not.toContain(PERMISSIONS.BUYOUT_MANAGE);
    });

    it('Estimating Coordinator (template 5) does not grant admin:provisioning', () => {
      const perms = resolveEnginePerms(5);
      expect(perms).not.toContain(PERMISSIONS.ADMIN_PROVISIONING);
    });

    it('Accounting Controller (template 7) does not grant pmp:edit', () => {
      const perms = resolveEnginePerms(7);
      expect(perms).not.toContain(PERMISSIONS.PMP_EDIT);
    });

    it('Project Manager (template 4) does not grant admin:config', () => {
      const perms = resolveEnginePerms(4);
      expect(perms).not.toContain(PERMISSIONS.ADMIN_CONFIG);
    });
  });

  // =========================================================================
  // Section 5: resolveToolPermissions correctness
  // =========================================================================
  describe('resolveToolPermissions correctness', () => {

    it('ADMIN level on leads tool grants lead:create, lead:read, lead:edit, lead:delete', () => {
      const access: IToolAccess[] = [
        { toolKey: 'leads', level: PermissionLevel.ADMIN },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      expect(perms).toContain('lead:create');
      expect(perms).toContain('lead:read');
      expect(perms).toContain('lead:edit');
      expect(perms).toContain('lead:delete');
    });

    it('READ_ONLY level on leads tool grants only lead:read', () => {
      const access: IToolAccess[] = [
        { toolKey: 'leads', level: PermissionLevel.READ_ONLY },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      expect(perms).toContain('lead:read');
      // Should NOT have write permissions
      expect(perms).not.toContain('lead:create');
      expect(perms).not.toContain('lead:edit');
      expect(perms).not.toContain('lead:delete');
    });

    it('NONE level on leads tool grants nothing from leads definition', () => {
      const access: IToolAccess[] = [
        { toolKey: 'leads', level: PermissionLevel.NONE },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      // Only the 7 base read permissions should be present
      expect(perms).not.toContain('lead:read');
      expect(perms).not.toContain('lead:create');
      expect(perms).not.toContain('lead:edit');
      expect(perms).not.toContain('lead:delete');
      expect(perms.length).toBe(7); // 7 base read permissions
    });

    it('STANDARD level on leads tool grants read, edit, create but not delete', () => {
      const access: IToolAccess[] = [
        { toolKey: 'leads', level: PermissionLevel.STANDARD },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      expect(perms).toContain('lead:read');
      expect(perms).toContain('lead:edit');
      expect(perms).toContain('lead:create');
      expect(perms).not.toContain('lead:delete');
    });

    it('granular flag can_delete_leads adds lead:delete', () => {
      const access: IToolAccess[] = [
        {
          toolKey: 'leads',
          level: PermissionLevel.STANDARD,
          granularFlags: ['can_delete_leads'],
        },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      expect(perms).toContain('lead:delete');
      // STANDARD-level permissions should still be present
      expect(perms).toContain('lead:read');
      expect(perms).toContain('lead:edit');
      expect(perms).toContain('lead:create');
    });

    it('granular flag can_score_committee adds gonogo:score:committee', () => {
      const access: IToolAccess[] = [
        {
          toolKey: 'gonogo',
          level: PermissionLevel.READ_ONLY,
          granularFlags: ['can_score_committee'],
        },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      expect(perms).toContain('gonogo:score:committee');
      expect(perms).toContain('gonogo:read');
    });

    it('unknown toolKey is silently skipped', () => {
      const access: IToolAccess[] = [
        { toolKey: 'totally_fake_tool_999', level: PermissionLevel.ADMIN },
      ];
      const perms = resolveToolPermissions(access, TOOL_DEFINITIONS);
      // Only the 7 base read permissions
      expect(perms.length).toBe(7);
    });

    it('empty toolAccess array returns only base read permissions', () => {
      const perms = resolveToolPermissions([], TOOL_DEFINITIONS);
      expect(perms.length).toBe(7);
      expect(perms).toContain('meeting:read');
      expect(perms).toContain('precon:read');
      expect(perms).toContain('proposal:read');
      expect(perms).toContain('winloss:read');
      expect(perms).toContain('contract:read');
      expect(perms).toContain('turnover:read');
      expect(perms).toContain('closeout:read');
    });
  });

  // =========================================================================
  // Section 6: Total permission count sanity
  // =========================================================================
  describe('Total permission count sanity', () => {

    it('President / VP (template 1) resolves the most permissions of any template (full tool key coverage + all granular flags)', () => {
      const presidentPerms = resolveEnginePerms(1);
      // Templates 6-9 are missing project_hub, constraints_log, permits_log tool keys,
      // so template 1 (which has all 32 keys + max granular flags) resolves the most.
      for (const t of permissionTemplates) {
        if (t.id === 1) continue;
        const otherPerms = resolveEnginePerms(t.id);
        expect(presidentPerms.length).toBeGreaterThanOrEqual(otherPerms.length);
      }
    });

    it('Read-Only Observer resolves fewer perms than Executive Leadership', () => {
      const observerPerms = resolveEnginePerms(8);
      const leadershipPerms = resolveEnginePerms(1);
      expect(observerPerms.length).toBeLessThan(leadershipPerms.length);
    });

    it('President / VP (template 1) resolves more perms than Project Manager (template 4)', () => {
      const presidentPerms = resolveEnginePerms(1);
      const pmPerms = resolveEnginePerms(4);
      expect(presidentPerms.length).toBeGreaterThan(pmPerms.length);
    });

    it('Legacy SharePoint Admin has ALL PERMISSIONS values (uses Object.values spread)', () => {
      const legacySP = ROLE_PERMISSIONS['SharePoint Admin'];
      const allValues = Object.values(PERMISSIONS);
      expect(legacySP.length).toBe(allValues.length);
      for (const val of allValues) {
        expect(legacySP).toContain(val);
      }
    });
  });

  // =========================================================================
  // Section 7: Security group mapping integrity
  // =========================================================================
  describe('Security group mapping integrity', () => {

    it('all 9 security group mappings reference valid template IDs', () => {
      const templateIds = permissionTemplates.map((t: { id: number }) => t.id);
      for (const mapping of securityGroupMappings) {
        expect(templateIds).toContain(mapping.defaultTemplateId);
      }
    });

    it('all 9 security group mappings are active', () => {
      for (const mapping of securityGroupMappings) {
        expect(mapping.isActive).toBe(true);
      }
    });

    it('security group mappings cover template IDs 1 through 9', () => {
      const mappedTemplateIds = securityGroupMappings
        .map((m: { defaultTemplateId: number }) => m.defaultTemplateId)
        .sort((a: number, b: number) => a - b);
      expect(mappedTemplateIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('each security group mapping has a unique securityGroupId', () => {
      const ids = securityGroupMappings.map((m: { securityGroupId: string }) => m.securityGroupId);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  // =========================================================================
  // Section 8: Template metadata consistency
  // =========================================================================
  describe('Template metadata consistency', () => {

    it('all 9 templates are active', () => {
      for (const template of permissionTemplates) {
        expect(template.isActive).toBe(true);
      }
    });

    it('exactly one template is the default (Read-Only Observer)', () => {
      const defaults = permissionTemplates.filter((t: { isDefault: boolean }) => t.isDefault);
      expect(defaults.length).toBe(1);
      expect(defaults[0].id).toBe(8);
      expect(defaults[0].name).toBe('Read-Only Observer');
    });

    it('global templates are President/VP, OpEx, Read-Only Observer, and SharePoint Admin', () => {
      const globals = permissionTemplates
        .filter((t: { isGlobal: boolean }) => t.isGlobal)
        .map((t: { id: number }) => t.id)
        .sort((a: number, b: number) => a - b);
      expect(globals).toEqual([1, 2, 8, 9]);
    });

    it('globalAccess (full write) is only on President/VP, OpEx, and SharePoint Admin', () => {
      const fullAccess = permissionTemplates
        .filter((t: { globalAccess: boolean }) => t.globalAccess)
        .map((t: { id: number }) => t.id)
        .sort((a: number, b: number) => a - b);
      expect(fullAccess).toEqual([1, 2, 9]);
    });
  });

  // =========================================================================
  // Section 9: Gap count baseline snapshot (regression guard)
  // =========================================================================
  describe('Gap count baseline snapshot', () => {

    it.each(LEGACY_TO_TEMPLATE)(
      '$legacyRole (template $templateId): known gap count matches baseline',
      ({ legacyRole, templateId }) => {
        const legacyPerms = ROLE_PERMISSIONS[legacyRole];
        const enginePerms = resolveEnginePerms(templateId);
        const actual = legacyPerms.filter((p: string) => !enginePerms.includes(p));
        const expected = KNOWN_GAPS[legacyRole] || [];

        // If fewer gaps than baseline -> someone closed gaps without updating tests (good, update baseline)
        // If more gaps than baseline -> regression (bad, engine lost coverage)
        expect(actual.sort()).toEqual(expected.sort());
      },
    );

    it('total known gap count across all roles is 108', () => {
      let total = 0;
      for (const gaps of Object.values(KNOWN_GAPS)) {
        total += gaps.length;
      }
      expect(total).toBe(108);
    });
  });
});
