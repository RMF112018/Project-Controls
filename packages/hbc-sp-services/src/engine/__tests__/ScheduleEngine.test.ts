import { ScheduleEngine } from '../ScheduleEngine';
import { IScheduleActivity } from '../../models/IScheduleActivity';

function activity(overrides: Partial<IScheduleActivity>): IScheduleActivity {
  return {
    id: overrides.id ?? 1,
    projectCode: overrides.projectCode ?? 'P-001',
    importId: overrides.importId,
    externalActivityKey: overrides.externalActivityKey ?? `ext-${overrides.taskCode || 'A'}`,
    importFingerprint: overrides.importFingerprint,
    lineageStatus: overrides.lineageStatus,
    taskCode: overrides.taskCode || 'A',
    wbsCode: overrides.wbsCode || '1.1',
    activityName: overrides.activityName || 'Activity',
    activityType: overrides.activityType || 'Task Dependent',
    status: overrides.status || 'Not Started',
    originalDuration: overrides.originalDuration ?? 5,
    remainingDuration: overrides.remainingDuration ?? 5,
    actualDuration: overrides.actualDuration ?? 0,
    baselineStartDate: overrides.baselineStartDate ?? null,
    baselineFinishDate: overrides.baselineFinishDate ?? null,
    plannedStartDate: overrides.plannedStartDate ?? null,
    plannedFinishDate: overrides.plannedFinishDate ?? null,
    actualStartDate: overrides.actualStartDate ?? null,
    actualFinishDate: overrides.actualFinishDate ?? null,
    remainingFloat: overrides.remainingFloat ?? 0,
    freeFloat: overrides.freeFloat ?? 0,
    predecessors: overrides.predecessors ?? [],
    successors: overrides.successors ?? [],
    successorDetails: overrides.successorDetails ?? [],
    resources: overrides.resources ?? '',
    calendarName: overrides.calendarName ?? '',
    primaryConstraint: overrides.primaryConstraint ?? '',
    secondaryConstraint: overrides.secondaryConstraint ?? '',
    isCritical: overrides.isCritical ?? false,
    percentComplete: overrides.percentComplete ?? 0,
    startVarianceDays: overrides.startVarianceDays ?? null,
    finishVarianceDays: overrides.finishVarianceDays ?? null,
    deleteFlag: overrides.deleteFlag ?? false,
    createdDate: overrides.createdDate ?? new Date().toISOString(),
    modifiedDate: overrides.modifiedDate ?? new Date().toISOString(),
  };
}

describe('ScheduleEngine', () => {
  const engine = new ScheduleEngine();

  it('enforces externalActivityKey identity', () => {
    const tasks = [activity({ taskCode: 'A', externalActivityKey: '' })];
    expect(() => engine.runCpm('P-001', tasks)).toThrow(/externalActivityKey/);
  });

  it('computes CPM for linear network', () => {
    const a = activity({ id: 1, taskCode: 'A', externalActivityKey: 'k-A', originalDuration: 5, predecessors: [] });
    const b = activity({ id: 2, taskCode: 'B', externalActivityKey: 'k-B', originalDuration: 3, predecessors: ['A'] });
    const c = activity({ id: 3, taskCode: 'C', externalActivityKey: 'k-C', originalDuration: 2, predecessors: ['B'] });

    const result = engine.runCpm('P-001', [a, b, c]);
    expect(result.projectDurationDays).toBe(10);
    expect(result.criticalPathExternalKeys).toEqual(['k-A', 'k-B', 'k-C']);
    expect(result.activities.every(r => r.totalFloatDays === 0)).toBe(true);
    expect(result.diagnostic.hasCycle).toBe(false);
  });

  it('returns diagnostics for duplicates, open ends, and orphans', () => {
    const a = activity({ id: 1, taskCode: 'A', externalActivityKey: 'k-A', predecessors: [], successors: ['Z'] });
    const b = activity({ id: 2, taskCode: 'B', externalActivityKey: 'k-B', predecessors: ['A', 'A', 'NOPE'] });
    const diag = engine.analyzeDag('P-001', [a, b]);
    expect(diag.hasCycle).toBe(false);
    expect(diag.duplicatePredecessors.length).toBe(1);
    expect(diag.orphanReferences.some(o => o.missingRefTaskCode === 'NOPE' && o.refType === 'pred')).toBe(true);
    expect(diag.orphanReferences.some(o => o.missingRefTaskCode === 'Z' && o.refType === 'succ')).toBe(true);
    expect(diag.openEndNodes.noPred).toContain('k-A');
    expect(diag.openEndNodes.noSucc).toContain('k-B');
  });

  it('detects cycle path and blocks CPM run', () => {
    const a = activity({ id: 1, taskCode: 'A', externalActivityKey: 'k-A', predecessors: ['C'] });
    const b = activity({ id: 2, taskCode: 'B', externalActivityKey: 'k-B', predecessors: ['A'] });
    const c = activity({ id: 3, taskCode: 'C', externalActivityKey: 'k-C', predecessors: ['B'] });
    const diag = engine.analyzeDag('P-001', [a, b, c]);
    expect(diag.hasCycle).toBe(true);
    expect(diag.cyclePaths.length).toBeGreaterThan(0);
    expect(() => engine.runCpm('P-001', [a, b, c])).toThrow(/cycle/i);
  });

  it('handles large DAG (5k+) within sanity threshold', () => {
    const size = 5200;
    const nodes: IScheduleActivity[] = [];
    for (let i = 0; i < size; i++) {
      nodes.push(activity({
        id: i + 1,
        taskCode: `T-${i + 1}`,
        externalActivityKey: `k-${i + 1}`,
        originalDuration: 1,
        predecessors: i === 0 ? [] : [`T-${i}`],
      }));
    }
    const start = Date.now();
    const result = engine.runCpm('P-001', nodes);
    const elapsed = Date.now() - start;
    expect(result.activities.length).toBe(size);
    expect(result.projectDurationDays).toBe(size);
    expect(elapsed).toBeLessThan(2000);
  });

  it('computes field readiness score with weighting', () => {
    const tasks = [
      activity({ taskCode: 'A', externalActivityKey: 'k-A', status: 'Completed' }),
      activity({ taskCode: 'B', externalActivityKey: 'k-B', status: 'Not Started' }),
    ];
    const score = engine.computeFieldReadinessScore(
      'P-001',
      tasks,
      [{
        id: 1,
        projectCode: 'P-001',
        externalActivityKey: 'k-A',
        scheduleActivityId: 1,
        fieldTaskId: 'FT-1',
        fieldTaskType: 'Card',
        confidenceScore: 1,
        isManual: false,
        createdBy: 'u',
        createdAt: new Date().toISOString(),
        modifiedBy: 'u',
        modifiedAt: new Date().toISOString(),
      }],
      [{
        id: 1,
        projectCode: 'P-001',
        constraintNumber: 1,
        category: 'Other',
        description: 'x',
        status: 'Open',
        assignedTo: 'x',
        dateIdentified: '2026-01-01',
        dueDate: '2026-02-01',
      }],
      [{
        id: 1,
        projectCode: 'P-001',
        refNumber: 'P1',
        location: 'Site',
        type: 'PRIMARY',
        permitNumber: '123',
        description: 'd',
        responsibleContractor: 'x',
        address: 'a',
        dateRequired: '2026-01-01',
        status: 'Pending Application',
        ahj: 'City',
      }],
    );
    expect(score.projectCode).toBe('P-001');
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.linkageCoveragePct).toBe(50);
  });
});
