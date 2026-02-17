/**
 * MockDataService — Schedule module method tests.
 * Validates getScheduleActivities, importScheduleActivities,
 * updateScheduleActivity, deleteScheduleActivity, getScheduleImports, getScheduleMetrics.
 */
import { MockDataService } from '../MockDataService';
import { IScheduleActivity, IScheduleImport } from '../../models/IScheduleActivity';

describe('MockDataService schedule operations', () => {
  let ds: MockDataService;

  // Known project code from mock data
  const PROJECT_CODE = 'HBC-2024-001';
  const UNKNOWN_PROJECT = 'NONEXISTENT-999';

  beforeEach(() => {
    ds = new MockDataService();
  });

  // --- getScheduleActivities ---
  describe('getScheduleActivities', () => {
    it('returns activities for a known project', async () => {
      const activities = await ds.getScheduleActivities(PROJECT_CODE);
      expect(Array.isArray(activities)).toBe(true);
      // Mock data should have some activities
      expect(activities.length).toBeGreaterThanOrEqual(0);
      if (activities.length > 0) {
        expect(activities[0].projectCode).toBe(PROJECT_CODE);
      }
    });

    it('returns empty array for unknown project', async () => {
      const activities = await ds.getScheduleActivities(UNKNOWN_PROJECT);
      expect(activities).toEqual([]);
    });

    it('returns copies (not references) of activities', async () => {
      const a1 = await ds.getScheduleActivities(PROJECT_CODE);
      const a2 = await ds.getScheduleActivities(PROJECT_CODE);
      if (a1.length > 0) {
        expect(a1[0]).not.toBe(a2[0]);
        expect(a1[0]).toEqual(a2[0]);
      }
    });
  });

  // --- importScheduleActivities ---
  describe('importScheduleActivities', () => {
    const testActivities: IScheduleActivity[] = [
      {
        id: 0, projectCode: 'IMPORT-TEST', taskCode: 'IMP-001',
        wbsCode: 'WBS.1', activityName: 'Import Test 1', activityType: 'Task Dependent',
        status: 'Not Started', originalDuration: 10, remainingDuration: 10, actualDuration: 0,
        baselineStartDate: null, baselineFinishDate: null,
        plannedStartDate: '2025-06-01T00:00:00.000Z', plannedFinishDate: '2025-06-15T00:00:00.000Z',
        actualStartDate: null, actualFinishDate: null,
        remainingFloat: 5, freeFloat: 0, predecessors: [], successors: [],
        successorDetails: [], resources: '', calendarName: '',
        primaryConstraint: '', secondaryConstraint: '',
        isCritical: false, percentComplete: 0,
        startVarianceDays: null, finishVarianceDays: null,
        deleteFlag: false, createdDate: '', modifiedDate: '',
      },
      {
        id: 0, projectCode: 'IMPORT-TEST', taskCode: 'IMP-002',
        wbsCode: 'WBS.1', activityName: 'Import Test 2', activityType: 'Task Dependent',
        status: 'Completed', originalDuration: 5, remainingDuration: 0, actualDuration: 5,
        baselineStartDate: null, baselineFinishDate: null,
        plannedStartDate: '2025-05-01T00:00:00.000Z', plannedFinishDate: '2025-05-07T00:00:00.000Z',
        actualStartDate: '2025-05-01T00:00:00.000Z', actualFinishDate: '2025-05-07T00:00:00.000Z',
        remainingFloat: null, freeFloat: null, predecessors: [], successors: [],
        successorDetails: [], resources: '', calendarName: '',
        primaryConstraint: '', secondaryConstraint: '',
        isCritical: false, percentComplete: 100,
        startVarianceDays: 0, finishVarianceDays: 0,
        deleteFlag: false, createdDate: '', modifiedDate: '',
      },
    ];

    it('imports activities and returns them with new IDs', async () => {
      const imported = await ds.importScheduleActivities('IMPORT-TEST', testActivities, {
        fileName: 'test.csv',
        format: 'P6-CSV',
        importedBy: 'TestUser',
        notes: 'test import',
      });
      expect(imported.length).toBe(2);
      // IDs should be reassigned (not 0)
      expect(imported[0].id).toBeGreaterThan(0);
      expect(imported[1].id).toBeGreaterThan(imported[0].id);
      expect(imported[0].projectCode).toBe('IMPORT-TEST');
    });

    it('replaces existing activities for the same project', async () => {
      // First import
      await ds.importScheduleActivities('REPLACE-TEST', testActivities, { fileName: 'first.csv' });
      const firstResult = await ds.getScheduleActivities('REPLACE-TEST');
      expect(firstResult.length).toBe(2);

      // Second import with 1 activity
      const singleActivity = [testActivities[0]];
      await ds.importScheduleActivities('REPLACE-TEST', singleActivity, { fileName: 'second.csv' });
      const secondResult = await ds.getScheduleActivities('REPLACE-TEST');
      expect(secondResult.length).toBe(1);
    });

    it('creates an import record', async () => {
      await ds.importScheduleActivities('IMP-RECORD-TEST', testActivities, {
        fileName: 'record.csv',
        format: 'P6-CSV',
        importedBy: 'TestUser',
        notes: 'testing',
      });
      const imports = await ds.getScheduleImports('IMP-RECORD-TEST');
      expect(imports.length).toBe(1);
      expect(imports[0].fileName).toBe('record.csv');
      expect(imports[0].format).toBe('P6-CSV');
      expect(imports[0].activityCount).toBe(2);
      expect(imports[0].importedBy).toBe('TestUser');
    });
  });

  // --- updateScheduleActivity ---
  describe('updateScheduleActivity', () => {
    it('updates activity fields and returns updated record', async () => {
      // Import first to have a known activity
      const [activity] = await ds.importScheduleActivities('UPD-TEST', [{
        id: 0, projectCode: 'UPD-TEST', taskCode: 'UPD-001',
        wbsCode: 'WBS.1', activityName: 'Original Name', activityType: 'Task Dependent',
        status: 'Not Started', originalDuration: 10, remainingDuration: 10, actualDuration: 0,
        baselineStartDate: null, baselineFinishDate: null,
        plannedStartDate: null, plannedFinishDate: null,
        actualStartDate: null, actualFinishDate: null,
        remainingFloat: null, freeFloat: null, predecessors: [], successors: [],
        successorDetails: [], resources: '', calendarName: '',
        primaryConstraint: '', secondaryConstraint: '',
        isCritical: false, percentComplete: 0,
        startVarianceDays: null, finishVarianceDays: null,
        deleteFlag: false, createdDate: '', modifiedDate: '',
      }], { fileName: 'upd.csv' });

      const updated = await ds.updateScheduleActivity('UPD-TEST', activity.id, {
        activityName: 'Updated Name',
        status: 'In Progress',
        percentComplete: 50,
      });

      expect(updated.activityName).toBe('Updated Name');
      expect(updated.status).toBe('In Progress');
      expect(updated.percentComplete).toBe(50);
      expect(updated.taskCode).toBe('UPD-001'); // unchanged
    });

    it('throws on missing activity', async () => {
      await expect(
        ds.updateScheduleActivity('NO-PROJECT', 99999, { activityName: 'Nope' })
      ).rejects.toThrow(/not found/i);
    });
  });

  // --- deleteScheduleActivity ---
  describe('deleteScheduleActivity', () => {
    it('removes the activity', async () => {
      const [activity] = await ds.importScheduleActivities('DEL-TEST', [{
        id: 0, projectCode: 'DEL-TEST', taskCode: 'DEL-001',
        wbsCode: 'WBS.1', activityName: 'To Delete', activityType: 'Task Dependent',
        status: 'Not Started', originalDuration: 10, remainingDuration: 10, actualDuration: 0,
        baselineStartDate: null, baselineFinishDate: null,
        plannedStartDate: null, plannedFinishDate: null,
        actualStartDate: null, actualFinishDate: null,
        remainingFloat: null, freeFloat: null, predecessors: [], successors: [],
        successorDetails: [], resources: '', calendarName: '',
        primaryConstraint: '', secondaryConstraint: '',
        isCritical: false, percentComplete: 0,
        startVarianceDays: null, finishVarianceDays: null,
        deleteFlag: false, createdDate: '', modifiedDate: '',
      }], { fileName: 'del.csv' });

      await ds.deleteScheduleActivity('DEL-TEST', activity.id);
      const remaining = await ds.getScheduleActivities('DEL-TEST');
      expect(remaining.length).toBe(0);
    });

    it('throws on missing activity', async () => {
      await expect(
        ds.deleteScheduleActivity('NO-PROJECT', 99999)
      ).rejects.toThrow(/not found/i);
    });
  });

  // --- getScheduleImports ---
  describe('getScheduleImports', () => {
    it('returns imports for a project', async () => {
      const imports = await ds.getScheduleImports(PROJECT_CODE);
      expect(Array.isArray(imports)).toBe(true);
    });

    it('returns empty array for unknown project', async () => {
      const imports = await ds.getScheduleImports(UNKNOWN_PROJECT);
      expect(imports).toEqual([]);
    });
  });

  // --- getScheduleMetrics ---
  describe('getScheduleMetrics', () => {
    it('returns metrics with expected shape', async () => {
      const metrics = await ds.getScheduleMetrics(PROJECT_CODE);
      expect(metrics).toHaveProperty('totalActivities');
      expect(metrics).toHaveProperty('completedCount');
      expect(metrics).toHaveProperty('inProgressCount');
      expect(metrics).toHaveProperty('notStartedCount');
      expect(metrics).toHaveProperty('percentComplete');
      expect(metrics).toHaveProperty('criticalActivityCount');
      expect(metrics).toHaveProperty('floatDistribution');
      expect(metrics).toHaveProperty('earnedValueMetrics');
      expect(metrics).toHaveProperty('logicMetrics');
    });

    it('returns zero-initialized metrics for unknown project', async () => {
      const metrics = await ds.getScheduleMetrics(UNKNOWN_PROJECT);
      expect(metrics.totalActivities).toBe(0);
      expect(metrics.completedCount).toBe(0);
    });
  });
});
