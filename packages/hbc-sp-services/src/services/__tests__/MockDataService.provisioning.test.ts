/**
 * MockDataService — Provisioning operation method tests.
 * Validates that all 8 provisioning methods on MockDataService
 * resolve with expected shapes and accept correct parameters.
 */
import { MockDataService } from '../MockDataService';
import { IFieldDefinition } from '../../models/IProvisioningLog';

describe('MockDataService provisioning operations', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  it('createProjectSite returns object with siteUrl matching alias', async () => {
    const result = await ds.createProjectSite('25-042-01', 'Test Project', '2504201');
    expect(result).toHaveProperty('siteUrl');
    expect(result.siteUrl).toContain('2504201');
    expect(result.siteUrl).toMatch(/^https:\/\//);
  });

  it('provisionProjectLists resolves without error', async () => {
    await expect(
      ds.provisionProjectLists('https://test.sharepoint.com/sites/2504201', '25-042-01')
    ).resolves.toBeUndefined();
  });

  it('associateWithHubSite resolves without error', async () => {
    await expect(
      ds.associateWithHubSite(
        'https://test.sharepoint.com/sites/2504201',
        'https://hub.sharepoint.com'
      )
    ).resolves.toBeUndefined();
  });

  it('createProjectSecurityGroups resolves without error', async () => {
    await expect(
      ds.createProjectSecurityGroups(
        'https://test.sharepoint.com/sites/2504201',
        '25-042-01',
        'Commercial'
      )
    ).resolves.toBeUndefined();
  });

  it('copyTemplateFiles resolves without error', async () => {
    await expect(
      ds.copyTemplateFiles(
        'https://test.sharepoint.com/sites/2504201',
        '25-042-01',
        'Commercial'
      )
    ).resolves.toBeUndefined();
  });

  it('copyLeadDataToProjectSite resolves without error', async () => {
    await expect(
      ds.copyLeadDataToProjectSite(
        'https://test.sharepoint.com/sites/2504201',
        1,
        '25-042-01'
      )
    ).resolves.toBeUndefined();
  });

  it('updateSiteProperties resolves without error', async () => {
    await expect(
      ds.updateSiteProperties(
        'https://test.sharepoint.com/sites/2504201',
        { Title: 'Updated Title' }
      )
    ).resolves.toBeUndefined();
  });

  it('createList resolves without error', async () => {
    const fields: IFieldDefinition[] = [
      { internalName: 'TestField', displayName: 'Test Field', fieldType: 'Text' },
    ];
    await expect(
      ds.createList(
        'https://test.sharepoint.com/sites/2504201',
        'Test_List',
        100,
        fields
      )
    ).resolves.toBeUndefined();
  });
});
