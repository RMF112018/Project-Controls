/**
 * ProvisioningSaga — Mutation-Killing Supplement Tests
 *
 * Targets mutation-vulnerable code paths: exact boundary values, strict reverse
 * ordering assertions, idempotency token format enforcement, progress calculation
 * precision, compensation result shape enforcement, step count constants,
 * siteAlias sanitisation, and dual-path template routing.
 */
import { ProvisioningSaga } from '../ProvisioningSaga';
import { createProvisioningMockDataService, createTestInput } from './provisioning-test-helpers';
import { createMockBroadcast } from './saga-test-helpers';
import type { IDataService } from '../IDataService';
import type { ICompensationResult } from '../../models/IProvisioningSaga';
import type { IProvisioningStatusMessage } from '../../models/ISignalRMessage';
import { TOTAL_PROVISIONING_STEPS, PROVISIONING_STEPS, ProvisioningStatus, AuditAction, EntityType } from '../../models';

function createSaga(
  dsOverrides?: Partial<Record<string, jest.Mock>>,
  broadcast?: jest.Mock
) {
  const ds = { ...createProvisioningMockDataService(), ...dsOverrides };
  const saga = new ProvisioningSaga(ds as unknown as IDataService, broadcast);
  return { saga, ds };
}

describe('ProvisioningSaga — Mutation-Killing Supplement', () => {
  // ── Constants & Step Count ──

  describe('step constants', () => {
    it('TOTAL_PROVISIONING_STEPS is exactly 7', () => {
      expect(TOTAL_PROVISIONING_STEPS).toBe(7);
    });

    it('PROVISIONING_STEPS array has exactly 7 entries', () => {
      expect(PROVISIONING_STEPS).toHaveLength(7);
    });

    it('PROVISIONING_STEPS step numbers are 1 through 7 in order', () => {
      const stepNumbers = PROVISIONING_STEPS.map(s => s.step);
      expect(stepNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('each PROVISIONING_STEPS entry has a non-empty label', () => {
      for (const entry of PROVISIONING_STEPS) {
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Idempotency Token Format Precision ──

  describe('idempotency token format precision', () => {
    it('token has exactly 3 parts separated by ::', () => {
      const token = ProvisioningSaga.generateIdempotencyToken('PROJ-001');
      const parts = token.split('::');
      expect(parts.length).toBe(3);
    });

    it('first part is the exact projectCode passed in', () => {
      const code = 'XY-999-AB';
      const token = ProvisioningSaga.generateIdempotencyToken(code);
      expect(token.startsWith(`${code}::`)).toBe(true);
    });

    it('second part is a valid ISO 8601 timestamp ending in Z', () => {
      const token = ProvisioningSaga.generateIdempotencyToken('P1');
      const parts = token.split('::');
      const ts = parts[1];
      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // Round-trip check: parsing and re-serialising must be identical
      expect(new Date(ts).toISOString()).toBe(ts);
    });

    it('third part is exactly 4 lowercase hex characters', () => {
      const token = ProvisioningSaga.generateIdempotencyToken('P1');
      const hex = token.split('::')[2];
      expect(hex).toMatch(/^[0-9a-f]{4}$/);
      expect(hex.length).toBe(4);
    });

    it('tokens generated 100 times for the same project have >= 2 unique values', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(ProvisioningSaga.generateIdempotencyToken('DUP'));
      }
      expect(tokens.size).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Compensation Strict Reverse Order ──

  describe('compensation strict reverse ordering', () => {
    it('failure at step 4 compensates [3, 2, 1] in that exact order', async () => {
      const { saga } = createSaga({
        createProjectSecurityGroups: jest.fn().mockRejectedValue(new Error('sec fail')),
      });

      const result = await saga.execute(createTestInput());
      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(4);
      expect(result.compensationResults).toHaveLength(3);
      const steps = result.compensationResults!.map(r => r.step);
      expect(steps).toEqual([3, 2, 1]);
    });

    it('failure at step 6 compensates [5, 4, 3, 2, 1]', async () => {
      const { saga } = createSaga({
        copyLeadDataToProjectSite: jest.fn().mockRejectedValue(new Error('lead fail')),
      });

      const result = await saga.execute(createTestInput());
      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(6);
      expect(result.compensationResults).toHaveLength(5);
      expect(result.compensationResults!.map(r => r.step)).toEqual([5, 4, 3, 2, 1]);
    });

    it('failure at step 2 compensates only [1]', async () => {
      const { saga } = createSaga({
        provisionProjectLists: jest.fn().mockRejectedValue(new Error('list fail')),
      });

      const result = await saga.execute(createTestInput());
      expect(result.success).toBe(false);
      expect(result.failedStep).toBe(2);
      expect(result.compensationResults).toHaveLength(1);
      expect(result.compensationResults![0].step).toBe(1);
    });
  });

  // ── Compensation Result Shape ──

  describe('compensation result shape enforcement', () => {
    it('each compensation result has step, label, success, duration, and timestamp', async () => {
      const { saga } = createSaga({
        updateLead: jest.fn().mockRejectedValue(new Error('lead update fail')),
      });

      const result = await saga.execute(createTestInput());
      expect(result.compensationResults).toBeDefined();
      for (const cr of result.compensationResults!) {
        expect(typeof cr.step).toBe('number');
        expect(typeof cr.label).toBe('string');
        expect(typeof cr.success).toBe('boolean');
        expect(typeof cr.duration).toBe('number');
        expect(typeof cr.timestamp).toBe('string');
        // Duration must be non-negative
        expect(cr.duration).toBeGreaterThanOrEqual(0);
        // Timestamp must be valid ISO
        expect(new Date(cr.timestamp).toISOString()).toBe(cr.timestamp);
      }
    });

    it('failed compensation result includes error string', async () => {
      const { saga } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('hub fail')),
        removeProvisionedLists: jest.fn().mockRejectedValue(new Error('cleanup kaboom')),
      });

      const result = await saga.execute(createTestInput());
      const failedComp = result.compensationResults!.find(r => !r.success);
      expect(failedComp).toBeDefined();
      expect(failedComp!.error).toBe('cleanup kaboom');
      expect(failedComp!.success).toBe(false);
    });

    it('successful compensation result has success === true and no error', async () => {
      const { saga } = createSaga({
        provisionProjectLists: jest.fn().mockRejectedValue(new Error('fail')),
      });

      const result = await saga.execute(createTestInput());
      const successComp = result.compensationResults!.find(r => r.success);
      expect(successComp).toBeDefined();
      expect(successComp!.success).toBe(true);
      expect(successComp!.error).toBeUndefined();
    });
  });

  // ── Progress Calculation Precision ──

  describe('broadcast progress calculation', () => {
    it('in_progress broadcast for step 1 has progress 0 (0 completed)', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(undefined, broadcast);
      await saga.execute(createTestInput());

      // First broadcast: step 1 in_progress, completedCount=0
      const firstMsg = broadcast.mock.calls[0][0] as IProvisioningStatusMessage;
      expect(firstMsg.currentStep).toBe(1);
      expect(firstMsg.stepStatus).toBe('in_progress');
      // progress = Math.round((0 / 7) * 100) = 0
      expect(firstMsg.progress).toBe(0);
    });

    it('completed broadcast for step 1 has progress 14 (1/7 * 100 rounded)', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(undefined, broadcast);
      await saga.execute(createTestInput());

      // Second broadcast: step 1 completed, completedCount=1
      const secondMsg = broadcast.mock.calls[1][0] as IProvisioningStatusMessage;
      expect(secondMsg.currentStep).toBe(1);
      expect(secondMsg.stepStatus).toBe('completed');
      // progress = Math.round((1 / 7) * 100) = 14
      expect(secondMsg.progress).toBe(14);
    });

    it('completed broadcast for step 7 has progress 100 (7/7 * 100)', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(undefined, broadcast);
      await saga.execute(createTestInput());

      // Last broadcast: step 7 completed, completedCount=7
      const lastMsg = broadcast.mock.calls[broadcast.mock.calls.length - 1][0] as IProvisioningStatusMessage;
      expect(lastMsg.currentStep).toBe(7);
      expect(lastMsg.stepStatus).toBe('completed');
      expect(lastMsg.progress).toBe(100);
    });

    it('broadcasts include totalSteps equal to TOTAL_PROVISIONING_STEPS', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(undefined, broadcast);
      await saga.execute(createTestInput());

      for (const call of broadcast.mock.calls) {
        const msg = call[0] as IProvisioningStatusMessage;
        expect(msg.totalSteps).toBe(TOTAL_PROVISIONING_STEPS);
      }
    });

    it('broadcast message type is always "ProvisioningStatus"', async () => {
      const broadcast = createMockBroadcast();
      const { saga } = createSaga(undefined, broadcast);
      await saga.execute(createTestInput());

      for (const call of broadcast.mock.calls) {
        expect((call[0] as IProvisioningStatusMessage).type).toBe('ProvisioningStatus');
      }
    });
  });

  // ── siteAlias Sanitisation ──

  describe('siteAlias sanitisation', () => {
    it('strips hyphens from projectCode when no siteNameOverride', async () => {
      const { saga, ds } = createSaga();
      const input = createTestInput({ projectCode: '25-042-01' });
      await saga.execute(input);

      // createProjectSite receives stripped alias
      expect(ds.createProjectSite).toHaveBeenCalledWith(
        '25-042-01',
        'Test Project',
        '2504201' // hyphens stripped
      );
    });

    it('uses sanitised siteNameOverride when provided', async () => {
      const { saga, ds } = createSaga();
      const input = createTestInput({ siteNameOverride: 'My New Site!@#123' });
      await saga.execute(input);

      // Non-alphanumeric/hyphen characters stripped
      expect(ds.createProjectSite).toHaveBeenCalledWith(
        '25-042-01',
        'Test Project',
        'MyNewSite123' // only [a-zA-Z0-9-] kept
      );
    });
  });

  // ── Step 5 Dual-Path (Template vs Legacy) ──

  describe('step 5 dual-path routing', () => {
    it('uses applyTemplateToSite when templateName is provided', async () => {
      const applyMock = jest.fn().mockResolvedValue({ appliedCount: 5, templateName: 'Commercial' });
      const { saga, ds } = createSaga({ applyTemplateToSite: applyMock });
      const input = createTestInput({ templateName: 'Commercial' as 'Default' | 'Commercial' | 'Luxury Residential' });

      await saga.execute(input);

      expect(applyMock).toHaveBeenCalledTimes(1);
      expect(ds.copyTemplateFiles).not.toHaveBeenCalled();
    });

    it('uses copyTemplateFiles when templateName is absent', async () => {
      const applyMock = jest.fn();
      const { saga, ds } = createSaga({ applyTemplateToSite: applyMock });
      const input = createTestInput(); // no templateName

      await saga.execute(input);

      expect(ds.copyTemplateFiles).toHaveBeenCalledTimes(1);
      expect(applyMock).not.toHaveBeenCalled();
    });
  });

  // ── Execution Result Success Shape ──

  describe('success result shape', () => {
    it('success result has no failedStep, no error, no compensationResults', async () => {
      const { saga } = createSaga();
      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(true);
      expect(result.failedStep).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(result.compensationResults).toBeUndefined();
    });

    it('success result completedSteps equals TOTAL_PROVISIONING_STEPS exactly', async () => {
      const { saga } = createSaga();
      const result = await saga.execute(createTestInput());

      expect(result.completedSteps).toBe(TOTAL_PROVISIONING_STEPS);
      expect(result.completedSteps).toBe(7);
    });

    it('success result includes idempotencyToken and siteUrl', async () => {
      const { saga } = createSaga();
      const result = await saga.execute(createTestInput());

      expect(typeof result.idempotencyToken).toBe('string');
      expect(result.idempotencyToken.length).toBeGreaterThan(0);
      expect(typeof result.siteUrl).toBe('string');
    });
  });

  // ── Failure Result Shape ──

  describe('failure result shape', () => {
    it('failure result includes failedStep, error, and compensationResults', async () => {
      const { saga } = createSaga({
        provisionProjectLists: jest.fn().mockRejectedValue(new Error('boom')),
      });
      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(false);
      expect(typeof result.failedStep).toBe('number');
      expect(typeof result.error).toBe('string');
      expect(result.error).toBe('boom');
      expect(Array.isArray(result.compensationResults)).toBe(true);
    });

    it('failure result completedSteps is less than TOTAL_PROVISIONING_STEPS', async () => {
      const { saga } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const result = await saga.execute(createTestInput());

      expect(result.completedSteps).toBe(2);
      expect(result.completedSteps).toBeLessThan(TOTAL_PROVISIONING_STEPS);
    });
  });

  // ── Audit Logging Precision ──

  describe('audit logging on failure', () => {
    it('logs SagaCompensationStarted with correct EntityType and EntityId', async () => {
      const { saga, ds } = createSaga({
        provisionProjectLists: jest.fn().mockRejectedValue(new Error('fail')),
      });
      const input = createTestInput();
      await saga.execute(input);

      expect(ds.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.SagaCompensationStarted,
          EntityType: EntityType.Project,
          EntityId: '25-042-01',
          User: 'admin@test.com',
        })
      );
    });

    it('logs SagaStepCompensated after each successful compensation step', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('fail')),
      });
      await saga.execute(createTestInput());

      // Steps 2 and 1 compensated successfully
      const compensatedCalls = (ds.logAudit as jest.Mock).mock.calls.filter(
        (c: unknown[]) => (c[0] as Record<string, unknown>).Action === AuditAction.SagaStepCompensated
      );
      expect(compensatedCalls.length).toBe(2);
    });

    it('SagaCompensationFailed details include "CRITICAL" for critical steps', async () => {
      const { saga, ds } = createSaga({
        // Fail at step 2 to trigger compensation of step 1 (critical)
        provisionProjectLists: jest.fn().mockRejectedValue(new Error('forward fail')),
        // Step 1 compensation (deleteProjectSite) also fails
        deleteProjectSite: jest.fn().mockRejectedValue(new Error('delete fail')),
      });
      await saga.execute(createTestInput());

      const failedAudit = (ds.logAudit as jest.Mock).mock.calls.find(
        (c: unknown[]) => (c[0] as Record<string, unknown>).Action === AuditAction.SagaCompensationFailed
      );
      expect(failedAudit).toBeDefined();
      const details = (failedAudit![0] as Record<string, unknown>).Details as string;
      expect(details).toContain('CRITICAL');
      expect(details).toContain('manual intervention required');
    });
  });

  // ── Log Updates Precision ──

  describe('provisioning log update precision', () => {
    it('InProgress log update includes currentStep and completedSteps count', async () => {
      const { saga, ds } = createSaga();
      await saga.execute(createTestInput());

      // After step 3 completes, should update with currentStep=3, completedSteps=3
      const calls = (ds.updateProvisioningLog as jest.Mock).mock.calls;
      const step3Call = calls.find(
        (c: unknown[]) => {
          const data = c[1] as Record<string, unknown>;
          return data.status === ProvisioningStatus.InProgress && data.currentStep === 3;
        }
      );
      expect(step3Call).toBeDefined();
      expect((step3Call![1] as Record<string, unknown>).completedSteps).toBe(3);
    });

    it('Failed log update includes failedStep and errorMessage', async () => {
      const { saga, ds } = createSaga({
        associateWithHubSite: jest.fn().mockRejectedValue(new Error('hub error msg')),
      });
      await saga.execute(createTestInput());

      expect(ds.updateProvisioningLog).toHaveBeenCalledWith(
        '25-042-01',
        expect.objectContaining({
          status: ProvisioningStatus.Failed,
          failedStep: 3,
          errorMessage: 'hub error msg',
        })
      );
    });

    it('Completed log update includes completedAt ISO timestamp', async () => {
      const { saga, ds } = createSaga();
      await saga.execute(createTestInput());

      const calls = (ds.updateProvisioningLog as jest.Mock).mock.calls;
      const completedCall = calls.find(
        (c: unknown[]) => (c[1] as Record<string, unknown>).status === ProvisioningStatus.Completed
      );
      expect(completedCall).toBeDefined();
      const logData = completedCall![1] as Record<string, unknown>;
      expect(typeof logData.completedAt).toBe('string');
      expect(new Date(logData.completedAt as string).toISOString()).toBe(logData.completedAt);
    });
  });

  // ── Non-Error Thrown Values ──

  describe('non-Error thrown values', () => {
    it('handles non-Error thrown value by converting to string', async () => {
      const { saga } = createSaga({
        provisionProjectLists: jest.fn().mockRejectedValue('string-error'),
      });
      const result = await saga.execute(createTestInput());

      expect(result.success).toBe(false);
      expect(result.error).toBe('string-error');
    });
  });

  // ── Step 1 siteUrl Capture ──

  describe('step 1 siteUrl capture', () => {
    it('captures siteUrl from step 1 result and includes it in success result', async () => {
      const customUrl = 'https://custom-site.sharepoint.com/sites/custom';
      const { saga } = createSaga({
        createProjectSite: jest.fn().mockResolvedValue({ siteUrl: customUrl }),
      });
      const result = await saga.execute(createTestInput());

      expect(result.siteUrl).toBe(customUrl);
    });

    it('siteUrl is undefined or empty when step 1 fails', async () => {
      const { saga } = createSaga({
        createProjectSite: jest.fn().mockRejectedValue(new Error('site creation failed')),
      });
      const result = await saga.execute(createTestInput());

      // siteUrl should be undefined since step 1 never completed
      expect(result.siteUrl).toBeUndefined();
    });
  });
});
