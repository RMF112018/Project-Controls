import {
  validateIdempotencyToken,
  generateCryptoHex4,
} from '../idempotencyTokenValidator';
import type { IProvisioningLog } from '../../models/IProvisioningLog';
import { ProvisioningStatus } from '../../models/enums';

const makeLog = (token: string, projectCode = 'HBC-001'): IProvisioningLog => ({
  id: 1,
  projectCode,
  projectName: 'Test',
  leadId: 1,
  status: ProvisioningStatus.Completed,
  currentStep: 7,
  completedSteps: 7,
  retryCount: 0,
  requestedBy: 'test@hbc.com',
  requestedAt: new Date().toISOString(),
  idempotencyToken: token,
});

function makeToken(projectCode: string, date?: Date): string {
  const d = date || new Date();
  const hex = 'abcd';
  return `${projectCode}::${d.toISOString()}::${hex}`;
}

describe('idempotencyTokenValidator', () => {
  describe('validateIdempotencyToken', () => {
    it('valid token passes', () => {
      const token = makeToken('HBC-001');
      const result = validateIdempotencyToken(token, 'HBC-001', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('invalid format is rejected', () => {
      const result = validateIdempotencyToken('not-a-valid-token', 'HBC-001', []);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('format');
    });

    it('expired token is rejected', () => {
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const token = makeToken('HBC-001', oldDate);
      const result = validateIdempotencyToken(token, 'HBC-001', []);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('expired'))).toBe(true);
    });

    it('future token is rejected (clock skew)', () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 min in future
      const token = makeToken('HBC-001', futureDate);
      const result = validateIdempotencyToken(token, 'HBC-001', []);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('future'))).toBe(true);
    });

    it('replay is detected', () => {
      const token = makeToken('HBC-001');
      const logs = [makeLog(token, 'HBC-001')];
      const result = validateIdempotencyToken(token, 'HBC-001', logs);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('already been used'))).toBe(true);
    });

    it('project code mismatch is rejected', () => {
      const token = makeToken('HBC-002');
      const result = validateIdempotencyToken(token, 'HBC-001', []);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('does not match'))).toBe(true);
    });
  });

  describe('generateCryptoHex4', () => {
    it('produces 4-character hex string', () => {
      const hex = generateCryptoHex4();
      expect(hex).toMatch(/^[0-9a-f]{4}$/);
    });

    it('produces varied output across calls', () => {
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        results.add(generateCryptoHex4());
      }
      // With 16-bit random, 20 calls should produce at least 2 unique values
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
