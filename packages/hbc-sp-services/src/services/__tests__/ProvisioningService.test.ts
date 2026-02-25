import { ProvisioningService, IProvisioningInput } from '../ProvisioningService';
import { IDataService } from '../IDataService';
import { ProvisioningStatus, AuditAction, EntityType, NotificationEvent } from '../../models/enums';
import { PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS, IProvisioningLog } from '../../models/IProvisioningLog';
import {
  createTestInput as helperCreateTestInput,
  createMockLog as helperCreateMockLog,
  createFailedLog,
  createCompletedLog,
  createProvisioningMockDataService,
  advanceAllSteps,
  advanceProvisioningStep,
  expectAuditLogged,
  flushPromises,
} from './provisioning-test-helpers';

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

  // ────────────────────────────────────────────────────────
  // Phase 2A — Gap tests
  // ────────────────────────────────────────────────────────

  describe('notification after completion', () => {
    it('sends SiteProvisioned notification on successful completion', async () => {
      // Must have roles so NotificationService resolves recipients
      mockDs.getRoles.mockResolvedValue([
        { Title: 'Business Development Manager', UserOrGroup: ['bd@test.com'] },
        { Title: 'Commercial Operations Manager', UserOrGroup: ['ops@test.com'] },
      ]);
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput();
      await service.provisionSite(input);
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Project Site Provisioned'),
        })
      );
    });

    it('notification failure does not throw or break provisioning', async () => {
      mockDs.sendNotification.mockRejectedValue(new Error('Notification failed'));
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput();

      // Should not throw even though notification fails
      await service.provisionSite(input);
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      // Provisioning should still complete
      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        input.projectCode,
        expect.objectContaining({ status: ProvisioningStatus.Completed })
      );
    });

    it('resolves recipients from roles for notification', async () => {
      mockDs.getRoles.mockResolvedValue([
        { Title: 'Business Development Manager', UserOrGroup: ['bd@test.com'] },
        { Title: 'Commercial Operations Manager', UserOrGroup: ['ops@test.com'] },
        { Title: 'Leadership', UserOrGroup: ['exec@test.com'] },
      ]);
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput();
      await service.provisionSite(input);
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: expect.arrayContaining(['bd@test.com', 'ops@test.com', 'exec@test.com']),
        })
      );
    });
  });

  describe('hub nav link lifecycle', () => {
    it('addHubNavLink success updates log with success status', async () => {
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
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      await navService.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({ hubNavLinkStatus: 'success' })
      );
    });

    it('addHubNavLink failure sets hubNavLinkStatus to failed', async () => {
      const mockHubNav = {
        addProjectNavigationLink: jest.fn().mockRejectedValue(new Error('Nav API down')),
      };
      const navService = new ProvisioningService(
        mockDs as unknown as IDataService,
        mockHubNav as any
      );
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      await navService.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({ hubNavLinkStatus: 'failed' })
      );
    });

    it('retryHubNavLink success updates status', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://test.sharepoint.com/sites/2504201',
        hubNavLinkStatus: 'failed',
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

    it('retryHubNavLink failure keeps status as failed', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://test.sharepoint.com/sites/2504201',
        hubNavLinkStatus: 'failed',
      }));
      const mockHubNav = {
        addProjectNavigationLink: jest.fn().mockRejectedValue(new Error('Still down')),
      };
      const navService = new ProvisioningService(
        mockDs as unknown as IDataService,
        mockHubNav as any
      );

      await navService.retryHubNavLink('25-042-01', 'admin@test.com');

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith('25-042-01', {
        hubNavLinkStatus: 'failed',
      });
    });
  });

  describe('step 7 post-loop', () => {
    it('updates lead with siteUrl after all steps complete', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput();
      await service.provisionSite(input);
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.updateLead).toHaveBeenCalledWith(
        input.leadId,
        expect.objectContaining({ ProjectSiteURL: expect.any(String) })
      );
    });

    it('logs audit with SiteProvisioningCompleted action', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput();
      await service.provisionSite(input);
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningCompleted,
          EntityType: EntityType.Project,
          ProjectCode: '25-042-01',
        })
      );
    });

    it('sets completedAt timestamp in log', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      await service.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Completed,
          completedAt: expect.any(String),
        })
      );
    });
  });

  describe('siteNameOverride', () => {
    it('uses siteNameOverride when provided for site creation', async () => {
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/MyCustomName',
      }));
      const input = createTestInput({ siteNameOverride: 'My-Custom-Name!' });
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockDs.createProjectSite).toHaveBeenCalledWith(
        input.projectCode,
        input.projectName,
        'My-Custom-Name' // special chars stripped
      );
    });

    it('falls back to projectCode (dashes removed) when no override', async () => {
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput();
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockDs.createProjectSite).toHaveBeenCalledWith(
        '25-042-01',
        'Test Project',
        '2504201' // dashes removed from projectCode
      );
    });
  });

  describe('metadata preservation', () => {
    it('passes division/region/clientName in metadata to triggerProvisioning', async () => {
      const input = createTestInput({
        division: 'Luxury Residential',
        region: 'Palm Beach',
        clientName: 'Premium Client',
      });
      await service.provisionSite(input);

      expect(mockDs.triggerProvisioning).toHaveBeenCalledWith(
        input.leadId,
        input.projectCode,
        input.projectName,
        input.requestedBy,
        { division: 'Luxury Residential', region: 'Palm Beach', clientName: 'Premium Client' }
      );
    });

    it('carries division through to createProjectSecurityGroups in real ops', async () => {
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput({ division: 'Healthcare' });
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockDs.createProjectSecurityGroups).toHaveBeenCalledWith(
        expect.any(String),
        input.projectCode,
        'Healthcare'
      );
    });

    it('carries division through to copyTemplateFiles in real ops', async () => {
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const input = createTestInput({ division: 'Healthcare' });
      await realService.provisionSite(input);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockDs.copyTemplateFiles).toHaveBeenCalledWith(
        expect.any(String),
        input.projectCode,
        'Healthcare'
      );
    });
  });

  describe('concurrent provisioning', () => {
    it('two simultaneous provisions do not interfere', async () => {
      const mockDs2 = createMockDataService();
      const service2 = new ProvisioningService(mockDs2 as unknown as IDataService);

      const input1 = createTestInput({ projectCode: '25-042-01' });
      const input2 = createTestInput({ projectCode: '25-043-02', leadId: 2, projectName: 'Project B' });

      const [log1, log2] = await Promise.all([
        service.provisionSite(input1),
        service2.provisionSite(input2),
      ]);

      expect(log1).toBeDefined();
      expect(log2).toBeDefined();
      expect(mockDs.triggerProvisioning).toHaveBeenCalledWith(
        expect.anything(), '25-042-01', expect.anything(), expect.anything(), expect.anything()
      );
      expect(mockDs2.triggerProvisioning).toHaveBeenCalledWith(
        expect.anything(), '25-043-02', expect.anything(), expect.anything(), expect.anything()
      );
    });

    it('creates separate provisioning log entries', async () => {
      const mockDs2 = createMockDataService();
      mockDs2.triggerProvisioning.mockResolvedValue(createMockLog({ id: 2, projectCode: '25-043-02' }));
      const service2 = new ProvisioningService(mockDs2 as unknown as IDataService);

      const log1 = await service.provisionSite(createTestInput());
      const log2 = await service2.provisionSite(createTestInput({ projectCode: '25-043-02', leadId: 2 }));

      expect(log1.projectCode).toBe('25-042-01');
      expect(log2.projectCode).toBe('25-043-02');
    });
  });

  describe('edge cases', () => {
    it('already-completed log still returns from provisionSite', async () => {
      mockDs.triggerProvisioning.mockResolvedValue(createMockLog({
        status: ProvisioningStatus.Completed,
      }));
      const result = await service.provisionSite(createTestInput());
      expect(result.status).toBe(ProvisioningStatus.Completed);
    });

    it('getProvisioningStatus returns null for unknown project', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(null);
      const result = await service.getProvisioningStatus('nonexistent');
      expect(result).toBeNull();
    });

    it('MAX_RETRIES (3) exceeded returns descriptive error', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({ retryCount: 3 }));
      await expect(service.retryFromStep('25-042-01', 3)).rejects.toThrow(
        'Maximum retries (3) exceeded'
      );
      await expect(service.retryFromStep('25-042-01', 3)).rejects.toThrow(
        'Manual intervention required'
      );
    });

    it('retryFromStep with step 1 calls createProjectSite when useRealOps=true', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        retryCount: 0,
        siteUrl: '',
        division: 'Commercial',
        region: 'Miami',
      }));
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await realService.retryFromStep('25-042-01', 1);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockDs.createProjectSite).toHaveBeenCalled();
    });
  });

  describe('partial failure recovery', () => {
    it('resume from step 3 preserves siteUrl from log', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        retryCount: 0,
        division: 'Commercial',
        region: 'Miami',
      }));
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await realService.retryFromStep('25-042-01', 3);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      // Steps 1-2 skipped
      expect(mockDs.createProjectSite).not.toHaveBeenCalled();
      expect(mockDs.provisionProjectLists).not.toHaveBeenCalled();
      // Steps 3-6 called with preserved siteUrl
      expect(mockDs.associateWithHubSite).toHaveBeenCalledWith(
        'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        expect.any(String)
      );
    });

    it('resume from step 6 only calls step 6-7', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        retryCount: 0,
        division: 'Commercial',
        region: 'Miami',
      }));
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await realService.retryFromStep('25-042-01', 6);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();

      expect(mockDs.createProjectSite).not.toHaveBeenCalled();
      expect(mockDs.provisionProjectLists).not.toHaveBeenCalled();
      expect(mockDs.associateWithHubSite).not.toHaveBeenCalled();
      expect(mockDs.createProjectSecurityGroups).not.toHaveBeenCalled();
      expect(mockDs.copyTemplateFiles).not.toHaveBeenCalled();
      expect(mockDs.copyLeadDataToProjectSite).toHaveBeenCalled();
    });

    it('failed step is logged correctly in provisioning log', async () => {
      mockDs.createProjectSite.mockRejectedValue(new Error('Site creation denied'));
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        retryCount: 0,
        division: 'Commercial',
      }));
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await realService.retryFromStep('25-042-01', 1);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Failed,
          failedStep: 1,
          errorMessage: 'Site creation denied',
        })
      );
    });

    it('resume completes and marks log as Completed', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        retryCount: 0,
        division: 'Commercial',
        region: 'Miami',
      }));
      const realService = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await realService.retryFromStep('25-042-01', 5);
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Completed,
          completedAt: expect.any(String),
        })
      );
    });
  });

  describe('step-by-step log progress', () => {
    it('updates log with InProgress status at start of each step', async () => {
      await service.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      for (let step = 1; step <= TOTAL_PROVISIONING_STEPS; step++) {
        expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
          '25-042-01',
          expect.objectContaining({
            status: ProvisioningStatus.InProgress,
            currentStep: step,
            completedSteps: step - 1,
          })
        );
      }
    });

    it('updates log with completedSteps after each step succeeds', async () => {
      await service.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      for (let step = 1; step <= TOTAL_PROVISIONING_STEPS; step++) {
        expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
          '25-042-01',
          expect.objectContaining({
            currentStep: step,
            completedSteps: step,
          })
        );
      }
    });
  });
});
