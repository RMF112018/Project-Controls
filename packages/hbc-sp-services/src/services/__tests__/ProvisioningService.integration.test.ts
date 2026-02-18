/**
 * ProvisioningService — Integration Tests.
 * End-to-end workflow chains using mocked IDataService (not MockDataService).
 * Tests full pipeline flows, failure/retry workflows, feature flag toggling,
 * and audit trail verification.
 */
import { ProvisioningService } from '../ProvisioningService';
import { IDataService } from '../IDataService';
import { ProvisioningStatus, AuditAction, EntityType, NotificationEvent } from '../../models/enums';
import { TOTAL_PROVISIONING_STEPS } from '../../models/IProvisioningLog';
import {
  createTestInput,
  createMockLog,
  createProvisioningMockDataService,
  advanceAllSteps,
  flushPromises,
} from './provisioning-test-helpers';

describe('ProvisioningService integration', () => {
  let mockDs: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDs = createProvisioningMockDataService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ────────────────────────────────────────────────────────
  // Full provisioning pipeline (simulation mode)
  // ────────────────────────────────────────────────────────

  describe('full provisioning pipeline (simulation)', () => {
    it('completes all 7 steps and marks log as Completed', async () => {
      const service = new ProvisioningService(mockDs as unknown as IDataService);
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      const log = await service.provisionSite(createTestInput());
      expect(log.status).toBe(ProvisioningStatus.Queued);

      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Completed,
          completedSteps: TOTAL_PROVISIONING_STEPS,
        })
      );
    });

    it('log transitions through Queued -> InProgress -> Completed', async () => {
      const service = new ProvisioningService(mockDs as unknown as IDataService);
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      const log = await service.provisionSite(createTestInput());
      // Initial status
      expect(log.status).toBe(ProvisioningStatus.Queued);

      // After first step starts -> InProgress
      await advanceAllSteps(1);
      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({ status: ProvisioningStatus.InProgress })
      );

      // After all steps -> Completed
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS - 1);
      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({ status: ProvisioningStatus.Completed })
      );
    });

    it('final log has siteUrl and completedAt populated', async () => {
      const service = new ProvisioningService(mockDs as unknown as IDataService);
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      await service.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Completed,
          siteUrl: expect.any(String),
          completedAt: expect.any(String),
        })
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // Full provisioning pipeline (real ops)
  // ────────────────────────────────────────────────────────

  describe('full provisioning pipeline (real ops)', () => {
    it('all 7 executeStep real-dispatch calls fire', async () => {
      const service = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();
      await flushPromises();

      expect(mockDs.createProjectSite).toHaveBeenCalledTimes(1);
      expect(mockDs.provisionProjectLists).toHaveBeenCalledTimes(1);
      expect(mockDs.associateWithHubSite).toHaveBeenCalledTimes(1);
      expect(mockDs.createProjectSecurityGroups).toHaveBeenCalledTimes(1);
      expect(mockDs.copyTemplateFiles).toHaveBeenCalledTimes(1);
      expect(mockDs.copyLeadDataToProjectSite).toHaveBeenCalledTimes(1);
      // Step 7 is handled post-loop (updateLead)
      expect(mockDs.updateLead).toHaveBeenCalledTimes(1);
    });

    it('siteUrl from step 1 propagates to remaining steps', async () => {
      const testSiteUrl = 'https://hedrickbrotherscom.sharepoint.com/sites/custom123';
      mockDs.createProjectSite.mockResolvedValue({ siteUrl: testSiteUrl });
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: testSiteUrl,
      }));

      const service = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();

      // Step 2 should receive the siteUrl from step 1
      expect(mockDs.provisionProjectLists).toHaveBeenCalledWith(testSiteUrl, '25-042-01');
      // Step 3 should receive siteUrl
      expect(mockDs.associateWithHubSite).toHaveBeenCalledWith(testSiteUrl, expect.any(String));
    });
  });

  // ────────────────────────────────────────────────────────
  // Failure and retry workflow
  // ────────────────────────────────────────────────────────

  describe('failure and retry workflow', () => {
    it('step failure sets log to Failed, retry succeeds to Completed', async () => {
      // Step 3 fails on first attempt
      mockDs.associateWithHubSite
        .mockRejectedValueOnce(new Error('Hub unreachable'))
        .mockResolvedValueOnce(undefined);
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        retryCount: 0,
        division: 'Commercial',
        region: 'Miami',
      }));

      const service = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );

      // Initial attempt fails at step 3
      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();
      await flushPromises();

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Failed,
          failedStep: 3,
        })
      );

      // Retry from step 3
      await service.retryFromStep('25-042-01', 3);
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();
      await flushPromises();

      expect(mockDs.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Completed,
        })
      );
    });

    it('retry increments through retryProvisioning call', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        retryCount: 1,
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        division: 'Commercial',
      }));

      const service = new ProvisioningService(mockDs as unknown as IDataService);
      await service.retryFromStep('25-042-01', 3);

      expect(mockDs.retryProvisioning).toHaveBeenCalledWith('25-042-01', 3);
    });

    it('MAX_RETRIES exceeded keeps log in Failed state', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        retryCount: 3,
        status: ProvisioningStatus.Failed,
        failedStep: 2,
      }));

      const service = new ProvisioningService(mockDs as unknown as IDataService);

      await expect(service.retryFromStep('25-042-01', 2)).rejects.toThrow(
        'Maximum retries (3) exceeded'
      );
      // retryProvisioning should NOT have been called
      expect(mockDs.retryProvisioning).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // Feature flag toggling
  // ────────────────────────────────────────────────────────

  describe('feature flag toggling', () => {
    it('useRealOps=false calls simulateStep (no IDataService op methods called)', async () => {
      const service = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, false
      );
      await service.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      expect(mockDs.createProjectSite).not.toHaveBeenCalled();
      expect(mockDs.provisionProjectLists).not.toHaveBeenCalled();
      expect(mockDs.associateWithHubSite).not.toHaveBeenCalled();
      expect(mockDs.createProjectSecurityGroups).not.toHaveBeenCalled();
      expect(mockDs.copyTemplateFiles).not.toHaveBeenCalled();
      expect(mockDs.copyLeadDataToProjectSite).not.toHaveBeenCalled();
    });

    it('useRealOps=true calls IDataService operation methods', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const service = new ProvisioningService(
        mockDs as unknown as IDataService, undefined, undefined, undefined, false, true
      );
      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();

      expect(mockDs.createProjectSite).toHaveBeenCalled();
      expect(mockDs.provisionProjectLists).toHaveBeenCalled();
      expect(mockDs.associateWithHubSite).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // Audit trail verification
  // ────────────────────────────────────────────────────────

  describe('audit trail verification', () => {
    it('audit entries logged for trigger and completion', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const service = new ProvisioningService(mockDs as unknown as IDataService);
      await service.provisionSite(createTestInput());
      await advanceAllSteps(TOTAL_PROVISIONING_STEPS);

      // Trigger audit
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningTriggered,
          EntityType: EntityType.Project,
        })
      );

      // Completion audit
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SiteProvisioningCompleted,
          EntityType: EntityType.Project,
        })
      );
    });

    it('audit entry contains correct EntityId and ProjectCode', async () => {
      mockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));
      const service = new ProvisioningService(mockDs as unknown as IDataService);
      const input = createTestInput({ leadId: 42, projectCode: '25-100-01' });
      mockDs.triggerProvisioning.mockResolvedValue(createMockLog({ projectCode: '25-100-01', leadId: 42 }));

      await service.provisionSite(input);

      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          EntityId: '42',
          ProjectCode: '25-100-01',
        })
      );
    });

    it('separate provisions create separate audit trails', async () => {
      const mockDs2 = createProvisioningMockDataService();
      const service1 = new ProvisioningService(mockDs as unknown as IDataService);
      const service2 = new ProvisioningService(mockDs2 as unknown as IDataService);

      await service1.provisionSite(createTestInput({ projectCode: '25-042-01' }));
      await service2.provisionSite(createTestInput({ projectCode: '25-043-02', leadId: 2 }));

      // Each service's dataService should have been called
      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ ProjectCode: '25-042-01' })
      );
      expect(mockDs2.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ ProjectCode: '25-043-02' })
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // GitOps step 5 routing
  // ────────────────────────────────────────────────────────

  describe('GitOps step 5 routing', () => {
    function createGitOpsMockDataService(): Record<string, jest.Mock> {
      const base = createProvisioningMockDataService();
      return {
        ...base,
        getCommittedTemplateRegistry: jest.fn().mockResolvedValue({
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          lastModifiedBy: 'test@hedrickbrothers.com',
          templates: [],
        }),
        applyGitOpsTemplates: jest.fn().mockResolvedValue({ appliedCount: 0 }),
      };
    }

    it('calls applyGitOpsTemplates when useGitOpsProvisioning=true', async () => {
      const gitOpsMockDs = createGitOpsMockDataService();
      gitOpsMockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      // Args: dataService, hubNavService, powerAutomateService, offlineQueueService, usePowerAutomate, useRealOps, useGitOpsProvisioning
      const service = new ProvisioningService(
        gitOpsMockDs as unknown as IDataService,
        undefined, undefined, undefined,
        false, // usePowerAutomate
        true,  // useRealOps
        true   // useGitOpsProvisioning
      );

      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();
      await flushPromises();

      expect(gitOpsMockDs.applyGitOpsTemplates).toHaveBeenCalledTimes(1);
      expect(gitOpsMockDs.applyGitOpsTemplates).toHaveBeenCalledWith(
        expect.any(String), // siteUrl
        'Commercial',       // division from input
        expect.objectContaining({ templates: expect.any(Array) })
      );

      await flushPromises(); // allow fire-and-forget logAudit to settle
      expect(gitOpsMockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.TemplateAppliedFromGitOps,
        })
      );
    });

    it('calls copyTemplateFiles when useGitOpsProvisioning=false', async () => {
      const gitOpsMockDs = createGitOpsMockDataService();
      gitOpsMockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      const service = new ProvisioningService(
        gitOpsMockDs as unknown as IDataService,
        undefined, undefined, undefined,
        false, // usePowerAutomate
        true,  // useRealOps
        false  // useGitOpsProvisioning — traditional path
      );

      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();
      await flushPromises();

      expect(gitOpsMockDs.copyTemplateFiles).toHaveBeenCalledTimes(1);
      expect(gitOpsMockDs.applyGitOpsTemplates).not.toHaveBeenCalled();
    });

    it('never calls both copyTemplateFiles and applyGitOpsTemplates in same run', async () => {
      const gitOpsMockDs = createGitOpsMockDataService();
      gitOpsMockDs.getProvisioningStatus.mockResolvedValue(createMockLog({
        siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
      }));

      // Run with GitOps enabled
      const service = new ProvisioningService(
        gitOpsMockDs as unknown as IDataService,
        undefined, undefined, undefined,
        false, true, true
      );

      await service.provisionSite(createTestInput());
      await jest.advanceTimersByTimeAsync(5000);
      await flushPromises();
      await flushPromises();

      // Exactly one of the two step-5 methods should have been called
      const gitOpsCalled = (gitOpsMockDs.applyGitOpsTemplates as jest.Mock).mock.calls.length;
      const traditionalCalled = (gitOpsMockDs.copyTemplateFiles as jest.Mock).mock.calls.length;
      expect(gitOpsCalled + traditionalCalled).toBe(1);
      expect(gitOpsCalled).toBe(1);
      expect(traditionalCalled).toBe(0);
    });
  });
});
