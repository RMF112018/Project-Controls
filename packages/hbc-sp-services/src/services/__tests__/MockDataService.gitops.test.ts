/**
 * MockDataService — GitOps method contract tests.
 * Uses the real MockDataService (not mocked) and asserts each GitOps method
 * returns the expected shape. Follows the pattern from MockDataService.provisioning.test.ts.
 */
import { MockDataService } from '../MockDataService';
import { ITemplateRegistry } from '../../models/ITemplateManifest';

describe('MockDataService — GitOps methods', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  it('getTemplateSiteConfig returns ITemplateSiteConfig shape or null', async () => {
    const result = await ds.getTemplateSiteConfig();
    // May be null if no mock data configured, or an object with the expected shape
    if (result !== null) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('templateSiteUrl');
      expect(result).toHaveProperty('lastSnapshotHash');
      expect(result).toHaveProperty('lastSnapshotDate');
      expect(result).toHaveProperty('githubRepoOwner');
      expect(result).toHaveProperty('githubRepoName');
      expect(result).toHaveProperty('githubBranch');
      expect(typeof result.active).toBe('boolean');
    }
  });

  it('updateTemplateSiteConfig returns merged ITemplateSiteConfig', async () => {
    const patch = { githubBranch: 'feature/test-branch' };
    const result = await ds.updateTemplateSiteConfig(patch);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('templateSiteUrl');
    expect(result.githubBranch).toBe('feature/test-branch');
  });

  it('getCommittedTemplateRegistry returns ITemplateRegistry with templates array', async () => {
    const result = await ds.getCommittedTemplateRegistry();

    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('lastModified');
    expect(result).toHaveProperty('lastModifiedBy');
    expect(Array.isArray(result.templates)).toBe(true);

    // Each template should have the required ITemplateEntry shape
    if (result.templates.length > 0) {
      const tpl = result.templates[0];
      expect(tpl).toHaveProperty('id');
      expect(tpl).toHaveProperty('templateName');
      expect(tpl).toHaveProperty('sourcePath');
      expect(tpl).toHaveProperty('targetFolder');
      expect(tpl).toHaveProperty('fileName');
      expect(tpl).toHaveProperty('division');
      expect(typeof tpl.active).toBe('boolean');
      expect(tpl).toHaveProperty('fileHash');
      expect(typeof tpl.fileSize).toBe('number');
      expect(tpl).toHaveProperty('lastModifiedInTemplateSite');
    }
  });

  it('getTemplateSiteFiles returns array of ITemplateFileMetadata', async () => {
    const result = await ds.getTemplateSiteFiles();

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      const file = result[0];
      expect(file).toHaveProperty('sourcePath');
      expect(file).toHaveProperty('fileName');
      expect(file).toHaveProperty('fileHash');
      expect(typeof file.fileSize).toBe('number');
      expect(file).toHaveProperty('lastModified');
      expect(file).toHaveProperty('division');
    }
  });

  it('applyGitOpsTemplates returns { appliedCount: number }', async () => {
    const registry: ITemplateRegistry = {
      version: '1.0.0',
      lastModified: '2026-01-15T10:00:00Z',
      lastModifiedBy: 'test@hedrickbrothers.com',
      templates: [
        {
          id: 'tpl-001',
          templateName: 'Test Template',
          sourcePath: 'Templates/Commercial/Test.docx',
          targetFolder: 'Project Documents',
          fileName: 'Test.docx',
          division: 'Commercial',
          active: true,
          fileHash: 'sha256:aabbcc',
          fileSize: 10240,
          lastModifiedInTemplateSite: '2026-01-15T10:00:00Z',
        },
        {
          id: 'tpl-002',
          templateName: 'Inactive Template',
          sourcePath: 'Templates/Shared/Inactive.docx',
          targetFolder: 'Project Documents',
          fileName: 'Inactive.docx',
          division: 'Both',
          active: false,
          fileHash: 'sha256:ddeeff',
          fileSize: 8192,
          lastModifiedInTemplateSite: '2026-01-10T08:00:00Z',
        },
      ],
    };

    const result = await ds.applyGitOpsTemplates(
      'https://test.sharepoint.com/sites/2504201',
      'Commercial',
      registry
    );

    expect(result).toHaveProperty('appliedCount');
    expect(typeof result.appliedCount).toBe('number');
    // Only active + (division=Commercial OR division=Both) entries count
    // tpl-001 is active + Commercial → counts; tpl-002 is inactive → does not count
    expect(result.appliedCount).toBe(1);
  });

  it('logTemplateSyncPR returns ITemplateManifestLog with id', async () => {
    const entry = {
      syncDate: '2026-02-18T12:00:00Z',
      triggeredBy: 'admin@hedrickbrothers.com',
      diffSummary: { added: 2, modified: 1, removed: 0 },
      prNumber: 42,
      prUrl: 'https://github.com/hedrickbrothers/templates/pull/42',
      status: 'Pending' as const,
    };

    const result = await ds.logTemplateSyncPR(entry);

    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('number');
    expect(result.syncDate).toBe(entry.syncDate);
    expect(result.triggeredBy).toBe(entry.triggeredBy);
    expect(result.diffSummary).toEqual(entry.diffSummary);
    expect(result.prNumber).toBe(42);
    expect(result.status).toBe('Pending');
  });
});
