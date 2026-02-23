/**
 * Department Tracking Module — Data Layer Tests
 *
 * Validates: feature flag, getEstimateLog, getCurrentPursuits,
 * getPreconEngagements, updateEstimatingRecord, createEstimatingRecord.
 */
import { MockDataService } from '../services/MockDataService';
import type { IEstimatingTracker } from '../models/IEstimatingTracker';

describe('Department Tracking (Estimating)', () => {
  let dataService: MockDataService;

  beforeEach(() => {
    dataService = new MockDataService();
  });

  // ── Feature Flag ────────────────────────────────────────────────

  it('should have EstimatingDepartmentTracking feature flag enabled', async () => {
    const flags = await dataService.getFeatureFlags();
    const flag = flags.find(f => f.FeatureName === 'EstimatingDepartmentTracking');
    expect(flag).toBeDefined();
    expect(flag?.Enabled).toBe(true);
  });

  // ── Tab 1: Estimate Tracking Log ────────────────────────────────

  describe('getEstimateLog', () => {
    it('should return records that have a SubmittedDate', async () => {
      const log = await dataService.getEstimateLog();
      expect(log.length).toBeGreaterThan(0);
      for (const record of log) {
        expect(record.SubmittedDate).toBeDefined();
        expect(record.SubmittedDate).not.toBeNull();
      }
    });

    it('should include required fields for estimate log columns', async () => {
      const log = await dataService.getEstimateLog();
      const first = log[0];
      expect(first).toHaveProperty('ProjectCode');
      expect(first).toHaveProperty('Title');
      expect(first).toHaveProperty('LeadEstimator');
      expect(first).toHaveProperty('CostPerGSF');
    });
  });

  // ── Tab 2: Current Pursuits ─────────────────────────────────────

  describe('getCurrentPursuits', () => {
    it('should return records without SubmittedDate and with Pending or no AwardStatus', async () => {
      const pursuits = await dataService.getCurrentPursuits();
      expect(pursuits.length).toBeGreaterThan(0);
      for (const record of pursuits) {
        expect(record.SubmittedDate).toBeFalsy();
        expect(
          !record.AwardStatus || record.AwardStatus === 'Pending'
        ).toBe(true);
      }
    });

    it('should include checklist boolean fields', async () => {
      const pursuits = await dataService.getCurrentPursuits();
      const first = pursuits[0];
      expect(first).toHaveProperty('Chk_BidBond');
      expect(first).toHaveProperty('Chk_PPBond');
      expect(first).toHaveProperty('Chk_Schedule');
      expect(first).toHaveProperty('Chk_Logistics');
      expect(first).toHaveProperty('Chk_BIMProposal');
      expect(first).toHaveProperty('Chk_PreconProposal');
      expect(first).toHaveProperty('Chk_ProposalTabs');
      expect(first).toHaveProperty('Chk_CoordMarketing');
      expect(first).toHaveProperty('Chk_BusinessTerms');
    });
  });

  // ── Tab 3: Current Preconstruction ──────────────────────────────

  describe('getPreconEngagements', () => {
    it('should return records with PreconFee > 0', async () => {
      const precon = await dataService.getPreconEngagements();
      expect(precon.length).toBeGreaterThan(0);
      for (const record of precon) {
        expect(record.PreconFee).toBeDefined();
        expect(record.PreconFee).not.toBeNull();
        expect(record.PreconFee).toBeGreaterThan(0);
      }
    });

    it('should include preconstruction budget fields', async () => {
      const precon = await dataService.getPreconEngagements();
      const first = precon[0];
      expect(first).toHaveProperty('DocSetStage');
      expect(first).toHaveProperty('PreconFee');
      expect(first).toHaveProperty('DesignBudget');
      expect(first).toHaveProperty('FeePaidToDate');
    });
  });

  // ── Inline Edit (updateEstimatingRecord) ────────────────────────

  describe('updateEstimatingRecord', () => {
    it('should update a text field', async () => {
      const records = await dataService.getEstimatingRecords();
      const target = records.items[0];
      const updated = await dataService.updateEstimatingRecord(target.id, {
        NotesFeedback: 'Updated via inline edit',
      });
      expect(updated.NotesFeedback).toBe('Updated via inline edit');
    });

    it('should update a boolean checklist field', async () => {
      const pursuits = await dataService.getCurrentPursuits();
      const target = pursuits[0];
      const originalValue = target.Chk_BidBond;
      const updated = await dataService.updateEstimatingRecord(target.id, {
        Chk_BidBond: !originalValue,
      });
      expect(updated.Chk_BidBond).toBe(!originalValue);
    });

    it('should update a number field', async () => {
      const records = await dataService.getEstimatingRecords();
      const target = records.items[0];
      const updated = await dataService.updateEstimatingRecord(target.id, {
        CostPerGSF: 999,
      });
      expect(updated.CostPerGSF).toBe(999);
    });

    it('should throw for non-existent record', async () => {
      await expect(
        dataService.updateEstimatingRecord(99999, { NotesFeedback: 'test' })
      ).rejects.toThrow();
    });
  });

  // ── New Entry (createEstimatingRecord) ──────────────────────────

  describe('createEstimatingRecord', () => {
    it('should create a new record with required fields', async () => {
      const before = await dataService.getEstimatingRecords();
      const countBefore = before.items.length;

      const newRecord = await dataService.createEstimatingRecord({
        Title: 'Test New Project',
        ProjectCode: '99-001-01',
        LeadEstimator: 'Test Estimator',
        Source: 'RFP' as never,
      });

      expect(newRecord).toBeDefined();
      expect(newRecord.Title).toBe('Test New Project');
      expect(newRecord.ProjectCode).toBe('99-001-01');
      expect(newRecord.id).toBeGreaterThan(0);

      const after = await dataService.getEstimatingRecords();
      expect(after.items.length).toBe(countBefore + 1);
    });

    it('should create a record with checklist defaults', async () => {
      const newRecord = await dataService.createEstimatingRecord({
        Title: 'Checklist Test',
        ProjectCode: '99-002-01',
        Chk_BidBond: true,
        Chk_PPBond: false,
      });

      expect(newRecord.Chk_BidBond).toBe(true);
      expect(newRecord.Chk_PPBond).toBe(false);
    });
  });

  // ── Data Isolation ──────────────────────────────────────────────

  describe('data isolation between tabs', () => {
    it('estimate log, current pursuits, and precon engagements should not overlap completely', async () => {
      const [log, pursuits, precon] = await Promise.all([
        dataService.getEstimateLog(),
        dataService.getCurrentPursuits(),
        dataService.getPreconEngagements(),
      ]);

      const logIds = new Set(log.map(r => r.id));
      const pursuitIds = new Set(pursuits.map(r => r.id));

      // Log entries have SubmittedDate, pursuits don't — should not overlap
      for (const id of pursuitIds) {
        expect(logIds.has(id)).toBe(false);
      }

      // All three should have data
      expect(log.length).toBeGreaterThan(0);
      expect(pursuits.length).toBeGreaterThan(0);
      expect(precon.length).toBeGreaterThan(0);
    });
  });
});
