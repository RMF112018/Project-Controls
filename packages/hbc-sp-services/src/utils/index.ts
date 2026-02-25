/**
 * Utils barrel export — Phase 7S3
 */
export {
  ListThresholdGuard,
  listThresholdGuard,
  ThresholdLevel,
} from './ListThresholdGuard';
export type { IThresholdResult } from './ListThresholdGuard';
export { LIST_THRESHOLD_WARNING, LIST_THRESHOLD_CRITICAL } from './constants';

// Phase 7S3: Security Hardening utilities
export { sanitizeODataString, sanitizeODataNumber, safeODataEq, safeODataSubstringOf, ODataSanitizationError } from './odataSanitizer';
export { assertFeatureFlagEnabled, FeatureFlagViolationError } from './featureFlagGuard';
export { validateIdempotencyToken, generateCryptoHex4 } from './idempotencyTokenValidator';
export type { ITokenValidationResult } from './idempotencyTokenValidator';
export {
  assertValidSyncTransition, TemplateSyncTransitionError,
  acquireSyncLock, releaseSyncLock, resetSyncLocks, TemplateSyncLockError,
  validateTemplateContent, TemplateContentValidationError,
  assertSyncApproved, InsufficientApprovalsError, SYNC_REQUIRED_APPROVALS,
} from './templateSyncGuard';
export type { ISyncApproval } from './templateSyncGuard';
export { detectEscalation, assertNotSelfEscalation, PermissionEscalationError, checkRateLimit, RateLimitError, resetRateLimiter } from './escalationGuard';
export { GRAPH_SCOPE_POLICY, assertSufficientScope, InsufficientScopeError } from './graphScopePolicy';
export type { GraphOperation } from './graphScopePolicy';
