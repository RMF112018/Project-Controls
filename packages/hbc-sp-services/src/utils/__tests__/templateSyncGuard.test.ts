import {
  assertValidSyncTransition,
  TemplateSyncTransitionError,
  acquireSyncLock,
  releaseSyncLock,
  resetSyncLocks,
  TemplateSyncLockError,
  validateTemplateContent,
  assertSyncApproved,
  InsufficientApprovalsError,
} from '../templateSyncGuard';
import { TemplateSyncStatus } from '../../models/enums';
import type { ISyncApproval } from '../templateSyncGuard';

describe('templateSyncGuard', () => {
  describe('assertValidSyncTransition', () => {
    it('allows Idle → Syncing', () => {
      expect(() => assertValidSyncTransition(TemplateSyncStatus.Idle, TemplateSyncStatus.Syncing)).not.toThrow();
    });

    it('allows Syncing → Success', () => {
      expect(() => assertValidSyncTransition(TemplateSyncStatus.Syncing, TemplateSyncStatus.Success)).not.toThrow();
    });

    it('allows Syncing → Failed', () => {
      expect(() => assertValidSyncTransition(TemplateSyncStatus.Syncing, TemplateSyncStatus.Failed)).not.toThrow();
    });

    it('allows Failed → Syncing (retry)', () => {
      expect(() => assertValidSyncTransition(TemplateSyncStatus.Failed, TemplateSyncStatus.Syncing)).not.toThrow();
    });

    it('rejects Idle → Success', () => {
      expect(() => assertValidSyncTransition(TemplateSyncStatus.Idle, TemplateSyncStatus.Success)).toThrow(TemplateSyncTransitionError);
    });

    it('rejects Idle → Failed', () => {
      expect(() => assertValidSyncTransition(TemplateSyncStatus.Idle, TemplateSyncStatus.Failed)).toThrow(TemplateSyncTransitionError);
    });
  });

  describe('sync lock', () => {
    beforeEach(() => {
      resetSyncLocks();
    });

    it('acquire succeeds on first call', () => {
      expect(() => acquireSyncLock('tpl-1')).not.toThrow();
    });

    it('concurrent acquire throws', () => {
      acquireSyncLock('tpl-1');
      expect(() => acquireSyncLock('tpl-1')).toThrow(TemplateSyncLockError);
    });

    it('release allows re-acquire', () => {
      acquireSyncLock('tpl-1');
      releaseSyncLock('tpl-1');
      expect(() => acquireSyncLock('tpl-1')).not.toThrow();
    });
  });

  describe('validateTemplateContent', () => {
    it('rejects non-SharePoint TemplateSiteUrl', () => {
      const violations = validateTemplateContent({
        TemplateSiteUrl: 'https://evil.com/site',
      });
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]).toContain('SharePoint');
    });

    it('rejects script tag in Description', () => {
      const violations = validateTemplateContent({
        Description: 'Good template <script>alert(1)</script>',
        TemplateSiteUrl: 'https://contoso.sharepoint.com/sites/tpl',
        GitRepoUrl: 'https://github.com/org/repo',
      });
      expect(violations.some(v => v.includes('dangerous'))).toBe(true);
    });

    it('rejects non-HTTPS GitRepoUrl', () => {
      const violations = validateTemplateContent({
        GitRepoUrl: 'http://github.com/org/repo',
        TemplateSiteUrl: 'https://contoso.sharepoint.com/sites/tpl',
      });
      expect(violations.some(v => v.includes('HTTPS'))).toBe(true);
    });

    it('passes valid template', () => {
      const violations = validateTemplateContent({
        TemplateSiteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/template-default',
        GitRepoUrl: 'https://github.com/hedrick/templates',
        Description: 'Standard project template for commercial builds',
      });
      expect(violations).toHaveLength(0);
    });
  });

  describe('assertSyncApproved (multi-approver gate)', () => {
    const approval1: ISyncApproval = {
      approverEmail: 'admin@hbc.com',
      approvedAt: new Date().toISOString(),
      role: 'Admin',
    };
    const approval2: ISyncApproval = {
      approverEmail: 'security@hbc.com',
      approvedAt: new Date().toISOString(),
      role: 'SecurityOfficer',
    };

    it('passes with 2 unique approvals', () => {
      expect(() => assertSyncApproved([approval1, approval2])).not.toThrow();
    });

    it('throws with only 1 approval', () => {
      expect(() => assertSyncApproved([approval1])).toThrow(InsufficientApprovalsError);
    });

    it('throws with 0 approvals', () => {
      expect(() => assertSyncApproved([])).toThrow(InsufficientApprovalsError);
    });

    it('deduplicates same approver email', () => {
      const duplicate: ISyncApproval = {
        approverEmail: 'admin@hbc.com',
        approvedAt: new Date().toISOString(),
        role: 'SuperAdmin',
      };
      expect(() => assertSyncApproved([approval1, duplicate])).toThrow(InsufficientApprovalsError);
    });
  });
});
