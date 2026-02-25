/**
 * Phase 7S3: Idempotency token validation and crypto-safe generation.
 *
 * Token format: `${projectCode}::${ISO-timestamp}::${4-char-hex}`
 * Validates: format regex, project code match, 24h expiry, 5min clock skew, replay detection.
 */
import type { IProvisioningLog } from '../models/IProvisioningLog';

/** Regex for token format: anything::ISO-timestamp::4-hex */
const TOKEN_REGEX = /^(.+)::(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)::([0-9a-f]{4})$/;

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes

export interface ITokenValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate an idempotency token against project code, age, and replay.
 */
export function validateIdempotencyToken(
  token: string,
  projectCode: string,
  existingLogs: IProvisioningLog[],
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): ITokenValidationResult {
  const errors: string[] = [];
  const match = TOKEN_REGEX.exec(token);

  if (!match) {
    errors.push('Token format is invalid. Expected: projectCode::ISO-timestamp::hex4');
    return { isValid: false, errors };
  }

  const [, tokenProjectCode, timestampStr] = match;
  const tokenTimestamp = new Date(timestampStr).getTime();
  const now = Date.now();

  // Project code match
  if (tokenProjectCode !== projectCode) {
    errors.push(`Token project code "${tokenProjectCode}" does not match expected "${projectCode}"`);
  }

  // Expiry check (24h default)
  if (now - tokenTimestamp > maxAgeMs) {
    errors.push(`Token expired. Age: ${Math.round((now - tokenTimestamp) / 1000)}s, max: ${Math.round(maxAgeMs / 1000)}s`);
  }

  // Future clock skew check (5 min tolerance)
  if (tokenTimestamp > now + CLOCK_SKEW_MS) {
    errors.push(`Token timestamp is too far in the future (clock skew > ${CLOCK_SKEW_MS / 1000}s)`);
  }

  // Replay detection
  const replay = existingLogs.find(log => log.idempotencyToken === token);
  if (replay) {
    errors.push(`Token has already been used for project "${replay.projectCode}" (log id: ${replay.id})`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Generate a cryptographically safe 4-character hex string.
 * Falls back to Math.random() when crypto.getRandomValues is unavailable.
 */
export function generateCryptoHex4(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint16Array(1);
      crypto.getRandomValues(arr);
      return arr[0].toString(16).padStart(4, '0');
    }
  } catch {
    // Fall through to Math.random fallback
  }
  return Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
}
