/**
 * GitOpsProvisioningService — unit tests.
 * Validates applyTemplates orchestration, audit fire-and-forget behaviour,
 * and error resilience when logAudit rejects.
 */
import { GitOpsProvisioningService } from '../GitOpsProvisioningService';
import { IDataService } from '../IDataService';
import { AuditAction, EntityType } from '../../models/enums';
import { ITemplateRegistry } from '../../models/ITemplateManifest';

// ── Fixture helpers ───────────────────────────────────────────────────────────

function createMockRegistry(overrides?: Partial<ITemplateRegistry>): ITemplateRegistry {
  return {
    version: '1.0.0',
    lastModified: '2026-01-15T10:00:00Z',
    lastModifiedBy: 'test@hedrickbrothers.com',
    templates: [
      {
        id: 'tpl-001',
        templateName: 'Standard Project Charter',
        sourcePath: 'Templates/Commercial/ProjectCharter.docx',
        targetFolder: 'Project Documents',
        fileName: 'ProjectCharter.docx',
        division: 'Commercial',
        active: true,
        fileHash: 'sha256:abc123',
        fileSize: 24576,
        lastModifiedInTemplateSite: '2026-01-15T10:00:00Z',
      },
    ],
    ...overrides,
  };
}

function createMockDataService(): Record<string, jest.Mock> {
  const registry = createMockRegistry();
  return {
    getCommittedTemplateRegistry: jest.fn().mockResolvedValue(registry),
    applyGitOpsTemplates: jest.fn().mockResolvedValue({ appliedCount: 1 }),
    logAudit: jest.fn().mockResolvedValue(undefined),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GitOpsProvisioningService', () => {
  describe('applyTemplates', () => {
    it('calls getCommittedTemplateRegistry and applyGitOpsTemplates with correct args', async () => {
      const mockDs = createMockDataService();
      const svc = new GitOpsProvisioningService(mockDs as unknown as IDataService);
      const registry = createMockRegistry();
      mockDs.getCommittedTemplateRegistry.mockResolvedValue(registry);

      await svc.applyTemplates('https://test.sharepoint.com/sites/25042', 'Commercial');

      expect(mockDs.getCommittedTemplateRegistry).toHaveBeenCalledTimes(1);
      expect(mockDs.applyGitOpsTemplates).toHaveBeenCalledTimes(1);
      expect(mockDs.applyGitOpsTemplates).toHaveBeenCalledWith(
        'https://test.sharepoint.com/sites/25042',
        'Commercial',
        registry
      );
    });

    it('passes siteUrl and division to applyGitOpsTemplates', async () => {
      const mockDs = createMockDataService();
      const svc = new GitOpsProvisioningService(mockDs as unknown as IDataService);

      await svc.applyTemplates('https://hedrickbrotherscom.sharepoint.com/sites/2504201', 'Luxury Residential');

      expect(mockDs.applyGitOpsTemplates).toHaveBeenCalledWith(
        'https://hedrickbrotherscom.sharepoint.com/sites/2504201',
        'Luxury Residential',
        expect.any(Object)
      );
    });

    it('returns appliedCount from applyGitOpsTemplates', async () => {
      const mockDs = createMockDataService();
      mockDs.applyGitOpsTemplates.mockResolvedValue({ appliedCount: 5 });
      const svc = new GitOpsProvisioningService(mockDs as unknown as IDataService);

      const result = await svc.applyTemplates('https://test.sharepoint.com/sites/2504201', 'Commercial');

      expect(result).toEqual({ appliedCount: 5 });
    });

    it('fires logAudit with TemplateAppliedFromGitOps action (fire-and-forget)', async () => {
      const mockDs = createMockDataService();
      const svc = new GitOpsProvisioningService(mockDs as unknown as IDataService);

      await svc.applyTemplates('https://test.sharepoint.com/sites/2504201', 'Commercial');

      // Allow microtasks and macrotasks to settle (fire-and-forget — .catch() chain)
      await new Promise(resolve => setImmediate(resolve));

      expect(mockDs.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.TemplateAppliedFromGitOps,
          EntityType: EntityType.TemplateRegistry,
          EntityId: 'https://test.sharepoint.com/sites/2504201',
          User: 'system',
        })
      );
    });

    it('logAudit failure does not throw', async () => {
      const mockDs = createMockDataService();
      mockDs.logAudit.mockRejectedValue(new Error('Audit service unavailable'));
      const svc = new GitOpsProvisioningService(mockDs as unknown as IDataService);

      // Should not throw even when logAudit rejects
      await expect(
        svc.applyTemplates('https://test.sharepoint.com/sites/2504201', 'Commercial')
      ).resolves.toEqual({ appliedCount: 1 });

      // Allow the fire-and-forget rejection to be swallowed
      await Promise.resolve();
    });
  });
});
