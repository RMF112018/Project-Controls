/**
 * Phase 7S3: Server-side feature flag assertion utility.
 *
 * Provides a throw-on-violation guard for feature-flag-gated mutations.
 * Ensures mutations cannot bypass client-side flag checks.
 */
import type { IFeatureFlag } from '../models/IFeatureFlag';

/**
 * Assert that a named feature flag is enabled.
 * Throws FeatureFlagViolationError if the flag is missing or disabled.
 *
 * @param flags - The full array of feature flags (from dataService.getFeatureFlags())
 * @param flagName - The FeatureName to check
 * @param operation - Description of the guarded operation (for error messages)
 */
export function assertFeatureFlagEnabled(
  flags: IFeatureFlag[],
  flagName: string,
  operation: string
): void {
  const flag = flags.find(f => f.FeatureName === flagName);
  if (!flag) {
    throw new FeatureFlagViolationError(flagName, operation, `Feature flag "${flagName}" not found`);
  }
  if (!flag.Enabled) {
    throw new FeatureFlagViolationError(flagName, operation, `Feature flag "${flagName}" is disabled`);
  }
}

export class FeatureFlagViolationError extends Error {
  public readonly name = 'FeatureFlagViolationError';
  public readonly flagName: string;
  public readonly operation: string;

  constructor(flagName: string, operation: string, message: string) {
    super(`${message}. Operation "${operation}" is not permitted.`);
    this.flagName = flagName;
    this.operation = operation;
  }
}
