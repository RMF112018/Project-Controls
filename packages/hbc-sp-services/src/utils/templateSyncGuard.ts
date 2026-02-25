/**
 * Phase 7S3: Template sync state machine, content validation, and multi-approver gates.
 *
 * Provides transition guards for TemplateSyncStatus, concurrency locks,
 * XSS/injection validation for template content, and multi-approver gate enforcement.
 */
import { TemplateSyncStatus } from '../models/enums';
import type { ISiteTemplate } from '../models/ISiteTemplate';

// --- State Machine ---

const VALID_TRANSITIONS: Record<TemplateSyncStatus, TemplateSyncStatus[]> = {
  [TemplateSyncStatus.Idle]: [TemplateSyncStatus.Syncing],
  [TemplateSyncStatus.Syncing]: [TemplateSyncStatus.Success, TemplateSyncStatus.Failed],
  [TemplateSyncStatus.Success]: [TemplateSyncStatus.Syncing, TemplateSyncStatus.Idle],
  [TemplateSyncStatus.Failed]: [TemplateSyncStatus.Syncing, TemplateSyncStatus.Idle],
};

export function assertValidSyncTransition(from: TemplateSyncStatus, to: TemplateSyncStatus): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new TemplateSyncTransitionError(from, to);
  }
}

export class TemplateSyncTransitionError extends Error {
  public readonly name = 'TemplateSyncTransitionError';
  public readonly from: TemplateSyncStatus;
  public readonly to: TemplateSyncStatus;

  constructor(from: TemplateSyncStatus, to: TemplateSyncStatus) {
    super(`Invalid sync transition: ${from} → ${to}`);
    this.from = from;
    this.to = to;
  }
}

// --- Sync Lock ---

const activeLocks = new Set<string>();

export function acquireSyncLock(templateId: string): void {
  if (activeLocks.has(templateId)) {
    throw new TemplateSyncLockError(templateId);
  }
  activeLocks.add(templateId);
}

export function releaseSyncLock(templateId: string): void {
  activeLocks.delete(templateId);
}

/** Reset all locks (test utility) */
export function resetSyncLocks(): void {
  activeLocks.clear();
}

export class TemplateSyncLockError extends Error {
  public readonly name = 'TemplateSyncLockError';
  public readonly templateId: string;

  constructor(templateId: string) {
    super(`Sync lock already held for template "${templateId}"`);
    this.templateId = templateId;
  }
}

// --- Content Validation ---

const SCRIPT_INJECTION_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
  /vbscript:/i,
  /data:\s*text\/html/i,
];

const SP_DOMAIN_REGEX = /^https:\/\/[\w-]+\.sharepoint\.com\//;
const HTTPS_REGEX = /^https:\/\//;

export function validateTemplateContent(template: Partial<ISiteTemplate>): string[] {
  const violations: string[] = [];

  // Validate TemplateSiteUrl
  if (template.TemplateSiteUrl && !SP_DOMAIN_REGEX.test(template.TemplateSiteUrl)) {
    violations.push(`TemplateSiteUrl must be a SharePoint domain (https://*.sharepoint.com/). Got: "${template.TemplateSiteUrl}"`);
  }

  // Validate GitRepoUrl
  if (template.GitRepoUrl && !HTTPS_REGEX.test(template.GitRepoUrl)) {
    violations.push(`GitRepoUrl must use HTTPS. Got: "${template.GitRepoUrl}"`);
  }

  // Check Description for script injection
  if (template.Description) {
    for (const pattern of SCRIPT_INJECTION_PATTERNS) {
      if (pattern.test(template.Description)) {
        violations.push(`Description contains potentially dangerous content matching pattern: ${pattern.source}`);
        break;
      }
    }
  }

  // Check Title for injection
  if (template.Title) {
    for (const pattern of SCRIPT_INJECTION_PATTERNS) {
      if (pattern.test(template.Title)) {
        violations.push(`Title contains potentially dangerous content`);
        break;
      }
    }
  }

  return violations;
}

export class TemplateContentValidationError extends Error {
  public readonly name = 'TemplateContentValidationError';
  public readonly violations: string[];

  constructor(violations: string[]) {
    super(`Template content validation failed: ${violations.join('; ')}`);
    this.violations = violations;
  }
}

// --- Multi-Approver Gate ---

export interface ISyncApproval {
  approverEmail: string;
  approvedAt: string;
  role: string;
}

export const SYNC_REQUIRED_APPROVALS = 2;

/**
 * Assert that sufficient unique approvals have been collected for a sync operation.
 * Deduplicates by approverEmail — the same person cannot count as two approvals.
 */
export function assertSyncApproved(
  approvals: ISyncApproval[],
  requiredCount: number = SYNC_REQUIRED_APPROVALS
): void {
  const uniqueApprovers = new Set(approvals.map(a => a.approverEmail.toLowerCase()));
  if (uniqueApprovers.size < requiredCount) {
    throw new InsufficientApprovalsError(uniqueApprovers.size, requiredCount);
  }
}

export class InsufficientApprovalsError extends Error {
  public readonly name = 'InsufficientApprovalsError';
  public readonly actualCount: number;
  public readonly requiredCount: number;

  constructor(actualCount: number, requiredCount: number) {
    super(`Insufficient approvals: ${actualCount} of ${requiredCount} required`);
    this.actualCount = actualCount;
    this.requiredCount = requiredCount;
  }
}
