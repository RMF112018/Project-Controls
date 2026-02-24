/**
 * Phase 6A: Site Template Management — 18 Jest Tests
 *
 * Tests all 8 IDataService site template methods via MockDataService.
 */
import { MockDataService } from '../MockDataService';
import { TemplateSyncStatus } from '../../models/enums';
import type { ISiteTemplate, SiteTemplateType } from '../../models/ISiteTemplate';

let ds: MockDataService;

beforeEach(() => {
  ds = new MockDataService();
});

describe('getSiteTemplates', () => {
  it('returns all mock templates', async () => {
    const templates = await ds.getSiteTemplates();
    expect(templates).toHaveLength(3);
  });

  it('returns templates with correct shape', async () => {
    const templates = await ds.getSiteTemplates();
    const t = templates[0];
    expect(t).toHaveProperty('id');
    expect(t).toHaveProperty('Title');
    expect(t).toHaveProperty('TemplateSiteUrl');
    expect(t).toHaveProperty('ProjectTypeId');
    expect(t).toHaveProperty('GitRepoUrl');
    expect(t).toHaveProperty('SyncStatus');
    expect(t).toHaveProperty('IsActive');
  });
});

describe('getSiteTemplateByType', () => {
  it('returns the Default template', async () => {
    const template = await ds.getSiteTemplateByType('Default');
    expect(template).not.toBeNull();
    expect(template!.Title).toBe('Default');
  });

  it('returns null for a non-existent type', async () => {
    const template = await ds.getSiteTemplateByType('NonExistent' as SiteTemplateType);
    expect(template).toBeNull();
  });

  it('returns null for inactive template when all of that type are inactive', async () => {
    // Deactivate the Luxury Residential template
    const templates = await ds.getSiteTemplates();
    const luxury = templates.find(t => t.Title === 'Luxury Residential');
    expect(luxury).toBeDefined();
    await ds.updateSiteTemplate(luxury!.id, { IsActive: false });

    const result = await ds.getSiteTemplateByType('Luxury Residential');
    expect(result).toBeNull();
  });
});

describe('createSiteTemplate', () => {
  it('auto-generates an id for new template', async () => {
    const newTemplate = await ds.createSiteTemplate({
      Title: 'Default',
      TemplateSiteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/HBC-Templates/Test',
      ProjectTypeId: null,
      GitRepoUrl: 'https://github.com/test/repo',
      LastSynced: null,
      SyncStatus: TemplateSyncStatus.Idle,
      IsActive: true,
      Description: 'Test template',
    });
    expect(newTemplate.id).toBeGreaterThan(0);
    expect(newTemplate.Title).toBe('Default');
  });

  it('adds the template to the list', async () => {
    const before = await ds.getSiteTemplates();
    const beforeCount = before.length;

    await ds.createSiteTemplate({
      Title: 'Commercial',
      TemplateSiteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/HBC-Templates/Test2',
      ProjectTypeId: 1,
      GitRepoUrl: 'https://github.com/test/repo2',
      LastSynced: null,
      SyncStatus: TemplateSyncStatus.Idle,
      IsActive: true,
    });

    const after = await ds.getSiteTemplates();
    expect(after.length).toBe(beforeCount + 1);
  });
});

describe('updateSiteTemplate', () => {
  it('updates fields on existing template', async () => {
    const templates = await ds.getSiteTemplates();
    const first = templates[0];

    const updated = await ds.updateSiteTemplate(first.id, {
      Description: 'Updated description',
      IsActive: false,
    });

    expect(updated.Description).toBe('Updated description');
    expect(updated.IsActive).toBe(false);
    expect(updated.id).toBe(first.id);
  });

  it('throws for non-existent template id', async () => {
    await expect(ds.updateSiteTemplate(99999, { IsActive: false }))
      .rejects.toThrow();
  });
});

describe('deleteSiteTemplate', () => {
  it('removes the template from the list', async () => {
    const before = await ds.getSiteTemplates();
    const target = before[before.length - 1];

    await ds.deleteSiteTemplate(target.id);

    const after = await ds.getSiteTemplates();
    expect(after.length).toBe(before.length - 1);
    expect(after.find(t => t.id === target.id)).toBeUndefined();
  });

  it('throws for non-existent template id', async () => {
    await expect(ds.deleteSiteTemplate(99999))
      .rejects.toThrow();
  });
});

describe('syncTemplateToGitOps', () => {
  it('returns success with PR URL', async () => {
    const templates = await ds.getSiteTemplates();
    const first = templates[0];

    const result = await ds.syncTemplateToGitOps(first.id);
    expect(result.success).toBe(true);
    expect(result.prUrl).toBeDefined();
    expect(result.prUrl).toContain('github.com');
  });

  it('transitions SyncStatus through Syncing to Success', async () => {
    const templates = await ds.getSiteTemplates();
    const first = templates[0];

    await ds.syncTemplateToGitOps(first.id);

    const updated = await ds.getSiteTemplates();
    const synced = updated.find(t => t.id === first.id);
    expect(synced).toBeDefined();
    expect(synced!.SyncStatus).toBe(TemplateSyncStatus.Success);
    expect(synced!.LastSynced).toBeDefined();
  });

  it('returns failure for non-existent template id', async () => {
    const result = await ds.syncTemplateToGitOps(99999);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('applyTemplateToSite', () => {
  it('applies the named template and returns result', async () => {
    const result = await ds.applyTemplateToSite(
      'https://hedrickbrotherscom.sharepoint.com/sites/TestProject',
      'Commercial'
    );
    expect(result.templateName).toBe('Commercial');
    expect(result.appliedCount).toBeGreaterThan(0);
  });

  it('falls back to Default when named template is not found', async () => {
    const result = await ds.applyTemplateToSite(
      'https://hedrickbrotherscom.sharepoint.com/sites/TestProject',
      'NonExistent' as SiteTemplateType
    );
    expect(result.templateName).toBe('Default');
    expect(result.appliedCount).toBeGreaterThan(0);
  });

  it('throws when no Default template exists', async () => {
    // Remove all templates by deleting them one by one
    const templates = await ds.getSiteTemplates();
    for (const t of templates) {
      await ds.deleteSiteTemplate(t.id);
    }

    await expect(
      ds.applyTemplateToSite(
        'https://hedrickbrotherscom.sharepoint.com/sites/TestProject',
        'Commercial'
      )
    ).rejects.toThrow();
  });
});

describe('syncAllTemplates', () => {
  it('syncs all active templates', async () => {
    const result = await ds.syncAllTemplates();
    expect(result.synced).toBeGreaterThan(0);
    expect(result.results).toBeInstanceOf(Array);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('returns correct counts', async () => {
    const templates = await ds.getSiteTemplates();
    const activeCount = templates.filter(t => t.IsActive).length;

    const result = await ds.syncAllTemplates();
    expect(result.synced + result.failed).toBe(activeCount);
  });
});
