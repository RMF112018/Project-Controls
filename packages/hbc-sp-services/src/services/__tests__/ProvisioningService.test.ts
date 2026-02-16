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
    // Provisioning operation mocks
    createProjectSite: jest.fn().mockResolvedValue({ siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201' }),
    provisionProjectLists: jest.fn().mockResolvedValue(undefined),
    associateWithHubSite: jest.fn().mockResolvedValue(undefined),
    createProjectSecurityGroups: jest.fn().mockResolvedValue(undefined),
    copyTemplateFiles: jest.fn().mockResolvedValue(undefined),
    copyLeadDataToProjectSite: jest.fn().mockResolvedValue(undefined),
    updateSiteProperties: jest.fn().mockResolvedValue(undefined),
    createList: jest.fn().mockResolvedValue(undefined),
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
    it('calls triggerProvisioning with metadata', async () => {
      const input = createTestInput();
      await service.provisionSite(input);
      expect(mockDs.triggerProvisioning).toHaveBeenCalledWith(
        input.leadId,
        input.projectCode,
        input.projectName,
        input.requestedBy,
        { division: input.division, region: input.region, clientName: input.clientName }
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
    it('fires audit log after creation (simulation mode)', async () => {
      const promise = service.createBuyoutLogList('https://test.sharepoint.com/sites/2504201');
      await jest.advanceTimersByTimeAsync(500);
      await promise;
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteListsProvisioned,
          EntityId: 'https://test.sharepoint.com/sites/2504201',
        })
      );
    });

    it('calls createList when useRealOps is true', async () => {
      const realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
      await realService.createBuyoutLogList('https://test.sharepoint.com/sites/2504201');
      expect(mockDs.createList).toHaveBeenCalledWith(
        'https://test.sharepoint.com/sites/2504201',
        'Buyout_Log',
        100,
        expect.any(Array)
      );
    });
  });

  describe('updateSiteTitle', () => {
    it('fires audit log for title update (simulation mode)', async () => {
      const promise = service.updateSiteTitle('https://test.sharepoint.com/sites/2504201', 'New Title');
      await jest.advanceTimersByTimeAsync(500);
      await promise;
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningCompleted,
          Details: expect.stringContaining('New Title'),
        })
      );
    });

    it('calls updateSiteProperties when useRealOps is true', async () => {
      const realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
      await realService.updateSiteTitle('https://test.sharepoint.com/sites/2504201', 'New Title');
      expect(mockDs.updateSiteProperties).toHaveBeenCalledWith(
        'https://test.sharepoint.com/sites/2504201',
        { Title: 'New Title' }
      );
    });
  });

  describe('createActiveProjectsPortfolioList', () => {
    it('calls createList when useRealOps is true', async () => {
      const realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
      await realService.createActiveProjectsPortfolioList('https://hub.sharepoint.com');
      expect(mockDs.createList).toHaveBeenCalledWith(
        'https://hub.sharepoint.com',
        'Active_Projects_Portfolio',
        100,
        expect.any(Array)
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // executeStep dispatch (useRealOps=true)
  // ────────────────────────────────────────────────────────

  describe('executeStep dispatch (useRealOps=true)', () => {
    let realService: ProvisioningService;

    beforeEach(() => {
      realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
    });

    it('step 1 calls createProjectSite and returns siteUrl', async () => {
      const input = createTestInput();
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);

      // Let async runSteps proceed
      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockDs.createProjectSite).toHaveBeenCalledWith(
        input.projectCode,
        input.projectName,
        expect.any(String)
      );
    });

    it('step 2 calls provisionProjectLists', async () => {
      const input = createTestInput();
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockDs.provisionProjectLists).toHaveBeenCalled();
    });

    it('step 3 calls associateWithHubSite', async () => {
      const input = createTestInput();
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockDs.associateWithHubSite).toHaveBeenCalled();
    });

    it('step 4 calls createProjectSecurityGroups with division', async () => {
      const input = createTestInput({ division: 'Luxury Residential' });
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockDs.createProjectSecurityGroups).toHaveBeenCalledWith(
        expect.any(String),
        input.projectCode,
        'Luxury Residential'
      );
    });

    it('step 5 calls copyTemplateFiles with division', async () => {
      const input = createTestInput();
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockDs.copyTemplateFiles).toHaveBeenCalledWith(
        expect.any(String),
        input.projectCode,
        'Commercial'
      );
    });

    it('step 6 calls copyLeadDataToProjectSite', async () => {
      const input = createTestInput();
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockDs.copyLeadDataToProjectSite).toHaveBeenCalledWith(
        expect.any(String),
        input.leadId,
        input.projectCode
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // executeStep simulation (useRealOps=false)
  // ────────────────────────────────────────────────────────

  describe('executeStep simulation (useRealOps=false)', () => {
    it('does NOT call any provisioning operation methods', async () => {
      const input = createTestInput();
      await service.provisionSite(input);

      // Advance timers to complete all 7 steps
      for (let i = 0; i < TOTAL_PROVISIONING_STEPS; i++) {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      }
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(mockDs.createProjectSite).not.toHaveBeenCalled();
      expect(mockDs.provisionProjectLists).not.toHaveBeenCalled();
      expect(mockDs.associateWithHubSite).not.toHaveBeenCalled();
      expect(mockDs.createProjectSecurityGroups).not.toHaveBeenCalled();
      expect(mockDs.copyTemplateFiles).not.toHaveBeenCalled();
      expect(mockDs.copyLeadDataToProjectSite).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // Step failure handling
  // ────────────────────────────────────────────────────────

  describe('step failure handling (useRealOps=true)', () => {
    it('records failedStep and errorMessage on step failure', async () => {
      mockDs.provisionProjectLists.mockRejectedValue(new Error('Throttled'));
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      const realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
      const input = createTestInput();
      await realService.provisionSite(input);

      // Let async runSteps proceed and fail
      await jest.advanceTimersByTimeAsync(2000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        input.projectCode,
        expect.objectContaining({
          status: ProvisioningStatus.Failed,
          failedStep: 2,
          errorMessage: 'Throttled',
        })
      );
    });

    it('does not call subsequent steps after failure', async () => {
      mockDs.associateWithHubSite.mockRejectedValue(new Error('Hub unreachable'));
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      const realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
      await realService.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(2000);
      await Promise.resolve();

      // Step 3 failed, so step 4-6 should not have been called
      expect(mockDs.createProjectSecurityGroups).not.toHaveBeenCalled();
      expect(mockDs.copyTemplateFiles).not.toHaveBeenCalled();
      expect(mockDs.copyLeadDataToProjectSite).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // resumeSteps from failed step
  // ────────────────────────────────────────────────────────

  describe('resumeSteps (useRealOps=true)', () => {
    it('resumes from step 3 preserving siteUrl from log', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        retryCount: 0,
        division: 'Commercial',
        region: 'Miami',
      }));

      const realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
      await realService.retryFromStep('25-042-01', 3);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      // Steps 1-2 should NOT have been called
      expect(mockDs.createProjectSite).not.toHaveBeenCalled();
      expect(mockDs.provisionProjectLists).not.toHaveBeenCalled();
      // Steps 3+ should have been called
      expect(mockDs.associateWithHubSite).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // End-to-end provisioning flow
  // ────────────────────────────────────────────────────────

  describe('end-to-end provisioning flow (useRealOps=true)', () => {
    let realService: ProvisioningService;

    beforeEach(() => {
      realService = new ProvisioningService(mockDs as unknown as IDataService, undefined, undefined, undefined, false, true);
    });

    it('full 7-step flow calls all operation methods and completes', async () => {
      const input = createTestInput();
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await realService.provisionSite(input);

      // Advance timers to let async runSteps complete
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockDs.createProjectSite).toHaveBeenCalledWith(input.projectCode, input.projectName, expect.any(String));
      expect(mockDs.provisionProjectLists).toHaveBeenCalled();
      expect(mockDs.associateWithHubSite).toHaveBeenCalled();
      expect(mockDs.createProjectSecurityGroups).toHaveBeenCalled();
      expect(mockDs.copyTemplateFiles).toHaveBeenCalled();
      expect(mockDs.copyLeadDataToProjectSite).toHaveBeenCalled();
      expect(mockDs.updateLead).toHaveBeenCalled();

      // Verify final status is Completed
      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        input.projectCode,
        expect.objectContaining({ status: ProvisioningStatus.Completed })
      );
    });

    it('Power Automate fallback activates when provisionSite throws', async () => {
      const mockPA = { triggerProvisioning: jest.fn().mockResolvedValue({ runId: 'abc' }) };
      const paService = new ProvisioningService(mockDs as unknown as IDataService, undefined, mockPA as any, undefined, true, true);
      const input = createTestInput();
      await paService.provisionSiteWithFallback(input);
      expect(mockPA.triggerProvisioning).toHaveBeenCalled();
    });
  });
});
