import { PERMISSIONS, ROLE_PERMISSIONS, NAV_GROUP_ROLES } from '../permissions';
import { RoleName } from '../../models/enums';

describe('permissions', () => {
  describe('PERMISSIONS constant', () => {
    it('has all expected permission keys', () => {
      expect(PERMISSIONS.LEAD_CREATE).toBe('lead:create');
      expect(PERMISSIONS.ADMIN_CONFIG).toBe('admin:config');
      expect(PERMISSIONS.WORKFLOW_MANAGE).toBe('workflow:manage');
      expect(PERMISSIONS.PERMISSION_TEMPLATES_MANAGE).toBe('permission:templates:manage');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('ExecutiveLeadership has admin:config', () => {
      expect(ROLE_PERMISSIONS['Executive Leadership']).toContain('admin:config');
    });

    it('DepartmentDirector does NOT have admin:config', () => {
      expect(ROLE_PERMISSIONS['Department Director']).not.toContain('admin:config');
    });

    it('DepartmentDirector does NOT have workflow:manage', () => {
      expect(ROLE_PERMISSIONS['Department Director']).not.toContain('workflow:manage');
    });

    it('BDRepresentative has lead:create', () => {
      expect(ROLE_PERMISSIONS['BD Representative']).toContain('lead:create');
    });

    it('BDRepresentative does NOT have admin:config', () => {
      expect(ROLE_PERMISSIONS['BD Representative']).not.toContain('admin:config');
    });

    it('EstimatingCoordinator has estimating:edit', () => {
      expect(ROLE_PERMISSIONS['Estimating Coordinator']).toContain('estimating:edit');
    });

    it('SharePointAdmin has ALL permissions', () => {
      const spAdminPerms = ROLE_PERMISSIONS['SharePoint Admin'];
      const allPerms = Object.values(PERMISSIONS);
      for (const perm of allPerms) {
        expect(spAdminPerms).toContain(perm);
      }
    });

    it('all 14 roles have entries', () => {
      const expectedRoles = [
        'BD Representative', 'Estimating Coordinator', 'Accounting Manager',
        'Preconstruction Team', 'Operations Team', 'Executive Leadership',
        'Department Director', 'Legal', 'Risk Management', 'Marketing',
        'Quality Control', 'Safety', 'IDS', 'SharePoint Admin',
      ];
      for (const role of expectedRoles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it('Operations Team has pmp:edit but not pmp:approve', () => {
      expect(ROLE_PERMISSIONS['Operations Team']).toContain('pmp:edit');
      expect(ROLE_PERMISSIONS['Operations Team']).not.toContain('pmp:approve');
    });

    it('Legal has contract:edit but not contract:view:financials', () => {
      expect(ROLE_PERMISSIONS['Legal']).toContain('contract:edit');
      expect(ROLE_PERMISSIONS['Legal']).not.toContain('contract:view:financials');
    });
  });

  describe('NAV_GROUP_ROLES', () => {
    it('Admin group includes ExecutiveLeadership and SharePointAdmin', () => {
      expect(NAV_GROUP_ROLES.Admin).toContain('Executive Leadership');
      expect(NAV_GROUP_ROLES.Admin).toContain('SharePoint Admin');
    });

    it('Admin group does NOT include DepartmentDirector', () => {
      expect(NAV_GROUP_ROLES.Admin).not.toContain('Department Director');
    });

    it('Operations group includes OperationsTeam', () => {
      expect(NAV_GROUP_ROLES.Operations).toContain('Operations Team');
    });

    it('all 5 nav groups have entries', () => {
      expect(NAV_GROUP_ROLES.Marketing).toBeDefined();
      expect(NAV_GROUP_ROLES.Preconstruction).toBeDefined();
      expect(NAV_GROUP_ROLES.Operations).toBeDefined();
      expect(NAV_GROUP_ROLES.Accounting).toBeDefined();
      expect(NAV_GROUP_ROLES.Admin).toBeDefined();
    });

    it('Marketing includes BD Representative', () => {
      expect(NAV_GROUP_ROLES.Marketing).toContain('BD Representative');
    });

    it('Preconstruction includes Legal', () => {
      expect(NAV_GROUP_ROLES.Preconstruction).toContain('Legal');
    });
  });
});
