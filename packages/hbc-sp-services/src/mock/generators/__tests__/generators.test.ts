import { generateBuyoutEntries } from '../buyoutGenerator';
import { generateAuditEntries } from '../auditLogGenerator';
import { generateEstimatingTrackers } from '../estimatingGenerator';
import { generateScheduleActivities } from '../scheduleActivityGenerator';
import { generateLeads } from '../leadGenerator';
import { SeededRandom } from '../helpers';

describe('Benchmark Data Generators', () => {
  describe('SeededRandom', () => {
    it('produces deterministic output with same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      const values1 = Array.from({ length: 100 }, () => rng1.next());
      const values2 = Array.from({ length: 100 }, () => rng2.next());
      expect(values1).toEqual(values2);
    });

    it('produces different output with different seeds', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(99);
      expect(rng1.next()).not.toEqual(rng2.next());
    });

    it('int() returns values within range', () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const val = rng.int(10, 20);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(20);
      }
    });

    it('choice() returns elements from array', () => {
      const rng = new SeededRandom(42);
      const arr = ['a', 'b', 'c'] as const;
      for (let i = 0; i < 100; i++) {
        expect(arr).toContain(rng.choice(arr));
      }
    });

    it('sample() returns unique elements', () => {
      const rng = new SeededRandom(42);
      const arr = [1, 2, 3, 4, 5];
      const result = rng.sample(arr, 3);
      expect(result).toHaveLength(3);
      expect(new Set(result).size).toBe(3);
    });
  });

  describe('generateBuyoutEntries', () => {
    it('generates the requested count', () => {
      const entries = generateBuyoutEntries(500);
      expect(entries).toHaveLength(500);
    });

    it('produces valid IBuyoutEntry objects', () => {
      const entries = generateBuyoutEntries(10);
      for (const entry of entries) {
        expect(entry.id).toBeDefined();
        expect(entry.projectCode).toMatch(/^\d{2}-\d{3}-\d{2}$/);
        expect(entry.divisionCode).toBeDefined();
        expect(entry.divisionDescription).toBeDefined();
        expect(typeof entry.originalBudget).toBe('number');
        expect(typeof entry.estimatedTax).toBe('number');
        expect(entry.totalBudget).toBe(entry.originalBudget + entry.estimatedTax);
        expect(['Not Started', 'In Progress', 'Awarded', 'Executed']).toContain(entry.status);
        expect(entry.commitmentStatus).toBeDefined();
        expect(entry.createdDate).toBeDefined();
        expect(entry.approvalHistory).toBeDefined();
      }
    });

    it('is deterministic with same seed', () => {
      const a = generateBuyoutEntries(50, 42);
      const b = generateBuyoutEntries(50, 42);
      expect(a.map(e => e.id)).toEqual(b.map(e => e.id));
      expect(a[0].divisionCode).toEqual(b[0].divisionCode);
    });

    it('generates 500+ entries in under 200ms', () => {
      const start = performance.now();
      generateBuyoutEntries(500);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('generateAuditEntries', () => {
    it('generates the requested count', () => {
      const entries = generateAuditEntries(5000);
      expect(entries).toHaveLength(5000);
    });

    it('produces valid IAuditEntry objects with PascalCase properties', () => {
      const entries = generateAuditEntries(10);
      for (const entry of entries) {
        expect(entry.id).toBeDefined();
        expect(entry.Timestamp).toBeDefined();
        expect(entry.User).toBeDefined();
        expect(entry.Action).toBeDefined();
        expect(entry.EntityType).toBeDefined();
        expect(entry.EntityId).toBeDefined();
        expect(entry.Details).toBeDefined();
      }
    });

    it('is sorted by timestamp descending', () => {
      const entries = generateAuditEntries(100);
      for (let i = 1; i < entries.length; i++) {
        expect(new Date(entries[i - 1].Timestamp).getTime())
          .toBeGreaterThanOrEqual(new Date(entries[i].Timestamp).getTime());
      }
    });

    it('generates 5000 entries in under 200ms', () => {
      const start = performance.now();
      generateAuditEntries(5000);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('generateEstimatingTrackers', () => {
    it('generates the requested count', () => {
      const records = generateEstimatingTrackers(300);
      expect(records).toHaveLength(300);
    });

    it('produces valid IEstimatingTracker objects', () => {
      const records = generateEstimatingTrackers(10);
      for (const record of records) {
        expect(record.id).toBeDefined();
        expect(record.Title).toBeDefined();
        expect(record.LeadID).toBeDefined();
        expect(record.ProjectCode).toBeDefined();
        expect(record.LeadEstimator).toBeDefined();
        expect(record.AwardStatus).toBeDefined();
        expect(Array.isArray(record.Contributors)).toBe(true);
      }
    });

    it('generates 300 records in under 200ms', () => {
      const start = performance.now();
      generateEstimatingTrackers(300);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('generateScheduleActivities', () => {
    it('generates the requested count', () => {
      const activities = generateScheduleActivities(1000);
      expect(activities).toHaveLength(1000);
    });

    it('produces valid IScheduleActivity objects', () => {
      const activities = generateScheduleActivities(10);
      for (const activity of activities) {
        expect(activity.id).toBeDefined();
        expect(activity.taskCode).toBeDefined();
        expect(activity.wbsCode).toBeDefined();
        expect(activity.activityName).toBeDefined();
        expect(['Completed', 'In Progress', 'Not Started']).toContain(activity.status);
        expect(typeof activity.originalDuration).toBe('number');
        expect(typeof activity.isCritical).toBe('boolean');
        expect(typeof activity.percentComplete).toBe('number');
        expect(activity.percentComplete).toBeGreaterThanOrEqual(0);
        expect(activity.percentComplete).toBeLessThanOrEqual(100);
        expect(Array.isArray(activity.predecessors)).toBe(true);
        expect(Array.isArray(activity.successors)).toBe(true);
      }
    });

    it('has ~10-15% critical path activities', () => {
      const activities = generateScheduleActivities(1000);
      const criticalCount = activities.filter(a => a.isCritical).length;
      const criticalPercent = (criticalCount / activities.length) * 100;
      expect(criticalPercent).toBeGreaterThan(5);
      expect(criticalPercent).toBeLessThan(25);
    });

    it('generates 1000 activities in under 200ms', () => {
      const start = performance.now();
      generateScheduleActivities(1000);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('generateLeads', () => {
    it('generates the requested count', () => {
      const leads = generateLeads(200);
      expect(leads).toHaveLength(200);
    });

    it('produces valid ILead objects', () => {
      const leads = generateLeads(10);
      for (const lead of leads) {
        expect(lead.id).toBeDefined();
        expect(lead.Title).toBeDefined();
        expect(lead.ClientName).toBeDefined();
        expect(lead.Region).toBeDefined();
        expect(lead.Sector).toBeDefined();
        expect(lead.Division).toBeDefined();
        expect(lead.Stage).toBeDefined();
        expect(lead.Originator).toBeDefined();
      }
    });

    it('has Go/No-Go data for non-discovery leads', () => {
      const leads = generateLeads(200);
      const nonDiscovery = leads.filter(l => l.Stage !== 'Lead-Discovery');
      const withGoNoGo = nonDiscovery.filter(l => l.GoNoGoScore_Originator !== undefined);
      expect(withGoNoGo.length).toBe(nonDiscovery.length);
    });

    it('generates 200 leads in under 200ms', () => {
      const start = performance.now();
      generateLeads(200);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Edge cases', () => {
    it('handles count=0 for all generators', () => {
      expect(generateBuyoutEntries(0)).toHaveLength(0);
      expect(generateAuditEntries(0)).toHaveLength(0);
      expect(generateEstimatingTrackers(0)).toHaveLength(0);
      expect(generateScheduleActivities(0)).toHaveLength(0);
      expect(generateLeads(0)).toHaveLength(0);
    });

    it('handles count=1 for all generators', () => {
      expect(generateBuyoutEntries(1)).toHaveLength(1);
      expect(generateAuditEntries(1)).toHaveLength(1);
      expect(generateEstimatingTrackers(1)).toHaveLength(1);
      expect(generateScheduleActivities(1)).toHaveLength(1);
      expect(generateLeads(1)).toHaveLength(1);
    });
  });
});
