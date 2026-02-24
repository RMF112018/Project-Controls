/**
 * Phase 5C: ProvisioningSaga unit tests
 *
 * Tests: happy path, failure-at-each-step compensation, compensation error
 * swallowing, idempotency uniqueness, SignalR broadcast calls.
 */
import { ProvisioningSaga } from '../ProvisioningSaga';
import { createProvisioningMockDataService, createTestInput } from './provisioning-test-helpers';
import { createMockBroadcast } from './saga-test-helpers';
import type { IDataService } from '../IDataService';

function createSaga(
  dsOverrides?: Partial<Record<string, jest.Mock>>,
  broadcast?: jest.Mock
) {
  const ds = { ...createProvisioningMockDataService(), ...dsOverrides };
  const saga = new ProvisioningSaga(ds as unknown as IDataService, broadcast);
  return { saga, ds };
}

describe('ProvisioningSaga', () => {
  // ── Idempotency Token ──

  describe('generateIdempotencyToken', () => {
    it('produces tokens in the correct format', () => {
      const token = ProvisioningSaga.generateIdempotencyToken('25-042-01');
      const parts = token.split('::');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('25-042-01');
      // ISO timestamp
      expect(new Date(parts[1]).toISOString()).toBe(parts[1]);
      // 4-char hex
      expect(parts[2]).toMatch(/^[0-9a-f]{4}$/);
    });

    it('produces unique tokens across calls', () => {
      const tokens = new Set(
        Array.from({ length: 50 }, () => ProvisioningSaga.generateIdempotencyToken('25-042-01'))
      );
      // At minimum the hex portion should differ (very high probability with 50 samples)
      expect(tokens.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Happy Path ──

  describe('execute — happy path', () => {
    it('completes all 7 steps successfully', async () => {
      const broadcast = createMockBroadcast();
      const { saga, ds } = createSaga(undefined, broadcast);
      const input = createTestInput();

      const result = await saga.execute(input);

      expect(result.success).toBe(true);
      expect(result.completedSteps).toBe(7);
      expect(result.failedStep).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(result.compensationResults).toBeUndefined();
      expect(result.idempotencyToken).toMatch(/^25-042-01::/);
      expect(result.siteUrl).toBeDefined();
    });

    it('calls each forward step method', async () => {
      const { saga, ds } = createSaga();
      const input = createTestInput();

      await saga.execute(input);

      expect(ds.createProjectSite).toHaveBeenCalledTimes(1);
      expect(ds.provisionProjectLists).toHaveBeenCalledTimes(1);
      expect(ds.associateWithHubSite).toHaveBeenCalledTimes(1);
      expect(ds.createProjectSecurityGroups).toHaveBeenCalledTimes(1);
      expect(ds.copyTemplateFiles).toHaveBeenCalledTimes(1);
      expect(ds.copyLeadDataToProjectSite).toHaveBeenCalledTimes(1);
      expect(ds.updateLead).toHaveBeenCalledTimes(1);
    });

    it('updates provisioning log to Completed', async () => {
      const { saga, ds } = createSaga();
      const input = createTestInput();

      await saga.execute(input);

      expect(ds.updateProvisioningLog).toHaveBeenCalledWith(
        input.projectCode,
        expect.objectContaining({ status: 'Completed', completedSteps: 7 })
      );
    });

    it('broadcasts status for each step', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(undefined, broadcast);
      const input = createTestInput();

      await saga.execute(input);

      // 7 steps x 2 broadcasts each (in_progress + completed) = 14
      expect(broadcast).toHaveBeenCalledTimes(14);
      // First call should be step 1 in_progress
      expect(broadcast.mock.calls[0][0]).toMatchObject({
        type: 'ProvisioningStatus',
        currentStep: 1,
        stepStatus: 'in_progress',
      });
    });
  });

  // ── Failure + Compensation ──

  describe('execute — failure at step 3 triggers compensation', () => {
    it('compensates steps 2 and 1 in reverse order', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('Hub association failed')),
      });
      const input = createTestInput();

      const result = await saga.execute(input);

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(3);
      expect(result.error).toBe('Hub association failed');
      expect(result.compensationResults).toHaveLength(2);
      // Reverse order: step 2 first, then step 1
      expect(result.compensationResults![0].step).toBe(2);
      expect(result.compensationResults![1].step).toBe(1);
      expect(result.compensationResults![0].success).toBe(true);
      expect(result.compensationResults![1].success).toBe(true);
    });

    it('calls the correct compensation methods', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('fail')),
      });

      await saga.execute(createTestInput());

      expect(ds.removeProvisionedLists).toHaveBeenCalledTimes(1);
      expect(ds.deleteProjectSite).toHaveBeenCalledTimes(1);
      // Steps after failure should NOT be called
      expect(ds.deleteProjectSecurityGroups).not.toHaveBeenCalled();
      expect(ds.removeTemplateFiles).not.toHaveBeenCalled();
      expect(ds.removeLeadDataFromProjectSite).not.toHaveBeenCalled();
    });
  });

  describe('execute — failure at step 1', () => {
    it('has no steps to compensate', async () => {
      const { saga } = createSaga({
        createProjectSite: jest.fn().mockRejectedValue(new Error('Site creation failed')),
      });

      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(1);
      expect(result.compensationResults).toHaveLength(0);
    });
  });

  describe('execute — failure at step 7', () => {
    it('compensates steps 6 through 1', async () => {
      const { saga } = createSaga({
        updateLead: jest.fn().mockRejectedValue(new Error('Lead update failed')),
      });

      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(7);
      expect(result.compensationResults).toHaveLength(6);
      // Check reverse order
      const steps = result.compensationResults!.map(r => r.step);
      expect(steps).toEqual([6, 5, 4, 3, 2, 1]);
    });
  });

  describe('execute — failure at step 5', () => {
    it('compensates steps 4, 3, 2, 1', async () => {
      const { saga } = createSaga({
        copyTemplateFiles: jest.fn().mockRejectedValue(new Error('Template copy failed')),
      });

      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(5);
      expect(result.compensationResults).toHaveLength(4);
      const steps = result.compensationResults!.map(r => r.step);
      expect(steps).toEqual([4, 3, 2, 1]);
    });
  });

  // ── Compensation Error Swallowing ──

  describe('compensation error swallowing', () => {
    it('continues compensation even when a compensation step fails', async () => {
      const { saga, ds } = createSaga({
        // Step 3 forward fails
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('hub fail')),
        // Step 2 compensation fails
        removeProvisionedLists: jest.fn().mockRejectedValue(new Error('cleanup fail')),
      });

      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(false);
      expect(result.compensationResults).toHaveLength(2);
      // Step 2 compensation failed
      expect(result.compensationResults![0].step).toBe(2);
      expect(result.compensationResults![0].success).toBe(false);
      expect(result.compensationResults![0].error).toBe('cleanup fail');
      // Step 1 compensation still ran and succeeded
      expect(result.compensationResults![1].step).toBe(1);
      expect(result.compensationResults![1].success).toBe(true);
    });

    it('logs audit entry for failed compensation', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('hub fail')),
        removeProvisionedLists: jest.fn().mockRejectedValue(new Error('cleanup fail')),
      });

      await saga.execute(createTestInput());

      expect(ds.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: 'Saga.CompensationFailed',
        })
      );
    });
  });

  // ── Status Broadcasts ──

  describe('signalR broadcast', () => {
    it('broadcasts "failed" status on step failure', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(
        { provisionProjectLists: jest.fn().mockRejectedValue(new Error('lists fail')) },
        broadcast
      );

      await saga.execute(createTestInput());

      const failedBroadcasts = broadcast.mock.calls
        .map((c: unknown[]) => c[0] as Record<string, unknown>)
        .filter((m) => m.stepStatus === 'failed');
      expect(failedBroadcasts).toHaveLength(1);
      expect(failedBroadcasts[0]).toMatchObject({
        currentStep: 2,
        stepStatus: 'failed',
        error: 'lists fail',
      });
    });

    it('broadcasts "compensating" status during compensation', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(
        { provisionProjectLists: jest.fn().mockRejectedValue(new Error('fail')) },
        broadcast
      );

      await saga.execute(createTestInput());

      const compensating = broadcast.mock.calls
        .map((c: unknown[]) => c[0] as Record<string, unknown>)
        .filter((m) => m.stepStatus === 'compensating');
      expect(compensating).toHaveLength(1); // Only step 1 to compensate
      expect(compensating[0]).toMatchObject({
        currentStep: 1,
        stepStatus: 'compensating',
      });
    });

    it('does not throw when no broadcast callback provided', async () => {
      const { saga } = createSaga(); // no broadcast
      const result = await saga.execute(createTestInput());
      expect(result.success).toBe(true);
    });
  });

  // ── Provisioning Log Updates ──

  describe('provisioning log updates', () => {
    it('sets status to Compensating during compensation', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('fail')),
      });

      await saga.execute(createTestInput());

      expect(ds.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({ status: 'Compensating' })
      );
    });

    it('stores compensationLog on the provisioning log', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('fail')),
      });

      await saga.execute(createTestInput());

      expect(ds.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          compensationLog: expect.arrayContaining([
            expect.objectContaining({ step: 2, success: true }),
            expect.objectContaining({ step: 1, success: true }),
          ]),
        })
      );
    });

    it('includes idempotencyToken in log updates', async () => {
      const { saga, ds } = createSaga();

      await saga.execute(createTestInput());

      const calls = (ds.updateProvisioningLog as jest.Mock).mock.calls;
      const tokenCalls = calls.filter(
        (c: unknown[]) => (c[1] as Record<string, unknown>).idempotencyToken
      );
      expect(tokenCalls.length).toBeGreaterThan(0);
      const token = (tokenCalls[0][1] as Record<string, unknown>).idempotencyToken as string;
      expect(token).toMatch(/^25-042-01::/);
    });
  });
});
