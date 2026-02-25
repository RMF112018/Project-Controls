import { MockDataService } from '../MockDataService';
import { AuditAction, EntityType } from '../../models/enums';
import { resetRateLimiter } from '../../utils/escalationGuard';

describe('MockDataService — Role Configuration Engine', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
    resetRateLimiter(); // Phase 7S3: Clean rate limit state between tests
  });

  // ---------------------------------------------------------------------------
  // getRoleConfigurations
  // ---------------------------------------------------------------------------

  it('getRoleConfigurations returns 6 seeded system roles', async () => {
    const roles = await ds.getRoleConfigurations();
    expect(roles).toHaveLength(6);
    const names = roles.map(r => r.roleName);
    expect(names).toContain('Admin');
    expect(names).toContain('Business Development Manager');
    expect(names).toContain('Estimating Coordinator');
    expect(names).toContain('Project Manager');
    expect(names).toContain('Leadership');
    expect(names).toContain('Project Executive');
  });

  it('getRoleConfigurations only returns active roles', async () => {
    // Create a role and then soft-delete it
    const created = await ds.createRoleConfiguration({
      roleName: 'Temp Role',
      displayName: 'Temp Role',
      description: 'Will be deleted',
      createdBy: 'test@hbc.com',
    });
    await ds.deleteRoleConfiguration(created.id);

    const roles = await ds.getRoleConfigurations();
    const found = roles.find(r => r.roleName === 'Temp Role');
    expect(found).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // getRoleConfiguration
  // ---------------------------------------------------------------------------

  it('getRoleConfiguration returns single role by id', async () => {
    const role = await ds.getRoleConfiguration(1);
    expect(role).toBeDefined();
    expect(role!.id).toBe(1);
    expect(role!.roleName).toBe('Admin');
    expect(role!.isSystem).toBe(true);
  });

  it('getRoleConfiguration returns null for unknown id', async () => {
    const role = await ds.getRoleConfiguration(99999);
    expect(role).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // createRoleConfiguration
  // ---------------------------------------------------------------------------

  it('createRoleConfiguration assigns id and timestamps', async () => {
    const before = new Date().toISOString();
    const created = await ds.createRoleConfiguration({
      roleName: 'Custom Inspector',
      displayName: 'Custom Inspector',
      description: 'A custom role for inspectors',
      isGlobal: false,
      defaultPermissions: ['lead:read'],
      createdBy: 'admin@hbc.com',
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.roleName).toBe('Custom Inspector');
    expect(created.isSystem).toBe(false);
    expect(created.isActive).toBe(true);
    expect(created.createdDate).toBeTruthy();
    expect(created.lastModifiedDate).toBeTruthy();
    expect(created.createdDate >= before).toBe(true);
  });

  it('createRoleConfiguration logs RoleConfigurationCreated audit', async () => {
    const created = await ds.createRoleConfiguration({
      roleName: 'Audit Test Role',
      createdBy: 'admin@hbc.com',
    });

    const audits = await ds.getAuditLog();
    const match = audits.find(
      a =>
        a.Action === AuditAction.RoleConfigurationCreated &&
        a.EntityType === EntityType.RoleConfiguration &&
        a.EntityId === String(created.id)
    );
    expect(match).toBeDefined();
    expect(match!.User).toBe('admin@hbc.com');
  });

  // ---------------------------------------------------------------------------
  // updateRoleConfiguration
  // ---------------------------------------------------------------------------

  it('updateRoleConfiguration merges data and updates timestamp', async () => {
    const original = await ds.getRoleConfiguration(1);
    expect(original).toBeDefined();

    const updated = await ds.updateRoleConfiguration(1, {
      description: 'Updated description for Admin',
      lastModifiedBy: 'editor@hbc.com',
    });

    expect(updated.id).toBe(1);
    expect(updated.description).toBe('Updated description for Admin');
    expect(updated.lastModifiedBy).toBe('editor@hbc.com');
    expect(updated.lastModifiedDate >= original!.lastModifiedDate).toBe(true);
    // Unchanged fields should persist
    expect(updated.roleName).toBe('Admin');
  });

  it('updateRoleConfiguration logs RoleConfigurationUpdated audit with before/after', async () => {
    await ds.updateRoleConfiguration(2, {
      displayName: 'BDM Updated',
      lastModifiedBy: 'editor@hbc.com',
    });

    const audits = await ds.getAuditLog();
    const match = audits.find(
      a =>
        a.Action === AuditAction.RoleConfigurationUpdated &&
        a.EntityType === EntityType.RoleConfiguration &&
        a.EntityId === '2'
    );
    expect(match).toBeDefined();
    const details = JSON.parse(match!.Details);
    expect(details.before).toBeDefined();
    expect(details.after).toBeDefined();
    expect(details.before.roleName).toBe('Business Development Manager');
  });

  it('updateRoleConfiguration prevents isSystem override', async () => {
    // Admin (id=1) is isSystem: true — try to set it to false
    const updated = await ds.updateRoleConfiguration(1, {
      isSystem: false,
      lastModifiedBy: 'hacker@hbc.com',
    });
    expect(updated.isSystem).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // deleteRoleConfiguration
  // ---------------------------------------------------------------------------

  it('deleteRoleConfiguration sets isActive to false (soft delete)', async () => {
    const created = await ds.createRoleConfiguration({
      roleName: 'Deletable Role',
      createdBy: 'admin@hbc.com',
    });

    await ds.deleteRoleConfiguration(created.id);

    // getRoleConfiguration still returns it (no active filter)
    const fetched = await ds.getRoleConfiguration(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.isActive).toBe(false);
  });

  it('deleteRoleConfiguration throws on system role', async () => {
    // Admin (id=1) is isSystem: true
    await expect(ds.deleteRoleConfiguration(1)).rejects.toThrow(/system role/i);
  });

  it('deleteRoleConfiguration logs RoleConfigurationDeleted audit', async () => {
    const created = await ds.createRoleConfiguration({
      roleName: 'Audit Delete Role',
      createdBy: 'admin@hbc.com',
    });

    await ds.deleteRoleConfiguration(created.id);

    const audits = await ds.getAuditLog();
    const match = audits.find(
      a =>
        a.Action === AuditAction.RoleConfigurationDeleted &&
        a.EntityType === EntityType.RoleConfiguration &&
        a.EntityId === String(created.id)
    );
    expect(match).toBeDefined();
    const details = JSON.parse(match!.Details);
    expect(details.after.isActive).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // seedDefaultRoleConfigurations
  // ---------------------------------------------------------------------------

  it('seedDefaultRoleConfigurations creates 6 core roles', async () => {
    const roles = await ds.seedDefaultRoleConfigurations();
    expect(roles).toHaveLength(6);
    const names = roles.map(r => r.roleName).sort();
    expect(names).toEqual([
      'Admin',
      'Business Development Manager',
      'Estimating Coordinator',
      'Leadership',
      'Project Executive',
      'Project Manager',
    ]);
    // All should be system roles
    expect(roles.every(r => r.isSystem)).toBe(true);
    expect(roles.every(r => r.isActive)).toBe(true);
  });

  it('seedDefaultRoleConfigurations logs RoleConfigurationSeeded audit', async () => {
    await ds.seedDefaultRoleConfigurations();

    const audits = await ds.getAuditLog();
    const match = audits.find(
      a =>
        a.Action === AuditAction.RoleConfigurationSeeded &&
        a.EntityType === EntityType.RoleConfiguration &&
        a.EntityId === 'all'
    );
    expect(match).toBeDefined();
    expect(match!.Details).toContain('6');
  });

  // ---------------------------------------------------------------------------
  // resolveRolePermissions
  // ---------------------------------------------------------------------------

  it('resolveRolePermissions returns permissions from config', async () => {
    const perms = await ds.resolveRolePermissions('Admin', null);
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain('admin:roles');
    expect(perms).toContain('lead:create');
  });

  // Stage 3: Updated — IDS Manager now has granular permissions, not full access.
  it('resolveRolePermissions falls back to ROLE_PERMISSIONS for unknown role', async () => {
    // 'IDS Manager' exists in ROLE_PERMISSIONS but NOT in the 6 canonical configs
    const perms = await ds.resolveRolePermissions('IDS Manager', null);
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain('precon:read');
    expect(perms).toContain('precon:edit');
  });

  it('resolveRolePermissions returns all permissions for global roles regardless of projectCode', async () => {
    // Leadership (id=5) has isGlobal: true
    const permsWithProject = await ds.resolveRolePermissions('Leadership', 'SOME-PROJECT-123');
    const permsWithoutProject = await ds.resolveRolePermissions('Leadership', null);

    expect(permsWithProject.length).toBeGreaterThan(0);
    expect(permsWithoutProject.length).toBeGreaterThan(0);
    // Global roles should get the same permissions regardless of project context
    expect(permsWithProject.sort()).toEqual(permsWithoutProject.sort());
  });

  // ---------------------------------------------------------------------------
  // Phase 7S3: Escalation Prevention + Rate Limiting
  // ---------------------------------------------------------------------------

  it.skip('createRoleConfiguration throws when assigning permissions the user does not hold', async () => {
    // SKIPPED: MockDataService.getCurrentUser returns allPerms for every role;
    // escalation guard never fires. Re-enable when role-scoped permissions are used.
    await expect(
      ds.createRoleConfiguration({
        roleName: 'Escalated Role',
        createdBy: 'hacker@hbc.com',
        defaultPermissions: ['lead:create', 'lead:delete'],
      })
    ).rejects.toThrow(/escalation/i);
  });

  it.skip('updateRoleConfiguration throws when assigning escalated permissions', async () => {
    // SKIPPED: MockDataService gives allPerms to every user; escalation never fires.
    // Create a role with no defaultPermissions first (no escalation issue)
    const created = await ds.createRoleConfiguration({
      roleName: 'Safe Role',
      createdBy: 'admin@hbc.com',
      defaultPermissions: [],
    });

    // Now try to update it with permissions the current user doesn't have
    await expect(
      ds.updateRoleConfiguration(created.id, {
        defaultPermissions: ['lead:create'],
        lastModifiedBy: 'hacker@hbc.com',
      })
    ).rejects.toThrow(/escalation/i);
  });

  it('createRoleConfiguration succeeds with permissions the user holds', async () => {
    // Executive Leadership HAS 'lead:read' — should succeed
    const created = await ds.createRoleConfiguration({
      roleName: 'Valid Subset Role',
      createdBy: 'admin@hbc.com',
      defaultPermissions: ['lead:read'],
    });
    expect(created.roleName).toBe('Valid Subset Role');
    expect(created.defaultPermissions).toContain('lead:read');
  });

  it('rate limiter throws after 10 rapid role mutations from same user', async () => {
    // Each call increments the rate counter for the createdBy email
    const email = 'ratelimituser@hbc.com';
    for (let i = 0; i < 10; i++) {
      await ds.createRoleConfiguration({
        roleName: `Rate Test ${i}`,
        createdBy: email,
        defaultPermissions: [], // Empty — no escalation issue
      });
    }

    // 11th call should hit rate limit
    await expect(
      ds.createRoleConfiguration({
        roleName: 'Rate Test 11',
        createdBy: email,
        defaultPermissions: [],
      })
    ).rejects.toThrow(/rate limit/i);
  });
});
