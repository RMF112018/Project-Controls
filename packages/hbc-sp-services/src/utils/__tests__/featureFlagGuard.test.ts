import { assertFeatureFlagEnabled, FeatureFlagViolationError } from '../featureFlagGuard';
import type { IFeatureFlag } from '../../models/IFeatureFlag';

const makeFlag = (name: string, enabled: boolean): IFeatureFlag => ({
  id: 1,
  FeatureName: name,
  DisplayName: name,
  Enabled: enabled,
});

describe('featureFlagGuard', () => {
  describe('assertFeatureFlagEnabled', () => {
    it('throws when flag is not found', () => {
      expect(() =>
        assertFeatureFlagEnabled([], 'SiteTemplateManagement', 'syncTemplate')
      ).toThrow(FeatureFlagViolationError);
    });

    it('throws when flag is disabled', () => {
      const flags = [makeFlag('SiteTemplateManagement', false)];
      expect(() =>
        assertFeatureFlagEnabled(flags, 'SiteTemplateManagement', 'syncTemplate')
      ).toThrow(FeatureFlagViolationError);
    });

    it('passes when flag is enabled', () => {
      const flags = [makeFlag('SiteTemplateManagement', true)];
      expect(() =>
        assertFeatureFlagEnabled(flags, 'SiteTemplateManagement', 'syncTemplate')
      ).not.toThrow();
    });

    it('error message includes flag name and operation', () => {
      try {
        assertFeatureFlagEnabled([], 'TestFlag', 'testOp');
        fail('Expected error');
      } catch (err) {
        const e = err as FeatureFlagViolationError;
        expect(e.flagName).toBe('TestFlag');
        expect(e.operation).toBe('testOp');
        expect(e.message).toContain('TestFlag');
        expect(e.message).toContain('testOp');
      }
    });

    it('has correct error name', () => {
      try {
        assertFeatureFlagEnabled([], 'X', 'Y');
        fail('Expected error');
      } catch (err) {
        expect((err as Error).name).toBe('FeatureFlagViolationError');
      }
    });
  });
});
