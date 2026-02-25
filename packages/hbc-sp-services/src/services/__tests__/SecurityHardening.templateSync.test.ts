import { MockDataService } from '../MockDataService';
import { TemplateSyncStatus } from '../../models/enums';
import { FeatureFlagViolationError } from '../../utils/featureFlagGuard';
import { TemplateContentValidationError } from '../../utils/templateSyncGuard';
import { resetSyncLocks } from '../../utils/templateSyncGuard';
import type { ISiteTemplate } from '../../models/ISiteTemplate';

describe('SecurityHardening: Template Sync', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
    resetSyncLocks();
  });

  describe('syncTemplateToGitOps', () => {
    it('throws FeatureFlagViolationError when SiteTemplateManagement flag is OFF', async () => {
      // Disable the flag
      const flags = await ds.getFeatureFlags();
      const flag = flags.find(f => f.FeatureName === 'SiteTemplateManagement');
      if (flag) {
        await ds.updateFeatureFlag(flag.id, { Enabled: false });
      }
      const templates = await ds.getSiteTemplates();
      if (templates.length > 0) {
        await expect(ds.syncTemplateToGitOps(templates[0].id)).rejects.toThrow(FeatureFlagViolationError);
      }
    });

    it('succeeds when SiteTemplateManagement flag is ON', async () => {
      // Enable the flag
      const flags = await ds.getFeatureFlags();
      const flag = flags.find(f => f.FeatureName === 'SiteTemplateManagement');
      if (flag) {
        await ds.updateFeatureFlag(flag.id, { Enabled: true });
      }
      const templates = await ds.getSiteTemplates();
      if (templates.length > 0) {
        const result = await ds.syncTemplateToGitOps(templates[0].id);
        expect(result.success).toBe(true);
        expect(result.prUrl).toBeDefined();
      }
    });

    it('concurrent sync blocks second call (lock or transition guard)', async () => {
      // Enable the flag
      const flags = await ds.getFeatureFlags();
      const flag = flags.find(f => f.FeatureName === 'SiteTemplateManagement');
      if (flag) await ds.updateFeatureFlag(flag.id, { Enabled: true });

      const templates = await ds.getSiteTemplates();
      if (templates.length >= 1) {
        // Start first sync but don't await
        const first = ds.syncTemplateToGitOps(templates[0].id);
        // Second call should fail — either the sync lock blocks it or
        // the transition guard rejects Syncing→Syncing (both prevent concurrent syncs)
        await expect(ds.syncTemplateToGitOps(templates[0].id)).rejects.toThrow();
        await first; // Clean up
      }
    });
  });

  describe('createSiteTemplate', () => {
    it('rejects <script> in Description', async () => {
      const flags = await ds.getFeatureFlags();
      const flag = flags.find(f => f.FeatureName === 'SiteTemplateManagement');
      if (flag) await ds.updateFeatureFlag(flag.id, { Enabled: true });

      const data: Omit<ISiteTemplate, 'id'> = {
        Title: 'Default',
        TemplateSiteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/tpl',
        ProjectTypeId: null,
        GitRepoUrl: 'https://github.com/org/repo',
        LastSynced: null,
        SyncStatus: TemplateSyncStatus.Idle,
        IsActive: true,
        Description: 'Test <script>alert(1)</script>',
      };
      await expect(ds.createSiteTemplate(data)).rejects.toThrow(TemplateContentValidationError);
    });

    it('rejects non-SharePoint TemplateSiteUrl', async () => {
      const flags = await ds.getFeatureFlags();
      const flag = flags.find(f => f.FeatureName === 'SiteTemplateManagement');
      if (flag) await ds.updateFeatureFlag(flag.id, { Enabled: true });

      const data: Omit<ISiteTemplate, 'id'> = {
        Title: 'Default',
        TemplateSiteUrl: 'https://evil.com/templates',
        ProjectTypeId: null,
        GitRepoUrl: 'https://github.com/org/repo',
        LastSynced: null,
        SyncStatus: TemplateSyncStatus.Idle,
        IsActive: true,
      };
      await expect(ds.createSiteTemplate(data)).rejects.toThrow(TemplateContentValidationError);
    });
  });

  describe('updateSiteTemplate', () => {
    it('rejects non-HTTPS GitRepoUrl', async () => {
      const flags = await ds.getFeatureFlags();
      const flag = flags.find(f => f.FeatureName === 'SiteTemplateManagement');
      if (flag) await ds.updateFeatureFlag(flag.id, { Enabled: true });

      const templates = await ds.getSiteTemplates();
      if (templates.length > 0) {
        await expect(ds.updateSiteTemplate(templates[0].id, {
          GitRepoUrl: 'http://insecure.com/repo',
        })).rejects.toThrow(TemplateContentValidationError);
      }
    });
  });
});
