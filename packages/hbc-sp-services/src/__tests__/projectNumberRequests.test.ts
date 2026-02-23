/**
 * Project Number Requests — Phase 4E Tests
 *
 * Tests the expanded IJobNumberRequest model, new MockDataService methods,
 * TYPICAL and ALTERNATE workflows, and backward compatibility.
 */
import { MockDataService } from '../services/MockDataService';
import { JobNumberRequestStatus } from '../models/IJobNumberRequest';

describe('Project Number Requests (Phase 4E)', () => {
  let dataService: MockDataService;

  beforeEach(() => {
    dataService = new MockDataService();
  });

  // ── Feature Flag ──────────────────────────────────────────────────

  it('should have ProjectNumberRequestsModule feature flag enabled', async () => {
    const flags = await dataService.getFeatureFlags();
    const flag = flags.find(f => f.FeatureName === 'ProjectNumberRequestsModule');
    expect(flag).toBeDefined();
    expect(flag?.Enabled).toBe(true);
  });

  // ── Fixture Data ──────────────────────────────────────────────────

  it('should load fixture data with new Phase 4E fields', async () => {
    const requests = await dataService.getJobNumberRequests();
    expect(requests.length).toBeGreaterThanOrEqual(5);

    // Check first request has new fields
    const req = requests.find(r => r.id === 1);
    expect(req).toBeDefined();
    expect(req?.ProjectName).toBe('Okeechobee Office Tower');
    expect(req?.StreetAddress).toBe('1500 Okeechobee Blvd');
    expect(req?.CityState).toBe('West Palm Beach, FL');
    expect(req?.ZipCode).toBe('33401');
    expect(req?.County).toBe('Palm Beach');
    expect(req?.OfficeDivision).toBe('01-43');
    expect(req?.WorkflowType).toBe('typical');
    expect(req?.BallInCourt).toBe('Heather Thomas');
    expect(req?.SubmittedBy).toBe('John Smith');
  });

  it('should have PendingController fixture record', async () => {
    const requests = await dataService.getJobNumberRequests();
    const pending = requests.find(r => r.RequestStatus === JobNumberRequestStatus.PendingController);
    expect(pending).toBeDefined();
    expect(pending?.ProjectName).toBe('Boynton Beach Country Club Expansion');
    expect(pending?.BallInCourt).toBe('Heather Thomas');
  });

  it('should have PendingProvisioning fixture record with TempProjectCode', async () => {
    const requests = await dataService.getJobNumberRequests();
    const provisioning = requests.find(r => r.RequestStatus === JobNumberRequestStatus.PendingProvisioning);
    expect(provisioning).toBeDefined();
    expect(provisioning?.TempProjectCode).toBe('26-999-01');
    expect(provisioning?.WorkflowType).toBe('alternate');
    expect(provisioning?.BallInCourt).toBe('System');
  });

  // ── getJobNumberRequestById ───────────────────────────────────────

  it('should get request by ID', async () => {
    const request = await dataService.getJobNumberRequestById(1);
    expect(request).toBeDefined();
    expect(request?.id).toBe(1);
    expect(request?.ProjectName).toBe('Okeechobee Office Tower');
  });

  it('should return null for non-existent request ID', async () => {
    const request = await dataService.getJobNumberRequestById(9999);
    expect(request).toBeNull();
  });

  // ── submitProjectNumberRequest — TYPICAL ──────────────────────────

  it('should submit typical workflow request', async () => {
    const result = await dataService.submitProjectNumberRequest({
      Email: 'test@hedrickbrothers.com',
      ProjectName: 'Test Project Typical',
      StreetAddress: '123 Main St',
      CityState: 'Miami, FL',
      ZipCode: '33101',
      County: 'Miami-Dade',
      ProjectExecutive: 'Bobby Fetting',
      OfficeDivision: '01-43',
      OfficeDivisionLabel: 'HB HQ General Commercial (01-43)',
      Originator: 'test@hedrickbrothers.com',
      SubmittedBy: 'Test User',
    }, 'typical');

    expect(result.id).toBeDefined();
    expect(result.RequestStatus).toBe(JobNumberRequestStatus.PendingController);
    expect(result.BallInCourt).toBe('Heather Thomas');
    expect(result.WorkflowType).toBe('typical');
    expect(result.SiteProvisioningHeld).toBe(true);
    expect(result.TempProjectCode).toBeUndefined();
    expect(result.ProjectName).toBe('Test Project Typical');
  });

  // ── submitProjectNumberRequest — ALTERNATE ────────────────────────

  it('should submit alternate workflow request with placeholder number', async () => {
    const result = await dataService.submitProjectNumberRequest({
      Email: 'test@hedrickbrothers.com',
      ProjectName: 'Test Project Alternate',
      StreetAddress: '456 Ocean Dr',
      CityState: 'Fort Lauderdale, FL',
      ZipCode: '33301',
      County: 'Broward',
      ProjectExecutive: 'Joe Keating',
      OfficeDivision: '01-53',
      OfficeDivisionLabel: 'South General Commercial (01-53)',
      Originator: 'test@hedrickbrothers.com',
      SubmittedBy: 'Test User',
    }, 'alternate');

    expect(result.id).toBeDefined();
    expect(result.RequestStatus).toBe(JobNumberRequestStatus.PendingProvisioning);
    expect(result.BallInCourt).toBe('System');
    expect(result.WorkflowType).toBe('alternate');
    expect(result.SiteProvisioningHeld).toBe(false);
    expect(result.TempProjectCode).toMatch(/^\d{2}-999-01$/);
    expect(result.ProvisioningTriggeredAt).toBeDefined();
    expect(result.SiteUrl).toBeDefined();
  });

  // ── updateJobNumberRequest ────────────────────────────────────────

  it('should update request and detect number assignment', async () => {
    // First submit a typical request
    const submitted = await dataService.submitProjectNumberRequest({
      Email: 'test@hedrickbrothers.com',
      ProjectName: 'Update Test',
      StreetAddress: '789 Palm Ave',
      CityState: 'Boca Raton, FL',
      ZipCode: '33432',
      County: 'Palm Beach',
      ProjectExecutive: 'Dale Hedrick',
      OfficeDivision: '01-10',
      OfficeDivisionLabel: 'Luxury Residential (01-10)',
      Originator: 'test@hedrickbrothers.com',
      SubmittedBy: 'Test User',
    }, 'typical');

    expect(submitted.RequestStatus).toBe(JobNumberRequestStatus.PendingController);

    // Controller assigns number
    const updated = await dataService.updateJobNumberRequest(submitted.id, {
      AssignedJobNumber: '26-100-01',
      AssignedBy: 'hthomas@hedrickbrothers.com',
    });

    expect(updated.AssignedJobNumber).toBe('26-100-01');
    expect(updated.RequestStatus).toBe(JobNumberRequestStatus.PendingProvisioning);
    expect(updated.BallInCourt).toBe('System');
    expect(updated.AssignedDate).toBeDefined();
  });

  // ── triggerProjectNumberProvisioning ──────────────────────────────

  it('should trigger provisioning and set Completed status', async () => {
    const submitted = await dataService.submitProjectNumberRequest({
      Email: 'test@hedrickbrothers.com',
      ProjectName: 'Provisioning Test',
      StreetAddress: '321 Flagler Dr',
      CityState: 'West Palm Beach, FL',
      ZipCode: '33401',
      County: 'Palm Beach',
      ProjectExecutive: 'Gene Parker',
      OfficeDivision: '01-43',
      OfficeDivisionLabel: 'HB HQ General Commercial (01-43)',
      Originator: 'test@hedrickbrothers.com',
      SubmittedBy: 'Test User',
    }, 'typical');

    // Assign number first
    await dataService.updateJobNumberRequest(submitted.id, {
      AssignedJobNumber: '26-200-01',
      AssignedBy: 'hthomas@hedrickbrothers.com',
    });

    // Trigger provisioning
    const provisioned = await dataService.triggerProjectNumberProvisioning(submitted.id);

    expect(provisioned.RequestStatus).toBe(JobNumberRequestStatus.Completed);
    expect(provisioned.ProvisioningTriggeredAt).toBeDefined();
    expect(provisioned.SiteUrl).toContain('26-200-01');
    expect(provisioned.BallInCourt).toBeUndefined();
  });

  // ── Backward Compatibility ────────────────────────────────────────

  it('should preserve existing getJobNumberRequests filtering', async () => {
    const all = await dataService.getJobNumberRequests();
    expect(all.length).toBeGreaterThanOrEqual(3);

    const completed = await dataService.getJobNumberRequests(JobNumberRequestStatus.Completed);
    completed.forEach(r => {
      expect(r.RequestStatus).toBe(JobNumberRequestStatus.Completed);
    });
  });

  it('should preserve existing createJobNumberRequest', async () => {
    const created = await dataService.createJobNumberRequest({
      LeadID: 99,
      Originator: 'compat@test.com',
      ProjectExecutive: 'Test PX',
      ProjectType: '01-43',
      ProjectTypeLabel: 'Test Type',
    });

    expect(created.id).toBeDefined();
    expect(created.RequestStatus).toBe(JobNumberRequestStatus.Pending);
    expect(created.LeadID).toBe(99);
  });

  it('should preserve existing finalizeJobNumber', async () => {
    const created = await dataService.createJobNumberRequest({
      LeadID: 98,
      Originator: 'compat@test.com',
      ProjectExecutive: 'Test PX',
    });

    const finalized = await dataService.finalizeJobNumber(created.id, '26-098-01', 'admin@test.com');
    expect(finalized.RequestStatus).toBe(JobNumberRequestStatus.Completed);
    expect(finalized.AssignedJobNumber).toBe('26-098-01');
    expect(finalized.AssignedBy).toBe('admin@test.com');
  });
});
