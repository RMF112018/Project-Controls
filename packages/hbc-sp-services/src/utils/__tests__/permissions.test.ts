import { PERMISSIONS, ROLE_PERMISSIONS, NAV_GROUP_ROLES } from '../permissions';

describe('permissions', () => {
  describe('PERMISSIONS constant', () => {
    it('has all expected permission keys', () => {
      expect(PERMISSIONS.LEAD_CREATE).toBe('lead:create');
      expect(PERMISSIONS.ADMIN_CONFIG).toBe('admin:config');
      expect(PERMISSIONS.WORKFLOW_MANAGE).toBe('workflow:manage');
      expect(PERMISSIONS.PERMISSION_TEMPLATES_MANAGE).toBe('permission:templates:manage');
    });
  });

  // Stage 3: Updated to reflect granular per-role permission sets.
  describe('ROLE_PERMISSIONS', () => {
    it('Leadership has only read/view permissions', () => {
      for (const perm of ROLE_PERMISSIONS['Leadership']) {
        expect(perm).toMatch(/:read|:view/);
      }
    });

    it('Business Development Manager has lead:create', () => {
      expect(ROLE_PERMISSIONS['Business Development Manager']).toContain('lead:create');
    });

    it('Business Development Manager has gonogo:submit', () => {
      expect(ROLE_PERMISSIONS['Business Development Manager']).toContain('gonogo:submit');
    });

    it('Estimator has estimating:edit', () => {
      expect(ROLE_PERMISSIONS['Estimator']).toContain('estimating:edit');
    });

    it('Administrator has ALL permissions', () => {
      const adminPerms = ROLE_PERMISSIONS['Administrator'];
      const allPerms = Object.values(PERMISSIONS);
      for (const perm of allPerms) {
        expect(adminPerms).toContain(perm);
      }
    });

    it('all 16 roles have entries', () => {
      const expectedRoles = [
        'Administrator', 'Leadership', 'Marketing Manager', 'Preconstruction Manager',
        'Business Development Manager', 'Estimator', 'IDS Manager',
        'Commercial Operations Manager', 'Luxury Residential Manager',
        'Manager of Operational Excellence', 'Safety Manager', 'Quality Control Manager',
        'Warranty Manager', 'Human Resources Manager', 'Accounting Manager', 'Risk Manager',
      ];
      for (const role of expectedRoles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it('Commercial Operations Manager has pmp:edit and pmp:approve', () => {
      expect(ROLE_PERMISSIONS['Commercial Operations Manager']).toContain('pmp:edit');
      expect(ROLE_PERMISSIONS['Commercial Operations Manager']).toContain('pmp:approve');
    });

    it('Risk Manager has risk_management and contract:read', () => {
      expect(ROLE_PERMISSIONS['Risk Manager']).toContain('risk_management:view');
      expect(ROLE_PERMISSIONS['Risk Manager']).toContain('risk_management:edit');
      expect(ROLE_PERMISSIONS['Risk Manager']).toContain('contract:read');
    });
  });

  describe('NAV_GROUP_ROLES', () => {
    it('Admin group includes Leadership and Administrator', () => {
      expect(NAV_GROUP_ROLES.Admin).toContain('Leadership');
      expect(NAV_GROUP_ROLES.Admin).toContain('Administrator');
    });

    it('Admin group includes all 16 roles', () => {
      const allRoles = Object.keys(ROLE_PERMISSIONS);
      for (const role of allRoles) {
        expect(NAV_GROUP_ROLES.Admin).toContain(role);
      }
    });

    it('Operations group includes Commercial Operations Manager', () => {
      expect(NAV_GROUP_ROLES.Operations).toContain('Commercial Operations Manager');
    });

    it('all nav groups have entries', () => {
      expect(NAV_GROUP_ROLES.Marketing).toBeDefined();
      expect(NAV_GROUP_ROLES.Preconstruction).toBeDefined();
      expect(NAV_GROUP_ROLES.Operations).toBeDefined();
      expect(NAV_GROUP_ROLES.Accounting).toBeDefined();
      expect(NAV_GROUP_ROLES.Admin).toBeDefined();
    });

    it('Marketing includes Business Development Manager', () => {
      expect(NAV_GROUP_ROLES.Marketing).toContain('Business Development Manager');
    });

    it('Preconstruction includes Risk Manager', () => {
      expect(NAV_GROUP_ROLES.Preconstruction).toContain('Risk Manager');
    });
  });
});
