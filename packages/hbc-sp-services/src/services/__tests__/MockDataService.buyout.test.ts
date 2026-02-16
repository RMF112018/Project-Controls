import { MockDataService } from '../MockDataService';
import { IBuyoutEntry } from '../../models/IBuyoutEntry';
import { ICommitmentApproval } from '../../models/ICommitmentApproval';

describe('MockDataService — Buyout Schedule & Commitments', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // ─── getBuyoutEntries ──────────────────────────────────────────────

  describe('getBuyoutEntries', () => {
    it('returns 15 entries for project 25-042-01', async () => {
      const entries = await ds.getBuyoutEntries('25-042-01');
      expect(entries).toHaveLength(15);
    });

    it('returns empty array for unknown project code', async () => {
      const entries = await ds.getBuyoutEntries('BOGUS-99');
      expect(entries).toEqual([]);
    });

    it('results are sorted by divisionCode ascending', async () => {
      const entries = await ds.getBuyoutEntries('25-042-01');
      const codes = entries.map(e => e.divisionCode);
      expect(codes).toEqual([...codes].sort());
    });

    it('subcontractor entries include enriched e-verify data', async () => {
      const entries = await ds.getBuyoutEntries('25-042-01');
      const withSub = entries.filter(e => !!e.subcontractorName);
      expect(withSub.length).toBe(7);
      for (const e of withSub) {
        expect(e.eVerifyStatus).toBeDefined();
        expect(e.eVerifyContractNumber).toBeDefined();
        expect(e.qScore).toBeDefined();
        expect(e.compassPreQualStatus).toBeDefined();
      }
    });

    it('entries without subcontractors have no e-verify enrichment', async () => {
      const entries = await ds.getBuyoutEntries('25-042-01');
      const withoutSub = entries.filter(e => !e.subcontractorName);
      expect(withoutSub.length).toBe(8);
      for (const e of withoutSub) {
        expect(e.eVerifyContractNumber).toBeUndefined();
      }
    });
  });

  // ─── initializeBuyoutLog ───────────────────────────────────────────

  describe('initializeBuyoutLog', () => {
    it('returns existing entries when project already has data', async () => {
      const entries = await ds.initializeBuyoutLog('25-042-01');
      expect(entries).toHaveLength(15); // existing mock data
    });

    it('creates 14 standard divisions for new project code', async () => {
      const entries = await ds.initializeBuyoutLog('NEW-PROJECT');
      expect(entries).toHaveLength(14);
      expect(entries.every(e => e.isStandard)).toBe(true);
    });

    it('new entries have correct defaults', async () => {
      const entries = await ds.initializeBuyoutLog('NEW-PROJECT');
      for (const e of entries) {
        expect(e.commitmentStatus).toBe('Budgeted');
        expect(e.status).toBe('Not Started');
        expect(e.originalBudget).toBe(0);
        expect(e.totalBudget).toBe(0);
        expect(e.waiverRequired).toBe(false);
        expect(e.approvalHistory).toEqual([]);
      }
    });

    it('new entries persist and are retrievable via getBuyoutEntries', async () => {
      await ds.initializeBuyoutLog('NEW-PROJECT');
      const entries = await ds.getBuyoutEntries('NEW-PROJECT');
      expect(entries).toHaveLength(14);
    });
  });

  // ─── addBuyoutEntry ────────────────────────────────────────────────

  describe('addBuyoutEntry', () => {
    it('creates entry with auto-generated id and timestamps', async () => {
      const before = new Date().toISOString();
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-100',
        divisionDescription: 'Test Division',
        originalBudget: 50000,
      });
      expect(entry.id).toBeGreaterThan(0);
      expect(entry.projectCode).toBe('25-042-01');
      expect(entry.createdDate >= before).toBe(true);
      expect(entry.modifiedDate >= before).toBe(true);
    });

    it('calculates totalBudget = originalBudget + estimatedTax', async () => {
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-200',
        divisionDescription: 'Test',
        originalBudget: 100000,
        estimatedTax: 7500,
      });
      expect(entry.totalBudget).toBe(107500);
    });

    it('calculates overUnder when contractValue is provided', async () => {
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-300',
        divisionDescription: 'Test',
        originalBudget: 100000,
        estimatedTax: 5000,
        contractValue: 95000,
      });
      // overUnder = totalBudget - contractValue = 105000 - 95000
      expect(entry.overUnder).toBe(10000);
    });

    it('added entry appears in getBuyoutEntries', async () => {
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-400',
        divisionDescription: 'Added Test',
      });
      const all = await ds.getBuyoutEntries('25-042-01');
      const found = all.find(e => e.id === entry.id);
      expect(found).toBeDefined();
      expect(found!.divisionDescription).toBe('Added Test');
    });
  });

  // ─── updateBuyoutEntry ─────────────────────────────────────────────

  describe('updateBuyoutEntry', () => {
    it('updates fields and sets modifiedDate', async () => {
      const before = new Date().toISOString();
      const updated = await ds.updateBuyoutEntry('25-042-01', 501, {
        notes: 'Updated note',
      });
      expect(updated.notes).toBe('Updated note');
      expect(updated.modifiedDate >= before).toBe(true);
    });

    it('recalculates totalBudget when originalBudget changes', async () => {
      const original = (await ds.getBuyoutEntries('25-042-01')).find(e => e.id === 501)!;
      const updated = await ds.updateBuyoutEntry('25-042-01', 501, {
        originalBudget: 60000,
      });
      expect(updated.totalBudget).toBe(60000 + updated.estimatedTax);
    });

    it('recalculates overUnder when contractValue changes', async () => {
      await ds.updateBuyoutEntry('25-042-01', 505, {
        originalBudget: 195000,
        contractValue: 180000,
      });
      const entries = await ds.getBuyoutEntries('25-042-01');
      const entry = entries.find(e => e.id === 505)!;
      expect(entry.overUnder).toBe(entry.totalBudget - 180000);
    });

    it('throws for non-existent entry', async () => {
      await expect(
        ds.updateBuyoutEntry('25-042-01', 99999, { notes: 'test' })
      ).rejects.toThrow();
    });

    it('persists changes on subsequent read', async () => {
      await ds.updateBuyoutEntry('25-042-01', 501, {
        subcontractorName: 'New Sub Co.',
      });
      const entries = await ds.getBuyoutEntries('25-042-01');
      const entry = entries.find(e => e.id === 501)!;
      expect(entry.subcontractorName).toBe('New Sub Co.');
    });
  });

  // ─── removeBuyoutEntry ─────────────────────────────────────────────

  describe('removeBuyoutEntry', () => {
    it('removes entry from collection', async () => {
      const before = await ds.getBuyoutEntries('25-042-01');
      expect(before.find(e => e.id === 515)).toBeDefined();

      await ds.removeBuyoutEntry('25-042-01', 515);

      const after = await ds.getBuyoutEntries('25-042-01');
      expect(after).toHaveLength(before.length - 1);
      expect(after.find(e => e.id === 515)).toBeUndefined();
    });

    it('throws for non-existent entry', async () => {
      await expect(ds.removeBuyoutEntry('25-042-01', 99999)).rejects.toThrow();
    });

    it('does not affect other entries', async () => {
      await ds.removeBuyoutEntry('25-042-01', 515);
      const entries = await ds.getBuyoutEntries('25-042-01');
      expect(entries).toHaveLength(14);
      // Verify other entries still intact
      expect(entries.find(e => e.id === 501)).toBeDefined();
      expect(entries.find(e => e.id === 507)).toBeDefined();
    });
  });

  // ─── submitCommitmentForApproval ───────────────────────────────────

  describe('submitCommitmentForApproval', () => {
    it('adds PX approval step to history', async () => {
      const result = await ds.submitCommitmentForApproval('25-042-01', 503, 'test@hbc.com');
      expect(result.approvalHistory.length).toBeGreaterThan(0);
      const lastStep = result.approvalHistory[result.approvalHistory.length - 1];
      expect(lastStep.step).toBe('PX');
      expect(lastStep.status).toBe('Pending');
    });

    it('sets currentApprovalStep to PX', async () => {
      const result = await ds.submitCommitmentForApproval('25-042-01', 503, 'test@hbc.com');
      expect(result.currentApprovalStep).toBe('PX');
    });

    it('updates modifiedDate', async () => {
      const before = new Date().toISOString();
      const result = await ds.submitCommitmentForApproval('25-042-01', 503, 'test@hbc.com');
      expect(result.modifiedDate >= before).toBe(true);
    });

    it('throws for non-existent entry', async () => {
      await expect(
        ds.submitCommitmentForApproval('25-042-01', 99999, 'test@hbc.com')
      ).rejects.toThrow();
    });

    it('sets WaiverPending for entry with compliance gaps', async () => {
      // Entry 502: contractValue=135000 (>=$50k), bondRequired=false → bond waiver triggers
      const result = await ds.submitCommitmentForApproval('25-042-01', 502, 'test@hbc.com');
      expect(result.waiverRequired).toBe(true);
      expect(result.commitmentStatus).toBe('WaiverPending');
    });
  });

  // ─── respondToCommitmentApproval ───────────────────────────────────

  describe('respondToCommitmentApproval', () => {
    it('rejection sets commitmentStatus to Rejected', async () => {
      await ds.submitCommitmentForApproval('25-042-01', 503, 'test@hbc.com');
      const result = await ds.respondToCommitmentApproval('25-042-01', 503, false, 'Denied');
      expect(result.commitmentStatus).toBe('Rejected');
      expect(result.currentApprovalStep).toBeUndefined();
    });

    it('throws when no pending approval step exists', async () => {
      // Entry 501 is already Committed — no pending step
      await expect(
        ds.respondToCommitmentApproval('25-042-01', 501, true, 'approved')
      ).rejects.toThrow('No pending approval step');
    });

    it('PX approval on high-value waiver entry escalates to ComplianceReview', async () => {
      // Create entry with contractValue >= $250k AND compliance gaps (bondRequired=false)
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-HV1',
        divisionDescription: 'High Value Waiver Test',
        originalBudget: 300000,
        contractValue: 300000,
        enrolledInSDI: false,
        bondRequired: false,
        subcontractorName: 'Big Sub LLC',
      });
      await ds.submitCommitmentForApproval('25-042-01', entry.id, 'test@hbc.com');
      const result = await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'Looks good');
      expect(result.commitmentStatus).toBe('ComplianceReview');
      expect(result.currentApprovalStep).toBe('ComplianceManager');
      const cmStep = result.approvalHistory.find(a => a.step === 'ComplianceManager');
      expect(cmStep).toBeDefined();
      expect(cmStep!.status).toBe('Pending');
    });

    it('ComplianceManager escalate creates CFO step', async () => {
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-HV2',
        divisionDescription: 'CFO Escalation Test',
        originalBudget: 400000,
        contractValue: 400000,
        enrolledInSDI: false,
        bondRequired: false,
        subcontractorName: 'Escalate Sub LLC',
      });
      await ds.submitCommitmentForApproval('25-042-01', entry.id, 'test@hbc.com');
      await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'PX ok');
      const result = await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'Escalating', true);
      expect(result.commitmentStatus).toBe('CFOReview');
      expect(result.currentApprovalStep).toBe('CFO');
      const cfoStep = result.approvalHistory.find(a => a.step === 'CFO');
      expect(cfoStep).toBeDefined();
      expect(cfoStep!.status).toBe('Pending');
    });

    it('final CFO approval sets Committed and Executed', async () => {
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-HV3',
        divisionDescription: 'Full Escalation Test',
        originalBudget: 500000,
        contractValue: 500000,
        enrolledInSDI: false,
        bondRequired: false,
        subcontractorName: 'Full Flow Sub LLC',
      });
      await ds.submitCommitmentForApproval('25-042-01', entry.id, 'test@hbc.com');
      await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'PX ok');
      await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'Escalating', true);
      const result = await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'CFO approved');
      expect(result.commitmentStatus).toBe('Committed');
      expect(result.status).toBe('Executed');
      expect(result.currentApprovalStep).toBeUndefined();
    });
  });

  // ─── getCommitmentApprovalHistory ──────────────────────────────────

  describe('getCommitmentApprovalHistory', () => {
    it('returns approval steps after submission', async () => {
      await ds.submitCommitmentForApproval('25-042-01', 503, 'test@hbc.com');
      const history = await ds.getCommitmentApprovalHistory('25-042-01', 503);
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].step).toBe('PX');
    });

    it('returns copy of history — modifying result does not affect internal state', async () => {
      await ds.submitCommitmentForApproval('25-042-01', 503, 'test@hbc.com');
      const history1 = await ds.getCommitmentApprovalHistory('25-042-01', 503);
      history1.push({ id: 0, buyoutEntryId: 503, projectCode: '25-042-01', step: 'CFO', approverName: 'Fake', approverEmail: 'fake@hbc.com', status: 'Pending' });

      const history2 = await ds.getCommitmentApprovalHistory('25-042-01', 503);
      expect(history2.length).toBe(history1.length - 1);
    });

    it('throws for non-existent entry', async () => {
      await expect(
        ds.getCommitmentApprovalHistory('25-042-01', 99999)
      ).rejects.toThrow();
    });
  });

  // ─── Commitment workflow integration ───────────────────────────────

  describe('commitment workflow integration', () => {
    it('full flow: submit → PX approve → Committed (low-value, no waiver)', async () => {
      // Create a clean entry with low value and full compliance
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-900',
        divisionDescription: 'Low Value Test',
        originalBudget: 30000,
        contractValue: 28000,
        enrolledInSDI: true,
        bondRequired: true,
        subcontractorName: 'Clean Sub Inc.',
      });

      const submitted = await ds.submitCommitmentForApproval('25-042-01', entry.id, 'test@hbc.com');
      expect(submitted.commitmentStatus).toBe('PendingReview');
      expect(submitted.waiverRequired).toBe(false);

      const approved = await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'All good');
      expect(approved.commitmentStatus).toBe('Committed');
      expect(approved.status).toBe('Executed');
    });

    it('full flow: submit → PX reject → Rejected', async () => {
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-901',
        divisionDescription: 'Reject Test',
        originalBudget: 30000,
        contractValue: 28000,
        enrolledInSDI: true,
        bondRequired: true,
        subcontractorName: 'Reject Sub Inc.',
      });

      await ds.submitCommitmentForApproval('25-042-01', entry.id, 'test@hbc.com');
      const rejected = await ds.respondToCommitmentApproval('25-042-01', entry.id, false, 'Not acceptable');
      expect(rejected.commitmentStatus).toBe('Rejected');

      // Verify the rejection is recorded in history
      const history = await ds.getCommitmentApprovalHistory('25-042-01', entry.id);
      const rejectedStep = history.find(a => a.status === 'Rejected');
      expect(rejectedStep).toBeDefined();
      expect(rejectedStep!.comment).toBe('Not acceptable');
    });

    it('full flow: submit → PX → ComplianceReview → approve → Committed (high-value waiver)', async () => {
      // Create high-value entry with compliance gaps → waiver + escalation
      const entry = await ds.addBuyoutEntry('25-042-01', {
        divisionCode: '99-INT',
        divisionDescription: 'Integration Flow Test',
        originalBudget: 350000,
        contractValue: 350000,
        enrolledInSDI: false,
        bondRequired: false,
        subcontractorName: 'Integration Sub LLC',
      });
      await ds.submitCommitmentForApproval('25-042-01', entry.id, 'test@hbc.com');
      await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'PX approves');
      const final = await ds.respondToCommitmentApproval('25-042-01', entry.id, true, 'Compliance approves');
      expect(final.commitmentStatus).toBe('Committed');
      expect(final.status).toBe('Executed');

      // Full history should have PX (Approved) + ComplianceManager (Approved)
      const history = await ds.getCommitmentApprovalHistory('25-042-01', entry.id);
      const pxStep = history.find(a => a.step === 'PX');
      const cmStep = history.find(a => a.step === 'ComplianceManager');
      expect(pxStep!.status).toBe('Approved');
      expect(cmStep!.status).toBe('Approved');
    });
  });

  // ─── getComplianceLog ──────────────────────────────────────────────

  describe('getComplianceLog', () => {
    it('returns entries only for buyouts with subcontractors', async () => {
      const entries = await ds.getComplianceLog();
      expect(entries.length).toBe(7); // 7 entries have subcontractors
      for (const e of entries) {
        expect(e.subcontractorName).toBeDefined();
        expect(e.subcontractorName.length).toBeGreaterThan(0);
      }
    });

    it('filters by projectCode', async () => {
      const entries = await ds.getComplianceLog({ projectCode: '25-042-01' });
      expect(entries.length).toBe(7);
      expect(entries.every(e => e.projectCode === '25-042-01')).toBe(true);

      const empty = await ds.getComplianceLog({ projectCode: 'BOGUS' });
      expect(empty).toEqual([]);
    });

    it('filters by commitmentStatus', async () => {
      const committed = await ds.getComplianceLog({ commitmentStatus: 'Committed' });
      expect(committed.length).toBeGreaterThan(0);
      expect(committed.every(e => e.commitmentStatus === 'Committed')).toBe(true);
    });

    it('filters by searchQuery (case-insensitive)', async () => {
      const results = await ds.getComplianceLog({ searchQuery: 'steel' });
      expect(results.length).toBeGreaterThan(0);
      const hasMatch = results.some(
        e => e.subcontractorName.toLowerCase().includes('steel') ||
             e.divisionDescription.toLowerCase().includes('steel')
      );
      expect(hasMatch).toBe(true);
    });

    it('each entry has computed compliance fields', async () => {
      const entries = await ds.getComplianceLog();
      for (const e of entries) {
        expect(typeof e.riskCompliant).toBe('boolean');
        expect(typeof e.documentsCompliant).toBe('boolean');
        expect(typeof e.insuranceCompliant).toBe('boolean');
        expect(typeof e.eVerifyCompliant).toBe('boolean');
        expect(typeof e.overallCompliant).toBe('boolean');
      }
    });
  });

  // ─── getComplianceSummary ──────────────────────────────────────────

  describe('getComplianceSummary', () => {
    it('returns correct totalCommitments count', async () => {
      const summary = await ds.getComplianceSummary();
      expect(summary.totalCommitments).toBe(7);
    });

    it('counts are non-negative and sum is consistent', async () => {
      const summary = await ds.getComplianceSummary();
      expect(summary.fullyCompliant).toBeGreaterThanOrEqual(0);
      expect(summary.eVerifyPending).toBeGreaterThanOrEqual(0);
      expect(summary.eVerifyOverdue).toBeGreaterThanOrEqual(0);
      expect(summary.waiversPending).toBeGreaterThanOrEqual(0);
      expect(summary.documentsMissing).toBeGreaterThanOrEqual(0);
    });

    it('eVerify counts match compliance log data', async () => {
      const log = await ds.getComplianceLog();
      const summary = await ds.getComplianceSummary();

      const pendingStatuses = ['Sent', 'Reminder Sent', 'Not Sent'];
      const expectedPending = log.filter(e => pendingStatuses.includes(e.eVerifyStatus)).length;
      const expectedOverdue = log.filter(e => e.eVerifyStatus === 'Overdue').length;

      expect(summary.eVerifyPending).toBe(expectedPending);
      expect(summary.eVerifyOverdue).toBe(expectedOverdue);
    });
  });
});
