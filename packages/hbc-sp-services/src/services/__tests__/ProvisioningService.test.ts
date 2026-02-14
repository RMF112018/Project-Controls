import { ProvisioningService, IProvisioningInput } from '../ProvisioningService';
import { IDataService } from '../IDataService';
import { ProvisioningStatus, AuditAction, EntityType } from '../../models/enums';
import { PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS, IProvisioningLog } from '../../models/IProvisioningLog';

function createTestInput(overrides?: Partial<IProvisioningInput>): IProvisioningInput {
  return {
    leadId: 1,
    projectCode: '25-042-01',
    projectName: 'Test Project',
    clientName: 'Test Client',
    division: 'Commercial',
    region: 'Miami',
    requestedBy: 'admin@test.com',
    ...overrides,
  };
}

function createMockLog(overrides?: Partial<IProvisioningLog>): IProvisioningLog {
  return {
    id: 1,
    projectCode: '25-042-01',
    projectName: 'Test Project',
    leadId: 1,
    status: ProvisioningStatus.Queued,
    currentStep: 0,
    completedSteps: 0,
    retryCount: 0,
    requestedBy: 'admin@test.com',
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockDataService(): Record<string, jest.Mock> {
  return {
    triggerProvisioning: jest.fn().mockResolvedValue(createMockLog()),
    updateProvisioningLog: jest.fn().mockResolvedValue(createMockLog()),
    getProvisioningStatus: jest.fn().mockResolvedValue(createMockLog()),
    retryProvisioning: jest.fn().mockResolvedValue(createMockLog()),
    updateLead: jest.fn().mockResolvedValue({}),
    logAudit: jest.fn().mockResolvedValue(undefined),
    sendNotification: jest.fn().mockResolvedValue({ id: 1 }),
    getRoles: jest.fn().mockResolvedValue([]),
    getHubSiteUrl: jest.fn().mockResolvedValue('https://hub.sharepoint.com'),
  };
}

describe('ProvisioningService', () => {
  let service: ProvisioningService;
  let mockDs: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDs = createMockDataService();
    service = new ProvisioningService(mockDs as unknown as IDataService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('provisionSite', () => {
    it('calls triggerProvisioning on dataService', async () => {
      const input = createTestInput();
      await service.provisionSite(input);
      expect(mockDs.triggerProvisioning).toHaveBeenCalledWith(
        input.leadId,
        input.projectCode,
        input.projectName,
        input.requestedBy
      );
    });

    it('returns initial log entry immediately', async () => {
      const result = await service.provisionSite(createTestInput());
      expect(result).toBeDefined();
      expect(result.projectCode).toBe('25-042-01');
      expect(result.status).toBe(ProvisioningStatus.Queued);
    });

    it('fires audit log for provisioning trigger', async () => {
      const input = createTestInput();
      await service.provisionSite(input);
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningTriggered,
          EntityType: EntityType.Project,
          ProjectCode: input.projectCode,
        })
      );
    });

    it('kicks off runSteps asynchronously (updates provisioning log)', async () => {
      await service.provisionSite(createTestInput());

      // Advance timers to let all 7 steps complete (500ms each)
      for (let i = 0; i < TOTAL_PROVISIONING_STEPS; i++) {
        jest.advanceTimersByTime(500);
        await Promise.resolve(); // flush microtasks
      }
      // Extra flush for final updates
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();

      // updateProvisioningLog should have been called for step progress
      expect(mockDs.updateProvisioningLog).toHaveBeenCalled();
    });
  });

  describe('provisionSiteWithFallback', () => {
    it('uses local engine when PA disabled (default)', async () => {
      const input = createTestInput();
      const result = await service.provisionSiteWithFallback(input);
      expect(result).toBeDefined();
      expect(mockDs.triggerProvisioning).toHaveBeenCalled();
    });

    it('uses PowerAutomate when enabled and available', async () => {
      const mockPA = {
        triggerProvisioning: jest.fn().mockResolvedValue({ runId: 'abc123' }),
      };
      const paService = new ProvisioningService(
        mockDs as unknown as IDataService,
        undefined,
        mockPA as any,
        undefined,
        true
      );

      const input = createTestInput();
      await paService.provisionSiteWithFallback(input);

      expect(mockPA.triggerProvisioning).toHaveBeenCalled();
      expect(mockDs.triggerProvisioning).toHaveBeenCalled();
    });

    it('falls back to local engine when PA fails', async () => {
      const mockPA = {
        triggerProvisioning: jest.fn().mockRejectedValue(new Error('PA unavailable')),
      };
      const paService = new ProvisioningService(
        mockDs as unknown as IDataService,
        undefined,
        mockPA as any,
        undefined,
        true
      );

      const input = createTestInput();
      const result = await paService.provisionSiteWithFallback(input);

      expect(mockPA.triggerProvisioning).toHaveBeenCalled();
      // Local engine still called via provisionSite
      expect(mockDs.triggerProvisioning).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('falls back to offline queue when local fails', async () => {
      mockDs.triggerProvisioning
        .mockRejectedValueOnce(new Error('Local failed'))
        .mockResolvedValueOnce(createMockLog());

      const mockOffline = { enqueue: jest.fn() };
      const offlineService = new ProvisioningService(
        mockDs as unknown as IDataService,
        undefined,
        undefined,
        mockOffline as any,
        false
      );

      const input = createTestInput();
      const result = await offlineService.provisionSiteWithFallback(input);

      expect(mockOffline.enqueue).toHaveBeenCalledWith('create', 'provisioning', input);
      expect(result).toBeDefined();
    });

    it('throws when local fails and no offline queue', async () => {
      mockDs.triggerProvisioning.mockRejectedValue(new Error('Local failed'));
      const input = createTestInput();
      await expect(service.provisionSiteWithFallback(input)).rejects.toThrow('Local failed');
    });

    it('logs audit entry when PA fallback occurs', async () => {
      const mockPA = {
        triggerProvisioning: jest.fn().mockRejectedValue(new Error('PA down')),
      };
      const paService = new ProvisioningService(
        mockDs as unknown as IDataService,
        undefined,
        mockPA as any,
        undefined,
        true
      );

      await paService.provisionSiteWithFallback(createTestInput());

      // Should have logged the PA failure + the local trigger
      const auditCalls = mockDs.logAudit.mock.calls;
      const details = auditCalls.map((c: any[]) => c[0].Details);
      expect(details.some((d: string) => d.includes('Power Automate provisioning failed'))).toBe(true);
    });
  });

  describe('retryFromStep', () => {
    it('calls retryProvisioning on dataService', async () => {
      await service.retryFromStep('25-042-01', 3);
      expect(mockDs.retryProvisioning).toHaveBeenCalledWith('25-042-01', 3);
    });

    it('throws when max retries exceeded', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({ retryCount: 3 }));
      await expect(service.retryFromStep('25-042-01', 3)).rejects.toThrow(
        'Maximum retries (3) exceeded'
      );
    });

    it('does not throw when retry count below maximum', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({ retryCount: 2 }));
      const result = await service.retryFromStep('25-042-01', 3);
      expect(result).toBeDefined();
      expect(mockDs.retryProvisioning).toHaveBeenCalledWith('25-042-01', 3);
    });
  });

  describe('retryHubNavLink', () => {
    it('throws when hub nav service not available', async () => {
      // Default service has no hubNavService
      await expect(service.retryHubNavLink('25-042-01', 'admin@test.com'))
        .rejects.toThrow('Hub navigation service not available');
    });

    it('throws when no provisioning log found', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(null);
      const mockHubNav = { addProjectNavigationLink: jest.fn() };
      const navService = new ProvisioningService(
        mockDs as unknown as IDataService,
        mockHubNav as any
      );
      await expect(navService.retryHubNavLink('25-042-01', 'admin@test.com'))
        .rejects.toThrow('No provisioning log found');
    });

    it('throws when no site URL on log', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({ siteUrl: undefined }));
      const mockHubNav = { addProjectNavigationLink: jest.fn() };
      const navService = new ProvisioningService(
        mockDs as unknown as IDataService,
        mockHubNav as any
      );
      await expect(navService.retryHubNavLink('25-042-01', 'admin@test.com'))
        .rejects.toThrow('No site URL found');
    });

    it('updates provisioning log with nav link status', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://test.sharepoint.com/sites/2504201',
      }));
      const mockHubNav = {
        addProjectNavigationLink: jest.fn().mockResolvedValue({
          success: true,
          action: 'created',
          yearLabel: '2025',
        }),
      };
      const navService = new ProvisioningService(
        mockDs as unknown as IDataService,
        mockHubNav as any
      );
      await navService.retryHubNavLink('25-042-01', 'admin@test.com');
      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith('25-042-01', {
        hubNavLinkStatus: 'success',
      });
    });
  });

  describe('getProvisioningStatus', () => {
    it('delegates to dataService', async () => {
      await service.getProvisioningStatus('25-042-01');
      expect(mockDs.getProvisioningStatus).toHaveBeenCalledWith('25-042-01');
    });
  });

  describe('static methods', () => {
    it('getStepLabels returns provisioning step labels', () => {
      const labels = ProvisioningService.getStepLabels();
      expect(labels).toBe(PROVISIONING_STEPS);
      expect(labels).toHaveLength(TOTAL_PROVISIONING_STEPS);
      expect(labels[0]).toEqual({ step: 1, label: 'Create SharePoint Site' });
      expect(labels[6]).toEqual({ step: 7, label: 'Update Leads_Master with Site URL' });
    });
  });

  describe('createBuyoutLogList', () => {
    it('fires audit log after creation', async () => {
      // Start the async call (which blocks on setTimeout internally)
      const promise = service.createBuyoutLogList('https://test.sharepoint.com/sites/2504201');
      // Advance timers to resolve the internal setTimeout
      await jest.advanceTimersByTimeAsync(500);
      await promise;
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningCompleted,
          EntityId: 'https://test.sharepoint.com/sites/2504201',
        })
      );
    });
  });

  describe('updateSiteTitle', () => {
    it('fires audit log for title update', async () => {
      // Start the async call (which blocks on setTimeout internally)
      const promise = service.updateSiteTitle('https://test.sharepoint.com/sites/2504201', 'New Title');
      // Advance timers to resolve the internal setTimeout
      await jest.advanceTimersByTimeAsync(500);
      await promise;
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningCompleted,
          Details: expect.stringContaining('New Title'),
        })
      );
    });
  });
});
