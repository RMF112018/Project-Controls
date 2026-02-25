/**
 * Phase 7S3: Permission escalation prevention.
 *
 * Detects self-escalation attempts (user granting permissions they don't hold),
 * enforces rate limiting on role mutations, and provides SOC2-compatible guards.
 */
import type { ICurrentUser } from '../models/IRole';

// --- Escalation Detection ---

/**
 * Detect permissions in a role configuration that the current user does not hold.
 * Returns the list of escalated (unauthorized) permissions.
 */
export function detectEscalation(
  currentUser: ICurrentUser,
  rolePermissions: string[]
): string[] {
  return rolePermissions.filter(p => !currentUser.permissions.has(p));
}

/**
 * Assert that a user is not attempting to grant permissions they don't hold.
 * Throws PermissionEscalationError if escalation is detected.
 */
export function assertNotSelfEscalation(
  currentUser: ICurrentUser,
  rolePermissions: string[]
): void {
  const escalated = detectEscalation(currentUser, rolePermissions);
  if (escalated.length > 0) {
    throw new PermissionEscalationError(currentUser.email, escalated);
  }
}

export class PermissionEscalationError extends Error {
  public readonly name = 'PermissionEscalationError';
  public readonly userEmail: string;
  public readonly attemptedPermissions: string[];

  constructor(userEmail: string, attemptedPermissions: string[]) {
    super(
      `Permission escalation blocked for ${userEmail}: attempted to grant [${attemptedPermissions.join(', ')}]`
    );
    this.userEmail = userEmail;
    this.attemptedPermissions = attemptedPermissions;
  }
}

// --- Rate Limiting ---

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX = 10;

interface IRateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, IRateLimitEntry>();

/**
 * Check rate limit for a user+operation combination.
 * Sliding window: 10 mutations per 60 seconds.
 */
export function checkRateLimit(userEmail: string, operation: string): void {
  const key = `${userEmail}::${operation}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { timestamps: [] };

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    throw new RateLimitError(operation, RATE_LIMIT_WINDOW_MS);
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);
}

export class RateLimitError extends Error {
  public readonly name = 'RateLimitError';
  public readonly operation: string;
  public readonly windowMs: number;

  constructor(operation: string, windowMs: number) {
    super(`Rate limit exceeded for operation "${operation}": max ${RATE_LIMIT_MAX} per ${windowMs / 1000}s`);
    this.operation = operation;
    this.windowMs = windowMs;
  }
}

/** Reset rate limiter state (test utility) */
export function resetRateLimiter(): void {
  rateLimitStore.clear();
}
