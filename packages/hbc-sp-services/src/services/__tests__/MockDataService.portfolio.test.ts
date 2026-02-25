import { MockDataService } from '../MockDataService';
import { IActiveProject } from '../../models/IActiveProject';
import { RoleName } from '../../models/enums';

describe('MockDataService — Active Projects Portfolio', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // ─── getActiveProjects ─────────────────────────────────────────────

  describe('getActiveProjects', () => {
    it('returns all 14 projects when no options', async () => {
      const projects = await ds.getActiveProjects();
      expect(projects).toHaveLength(14);
    });

    it('filters by status Construction → 11', async () => {
      const projects = await ds.getActiveProjects({ status: 'Construction' });
      expect(projects).toHaveLength(11);
      expect(projects.every(p => p.status === 'Construction')).toBe(true);
    });

    it('filters by status Precon → 2', async () => {
      const projects = await ds.getActiveProjects({ status: 'Precon' });
      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.id).sort()).toEqual([11, 12]);
    });

    it('filters by sector Residential → 4', async () => {
      const projects = await ds.getActiveProjects({ sector: 'Residential' });
      expect(projects).toHaveLength(4);
      expect(projects.every(p => p.sector === 'Residential')).toBe(true);
    });

    it('filters by region Miami → 3', async () => {
      const projects = await ds.getActiveProjects({ region: 'Miami' });
      expect(projects).toHaveLength(3);
      expect(projects.map(p => p.id).sort()).toEqual([3, 6, 9]);
    });

    it('filters by projectExecutive Bob Cashin → 3', async () => {
      const projects = await ds.getActiveProjects({ projectExecutive: 'Bob Cashin' });
      expect(projects).toHaveLength(3);
      expect(projects.map(p => p.id).sort()).toEqual([1, 8, 9]);
    });

    it('filters by projectManager Bill West → 2', async () => {
      const projects = await ds.getActiveProjects({ projectManager: 'Bill West' });
      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.id).sort((a, b) => a - b)).toEqual([9, 12]);
    });

    it('applies skip/top pagination', async () => {
      const page = await ds.getActiveProjects({ skip: 2, top: 3 });
      expect(page).toHaveLength(3);

      const tail = await ds.getActiveProjects({ skip: 12, top: 5 });
      expect(tail).toHaveLength(2);
    });

    it('applies orderBy projectName ascending and descending', async () => {
      const asc = await ds.getActiveProjects({ orderBy: 'projectName', orderAscending: true });
      const names = asc.map(p => p.projectName);
      expect(names).toEqual([...names].sort());

      const desc = await ds.getActiveProjects({ orderBy: 'projectName', orderAscending: false });
      const descNames = desc.map(p => p.projectName);
      expect(descNames).toEqual([...descNames].sort().reverse());
    });
  });

  // ─── getActiveProjectById ──────────────────────────────────────────

  describe('getActiveProjectById', () => {
    it('returns project 1 with correct identity fields', async () => {
      const p = await ds.getActiveProjectById(1);
      expect(p).not.toBeNull();
      expect(p!.projectName).toBe('Caretta');
      expect(p!.jobNumber).toBe('22-140-01');
      expect(p!.projectCode).toBe('22-140-01');
      expect(p!.status).toBe('Construction');
      expect(p!.sector).toBe('Commercial');
    });

    it('returns null for non-existent id', async () => {
      const p = await ds.getActiveProjectById(99999);
      expect(p).toBeNull();
    });

    it('returned object has nested personnel, financials, schedule, riskMetrics', async () => {
      const p = await ds.getActiveProjectById(1);
      expect(p).not.toBeNull();
      expect(p!.personnel).toBeDefined();
      expect(p!.personnel.projectExecutive).toBe('Bob Cashin');
      expect(p!.financials).toBeDefined();
      expect(p!.financials.originalContract).toBe(45000000);
      expect(p!.schedule).toBeDefined();
      expect(p!.schedule.percentComplete).toBe(67);
      expect(p!.riskMetrics).toBeDefined();
      expect(p!.riskMetrics.complianceStatus).toBe('Green');
    });
  });

  // ─── syncActiveProject ─────────────────────────────────────────────

  describe('syncActiveProject', () => {
    it('updates lastSyncDate to valid ISO string and returns copy', async () => {
      const before = new Date().toISOString();
      const result = await ds.syncActiveProject('22-140-01');
      expect(result.lastSyncDate).toBeDefined();
      expect(new Date(result.lastSyncDate!).toISOString()).toBe(result.lastSyncDate);
      expect(result.lastSyncDate! >= before).toBe(true);
    });

    it('throws for non-existent projectCode', async () => {
      await expect(ds.syncActiveProject('BOGUS')).rejects.toThrow();
    });

    it('returned copy is independent of internal state', async () => {
      const copy = await ds.syncActiveProject('22-140-01');
      copy.projectName = 'MUTATED';
      const fresh = await ds.getActiveProjectById(1);
      expect(fresh!.projectName).toBe('Caretta');
    });
  });

  // ─── updateActiveProject ───────────────────────────────────────────

  describe('updateActiveProject', () => {
    it('merges partial data and sets lastModified', async () => {
      const result = await ds.updateActiveProject(1, { statusComments: 'test comment' });
      expect(result.statusComments).toBe('test comment');
      expect(result.lastModified).toBeDefined();
      expect(new Date(result.lastModified!).toISOString()).toBe(result.lastModified);
    });

    it('persists on subsequent read', async () => {
      await ds.updateActiveProject(1, { statusComments: 'persisted' });
      const fresh = await ds.getActiveProjectById(1);
      expect(fresh!.statusComments).toBe('persisted');
    });

    it('throws for non-existent id', async () => {
      await expect(ds.updateActiveProject(99999, {})).rejects.toThrow();
    });

    it('can update nested fields via full object replacement', async () => {
      const original = await ds.getActiveProjectById(1);
      const updatedFinancials = { ...original!.financials, changeOrders: 9999999 };
      const result = await ds.updateActiveProject(1, { financials: updatedFinancials });
      expect(result.financials.changeOrders).toBe(9999999);
    });
  });

  // ─── getPortfolioSummary ───────────────────────────────────────────

  describe('getPortfolioSummary', () => {
    it('returns correct projectCount and status/sector counts', async () => {
      const summary = await ds.getPortfolioSummary();
      expect(summary.projectCount).toBe(14);
      expect(summary.projectsByStatus['Construction']).toBe(11);
      expect(summary.projectsByStatus['Precon']).toBe(2);
      expect(summary.projectsByStatus['Final Payment']).toBe(1);
      expect(summary.projectsBySector['Commercial']).toBe(10);
      expect(summary.projectsBySector['Residential']).toBe(4);
    });

    it('financial totals are positive and consistent', async () => {
      const summary = await ds.getPortfolioSummary();
      expect(summary.totalOriginalContract).toBeGreaterThan(0);
      expect(summary.totalBillingsToDate).toBeGreaterThan(0);
      expect(summary.totalOriginalContract).toBeGreaterThan(summary.totalBillingsToDate);
    });

    it('averageFeePct equals 5.0', async () => {
      const summary = await ds.getPortfolioSummary();
      expect(summary.averageFeePct).toBe(5.0);
    });

    it('applies status filter to reduce set', async () => {
      const summary = await ds.getPortfolioSummary({ status: 'Precon' });
      expect(summary.projectCount).toBe(2);
      expect(summary.projectsByStatus['Precon']).toBe(2);
      expect(summary.projectsByStatus['Construction']).toBe(0);
    });

    it('projectsWithAlerts is 0 (no project reaches 15% unbilled threshold)', async () => {
      const summary = await ds.getPortfolioSummary();
      // After threshold computation in generateMockActiveProjects, no project's
      // unbilled/CCV ratio reaches 15%, so all hasUnbilledAlert = false
      expect(summary.projectsWithAlerts).toBe(0);
    });
  });

  // ─── getPersonnelWorkload ──────────────────────────────────────────

  describe('getPersonnelWorkload', () => {
    it('returns entries for all roles sorted by projectCount desc', async () => {
      const workload = await ds.getPersonnelWorkload();
      expect(workload.length).toBeGreaterThan(0);
      // Verify descending sort
      for (let i = 1; i < workload.length; i++) {
        expect(workload[i - 1].projectCount).toBeGreaterThanOrEqual(workload[i].projectCount);
      }
      // Should contain PX, PM, and Super roles
      const roles = new Set(workload.map(w => w.role));
      expect(roles.has('PX')).toBe(true);
      expect(roles.has('PM')).toBe(true);
      expect(roles.has('Super')).toBe(true);
    });

    it('filters by PX — top entries have projectCount 3', async () => {
      const workload = await ds.getPersonnelWorkload('PX');
      expect(workload.every(w => w.role === 'PX')).toBe(true);
      // Bob Cashin (1,8,9) and Joe Keating (12,13,14) each have 3
      expect(workload[0].projectCount).toBe(3);
      expect(workload[1].projectCount).toBe(3);
    });

    it('filters by PM — Bill West has projectCount 2', async () => {
      const workload = await ds.getPersonnelWorkload('PM');
      expect(workload.every(w => w.role === 'PM')).toBe(true);
      const billWest = workload.find(w => w.name === 'Bill West');
      expect(billWest).toBeDefined();
      expect(billWest!.projectCount).toBe(2);
    });
  });

  // ─── triggerPortfolioSync ──────────────────────────────────────────

  describe('triggerPortfolioSync', () => {
    it('resolves without error', async () => {
      await expect(ds.triggerPortfolioSync()).resolves.toBeUndefined();
    });

    it('updates lastSyncDate on all 14 projects', async () => {
      const before = new Date().toISOString();
      await ds.triggerPortfolioSync();
      const projects = await ds.getActiveProjects();
      expect(projects).toHaveLength(14);
      for (const p of projects) {
        expect(p.lastSyncDate).toBeDefined();
        expect(p.lastSyncDate! >= before).toBe(true);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Domain 2: Data Mart
// ═══════════════════════════════════════════════════════════════════════

describe('MockDataService — Data Mart', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // ─── syncToDataMart ────────────────────────────────────────────────

  describe('syncToDataMart', () => {
    it('returns success:true for known project code', async () => {
      const result = await ds.syncToDataMart('22-140-01');
      expect(result.success).toBe(true);
      expect(result.projectCode).toBe('22-140-01');
      expect(result.syncedAt).toBeDefined();
    });

    it('returns success:false with error for unknown project code', async () => {
      const result = await ds.syncToDataMart('BOGUS-99');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('creates DataMart record with correct identity fields', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      expect(record).not.toBeNull();
      expect(record!.projectCode).toBe('22-140-01');
      expect(record!.jobNumber).toBe('22-140-01');
      expect(record!.projectName).toBe('Caretta');
      expect(record!.status).toBe('Construction');
      expect(record!.sector).toBe('Commercial');
      expect(record!.region).toBe('West Palm Beach');
    });

    it('computes financials correctly for Caretta', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      expect(record!.originalContract).toBe(45000000);
      expect(record!.changeOrders).toBe(2500000);
      expect(record!.currentContractValue).toBe(47500000);
      expect(record!.billingsToDate).toBe(32000000);
    });

    it('computes unbilledAmount as (OC + CO) - billings, not from financials.unbilled', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      // unbilledAmount = 47500000 - 32000000 = 15500000
      // (NOT the 4500000 from IActiveProject.financials.unbilled)
      expect(record!.unbilledAmount).toBe(15500000);
    });

    it('computes hasUnbilledAlert:true for Caretta (32.6% >= 15%)', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      // unbilledPct = 15500000 / 47500000 * 100 = 32.63%
      expect(record!.hasUnbilledAlert).toBe(true);
    });

    it('computes hasFeeErosionAlert:false when projectedFeePct equals threshold', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      // projectedFeePct = 5.0, threshold = 5.0; alert triggers only when < 5
      expect(record!.hasFeeErosionAlert).toBe(false);
    });

    it('upserts on second sync — preserves id, updates lastSyncDate', async () => {
      await ds.syncToDataMart('22-140-01');
      const first = await ds.getDataMartRecord('22-140-01');
      const firstId = first!.id;
      const firstSync = first!.lastSyncDate;

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await ds.syncToDataMart('22-140-01');
      const second = await ds.getDataMartRecord('22-140-01');
      expect(second!.id).toBe(firstId);
      expect(second!.lastSyncDate >= firstSync).toBe(true);

      // Should still be only one record for this project
      const all = await ds.getDataMartRecords();
      const carettaRecords = all.filter(r => r.projectCode === '22-140-01');
      expect(carettaRecords).toHaveLength(1);
    });

    it('sets meta fields: lastSyncBy and lastSyncDate', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      expect(record!.lastSyncBy).toBe('MockDataService');
      expect(new Date(record!.lastSyncDate).toISOString()).toBe(record!.lastSyncDate);
    });
  });

  // ─── getDataMartRecords ────────────────────────────────────────────

  describe('getDataMartRecords', () => {
    it('returns empty array before any sync', async () => {
      const records = await ds.getDataMartRecords();
      expect(records).toEqual([]);
    });

    it('returns 14 records after triggerDataMartSync', async () => {
      await ds.triggerDataMartSync();
      const records = await ds.getDataMartRecords();
      expect(records).toHaveLength(14);
    });

    it('filters by status Precon → 2 records', async () => {
      await ds.triggerDataMartSync();
      const records = await ds.getDataMartRecords({ status: 'Precon' });
      expect(records).toHaveLength(2);
      expect(records.every(r => r.status === 'Precon')).toBe(true);
    });

    it('filters by hasAlerts:true → only records with at least one alert flag', async () => {
      await ds.triggerDataMartSync();
      const all = await ds.getDataMartRecords();
      const withAlerts = await ds.getDataMartRecords({ hasAlerts: true });
      expect(withAlerts.length).toBeGreaterThan(0);
      // Every returned record must have at least one alert flag
      for (const r of withAlerts) {
        expect(r.hasUnbilledAlert || r.hasScheduleAlert || r.hasFeeErosionAlert).toBe(true);
      }
      // Records without alerts should not be in the filtered set
      const withoutAlerts = all.filter(
        r => !r.hasUnbilledAlert && !r.hasScheduleAlert && !r.hasFeeErosionAlert
      );
      const alertCodes = new Set(withAlerts.map(r => r.projectCode));
      for (const r of withoutAlerts) {
        expect(alertCodes.has(r.projectCode)).toBe(false);
      }
    });
  });

  // ─── getDataMartRecord ─────────────────────────────────────────────

  describe('getDataMartRecord', () => {
    it('returns null for unknown projectCode before sync', async () => {
      const record = await ds.getDataMartRecord('22-140-01');
      expect(record).toBeNull();
    });

    it('returns correct record after syncToDataMart', async () => {
      await ds.syncToDataMart('22-140-01');
      const record = await ds.getDataMartRecord('22-140-01');
      expect(record).not.toBeNull();
      expect(record!.projectName).toBe('Caretta');
      expect(record!.projectExecutive).toBe('Bob Cashin');
    });
  });

  // ─── triggerDataMartSync ───────────────────────────────────────────

  describe('triggerDataMartSync', () => {
    it('returns 14 results all with success:true', async () => {
      const results = await ds.triggerDataMartSync();
      expect(results).toHaveLength(14);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('populates getDataMartRecords with 14 records', async () => {
      await ds.triggerDataMartSync();
      const records = await ds.getDataMartRecords();
      expect(records).toHaveLength(14);
      // Verify distinct project codes
      const codes = new Set(records.map(r => r.projectCode));
      expect(codes.size).toBe(14);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Domain 3: Project Assignments
// ═══════════════════════════════════════════════════════════════════════

describe('MockDataService — Project Assignments', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // ─── getMyProjectAssignments ───────────────────────────────────────

  describe('getMyProjectAssignments', () => {
    it('returns assignments for known user email', async () => {
      const assignments = await ds.getMyProjectAssignments('bcashin@hedrickbrothers.com');
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments.every(a => a.userEmail.toLowerCase() === 'bcashin@hedrickbrothers.com')).toBe(true);
    });

    it('is case-insensitive for email lookup', async () => {
      const lower = await ds.getMyProjectAssignments('bcashin@hedrickbrothers.com');
      const upper = await ds.getMyProjectAssignments('BCASHIN@HEDRICKBROTHERS.COM');
      expect(lower.length).toBe(upper.length);
      expect(lower.map(a => a.id).sort()).toEqual(upper.map(a => a.id).sort());
    });

    it('returns empty array for unknown email', async () => {
      const assignments = await ds.getMyProjectAssignments('nobody@example.com');
      expect(assignments).toEqual([]);
    });

    it('returns deep clone — modifying result does not affect internal state', async () => {
      const first = await ds.getMyProjectAssignments('bcashin@hedrickbrothers.com');
      expect(first.length).toBeGreaterThan(0);
      first[0].assignedRole = 'MUTATED';

      const second = await ds.getMyProjectAssignments('bcashin@hedrickbrothers.com');
      expect(second[0].assignedRole).not.toBe('MUTATED');
    });
  });

  // ─── getAccessibleProjects ─────────────────────────────────────────

  describe('getAccessibleProjects', () => {
    it('returns all lead project codes for globalAccess user (default Leadership)', async () => {
      const codes = await ds.getAccessibleProjects('bcashin@hedrickbrothers.com');
      // Leadership has globalAccess → returns all lead project codes
      // Should be more than the 2 directly assigned project codes
      expect(codes.length).toBeGreaterThan(2);
    });

    it('returns only assigned codes after setCurrentUserRole(MarketingManager)', async () => {
      ds.setCurrentUserRole(RoleName.MarketingManager);
      const codes = await ds.getAccessibleProjects('bcashin@hedrickbrothers.com');
      // Marketing has no globalAccess → only project team assignments
      const assignments = await ds.getMyProjectAssignments('bcashin@hedrickbrothers.com');
      const assignedCodes = [...new Set(assignments.map(a => a.projectCode))];
      expect(codes.sort()).toEqual(assignedCodes.sort());
    });

    it('returns empty for unknown user with no globalAccess', async () => {
      ds.setCurrentUserRole(RoleName.MarketingManager);
      const codes = await ds.getAccessibleProjects('nobody@example.com');
      expect(codes).toEqual([]);
    });
  });
});
