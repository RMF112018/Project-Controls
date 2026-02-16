import { NotificationService } from '../NotificationService';
import { IDataService } from '../IDataService';
import { NotificationEvent, RoleName } from '../../models/enums';

/**
 * Create mock data service with correct IRole.UserOrGroup type (string[]).
 */
function createMockDataService(roleOverrides?: { Title: RoleName; UserOrGroup: string[] }[]): Partial<IDataService> {
  const defaultRoles = [
    { id: 1, Title: RoleName.BDRepresentative, UserOrGroup: ['bd@test.com'], Permissions: [], UserOrGroupIds: [1], IsActive: true },
    { id: 2, Title: RoleName.ExecutiveLeadership, UserOrGroup: ['exec@test.com'], Permissions: [], UserOrGroupIds: [2], IsActive: true },
    { id: 3, Title: RoleName.DepartmentDirector, UserOrGroup: ['dir@test.com'], Permissions: [], UserOrGroupIds: [3], IsActive: true },
    { id: 4, Title: RoleName.OperationsTeam, UserOrGroup: ['ops@test.com'], Permissions: [], UserOrGroupIds: [4], IsActive: true },
    { id: 5, Title: RoleName.PreconstructionTeam, UserOrGroup: ['precon@test.com'], Permissions: [], UserOrGroupIds: [5], IsActive: true },
  ];

  const roles = roleOverrides
    ? roleOverrides.map((r, i) => ({ id: i + 1, ...r, Permissions: [], UserOrGroupIds: [i + 1], IsActive: true }))
    : defaultRoles;

  return {
    sendNotification: jest.fn().mockResolvedValue({
      id: 1,
      subject: 'Test',
      body: 'Body',
      recipients: [],
      status: 'sent',
    }),
    getRoles: jest.fn().mockResolvedValue(roles),
  };
}

describe('NotificationService — Provisioning Events', () => {
  let service: NotificationService;
  let mockDs: Partial<IDataService>;

  beforeEach(() => {
    mockDs = createMockDataService();
    service = new NotificationService(mockDs as IDataService);
  });

  it('SiteProvisioned subject contains projectCode', async () => {
    await service.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode: '25-042-01', leadTitle: 'Alpha Project', siteUrl: 'https://example.com/sites/25-042-01' },
      'admin@test.com'
    );

    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    expect(call.subject).toContain('Project Site Provisioned: 25-042-01');
  });

  it('SiteProvisioned body includes siteUrl', async () => {
    const siteUrl = 'https://tenant.sharepoint.com/sites/25-042-01';
    await service.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode: '25-042-01', leadTitle: 'Alpha Project', siteUrl },
      'admin@test.com'
    );

    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    expect(call.body).toContain(siteUrl);
  });

  it('resolves recipients from 5 provisioning roles without duplicates', async () => {
    await service.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode: '25-042-01' },
      'admin@test.com'
    );

    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    // SiteProvisioned targets: BD Rep, Executive Leadership, Department Director, Operations Team, Precon Team
    expect(call.recipients).toContain('bd@test.com');
    expect(call.recipients).toContain('exec@test.com');
    expect(call.recipients).toContain('dir@test.com');
    expect(call.recipients).toContain('ops@test.com');
    expect(call.recipients).toContain('precon@test.com');
    // No duplicates
    const unique = new Set(call.recipients);
    expect(unique.size).toBe(call.recipients.length);
  });

  it('returns undefined when all roles have empty UserOrGroup', async () => {
    const emptyRoles = [
      { Title: RoleName.BDRepresentative, UserOrGroup: [] as string[] },
      { Title: RoleName.ExecutiveLeadership, UserOrGroup: [] as string[] },
      { Title: RoleName.DepartmentDirector, UserOrGroup: [] as string[] },
      { Title: RoleName.OperationsTeam, UserOrGroup: [] as string[] },
      { Title: RoleName.PreconstructionTeam, UserOrGroup: [] as string[] },
    ];
    const emptyDs = createMockDataService(emptyRoles);
    const emptyService = new NotificationService(emptyDs as IDataService);

    const result = await emptyService.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode: '25-042-01' },
      'admin@test.com'
    );

    expect(result).toBeUndefined();
    expect(emptyDs.sendNotification).not.toHaveBeenCalled();
  });

  it('missing optional siteUrl does not produce "undefined" text', async () => {
    // Provide leadTitle (effectively required for clean body) but omit siteUrl
    await service.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode: '25-042-01', leadTitle: 'Alpha Project' },
      'admin@test.com'
    );

    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    expect(call.subject).not.toContain('undefined');
    expect(call.body).not.toContain('undefined');
    // siteUrl clause should not appear at all
    expect(call.body).not.toContain('Site URL:');
  });

  it('full cross-service: ProvisioningService triggers notification after completion', async () => {
    // This test verifies the template + recipient resolution path end-to-end
    // using a real NotificationService with mock data service.
    jest.useFakeTimers();

    const { ProvisioningService } = await import('../ProvisioningService');
    const { createProvisioningMockDataService, createTestInput, advanceAllSteps } = await import('./provisioning-test-helpers');

    const provDs = createProvisioningMockDataService();
    // Wire up roles for notification resolution
    provDs.getRoles.mockResolvedValue([
      { id: 1, Title: RoleName.BDRepresentative, UserOrGroup: ['bd@test.com'], Permissions: [], UserOrGroupIds: [1], IsActive: true },
      { id: 2, Title: RoleName.ExecutiveLeadership, UserOrGroup: ['exec@test.com'], Permissions: [], UserOrGroupIds: [2], IsActive: true },
      { id: 3, Title: RoleName.DepartmentDirector, UserOrGroup: ['dir@test.com'], Permissions: [], UserOrGroupIds: [3], IsActive: true },
      { id: 4, Title: RoleName.OperationsTeam, UserOrGroup: ['ops@test.com'], Permissions: [], UserOrGroupIds: [4], IsActive: true },
      { id: 5, Title: RoleName.PreconstructionTeam, UserOrGroup: ['precon@test.com'], Permissions: [], UserOrGroupIds: [5], IsActive: true },
    ]);

    const mockHubNav = { addNavigationLink: jest.fn().mockResolvedValue(undefined), removeNavigationLink: jest.fn().mockResolvedValue(undefined), getNavigationLinks: jest.fn().mockResolvedValue([]) };
    const notificationService = new NotificationService(provDs as unknown as IDataService);

    const provService = new ProvisioningService(
      provDs as unknown as IDataService,
      mockHubNav as unknown as Parameters<typeof ProvisioningService.prototype.provisionSite>[0] extends never ? never : never,
      notificationService,
      undefined,
      false, // dryRun
      false, // useRealOps (simulation)
    );

    const input = createTestInput();
    const promise = provService.provisionSite(input);
    await advanceAllSteps(7);
    await promise;

    // After provisioning completes, sendNotification should have been called
    // with a subject containing "Provisioned"
    expect(provDs.sendNotification).toHaveBeenCalled();
    const notifCall = provDs.sendNotification.mock.calls.find(
      (c: unknown[]) => (c[0] as { subject: string }).subject.includes('Provisioned')
    );
    expect(notifCall).toBeTruthy();

    jest.useRealTimers();
  });
});
