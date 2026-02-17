/**
 * scheduleMetrics — Unit tests for computeScheduleMetrics.
 *
 * Uses jest.useFakeTimers to freeze time for deterministic PV/SV calculations.
 */
import { computeScheduleMetrics } from '../scheduleMetrics';
import { IScheduleActivity } from '../../models/IScheduleActivity';

// Helper to build a minimal IScheduleActivity with sensible defaults
function makeActivity(overrides: Partial<IScheduleActivity> = {}): IScheduleActivity {
  return {
    id: 1,
    projectCode: 'TEST',
    taskCode: 'T1',
    wbsCode: 'WBS.1',
    activityName: 'Test Activity',
    activityType: 'Task Dependent',
    status: 'Not Started',
    originalDuration: 10,
    remainingDuration: 10,
    actualDuration: 0,
    baselineStartDate: null,
    baselineFinishDate: null,
    plannedStartDate: null,
    plannedFinishDate: null,
    actualStartDate: null,
    actualFinishDate: null,
    remainingFloat: null,
    freeFloat: null,
    predecessors: [],
    successors: [],
    successorDetails: [],
    resources: '',
    calendarName: '',
    primaryConstraint: '',
    secondaryConstraint: '',
    isCritical: false,
    percentComplete: 0,
    startVarianceDays: null,
    finishVarianceDays: null,
    deleteFlag: false,
    createdDate: '2025-01-01T00:00:00.000Z',
    modifiedDate: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeScheduleMetrics', () => {
  beforeAll(() => {
    // Freeze time to 2025-03-15 for deterministic PV calculations
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-03-15T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // --- Empty input ---
  it('returns zero-initialized metrics for empty array', () => {
    const m = computeScheduleMetrics([]);
    expect(m.totalActivities).toBe(0);
    expect(m.completedCount).toBe(0);
    expect(m.inProgressCount).toBe(0);
    expect(m.notStartedCount).toBe(0);
    expect(m.percentComplete).toBe(0);
    expect(m.criticalActivityCount).toBe(0);
    expect(m.negativeFloatCount).toBe(0);
    expect(m.averageFloat).toBe(0);
    expect(m.spiApproximation).toBe(null);
    expect(m.negativeFloatPercent).toBe(0);
    expect(m.earnedValueMetrics.bac).toBe(0);
    expect(m.logicMetrics.totalRelationships).toBe(0);
  });

  // --- Status counts ---
  it('counts statuses correctly', () => {
    const activities = [
      makeActivity({ id: 1, status: 'Completed', actualDuration: 10, remainingDuration: 0, percentComplete: 100 }),
      makeActivity({ id: 2, status: 'In Progress', actualDuration: 5, remainingDuration: 5, percentComplete: 50 }),
      makeActivity({ id: 3, status: 'Not Started', actualDuration: 0, remainingDuration: 10, percentComplete: 0 }),
      makeActivity({ id: 4, status: 'Completed', actualDuration: 10, remainingDuration: 0, percentComplete: 100 }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.completedCount).toBe(2);
    expect(m.inProgressCount).toBe(1);
    expect(m.notStartedCount).toBe(1);
    expect(m.totalActivities).toBe(4);
  });

  it('calculates percentComplete as ratio of completed to total', () => {
    const activities = [
      makeActivity({ id: 1, status: 'Completed', percentComplete: 100 }),
      makeActivity({ id: 2, status: 'Completed', percentComplete: 100 }),
      makeActivity({ id: 3, status: 'In Progress', percentComplete: 50 }),
      makeActivity({ id: 4, status: 'Not Started', percentComplete: 0 }),
    ];
    const m = computeScheduleMetrics(activities);
    // 2/4 = 50%
    expect(m.percentComplete).toBe(50);
  });

  // --- Critical path ---
  it('counts critical activities correctly', () => {
    const activities = [
      makeActivity({ id: 1, isCritical: true, remainingFloat: 0 }),
      makeActivity({ id: 2, isCritical: true, remainingFloat: -5 }),
      makeActivity({ id: 3, isCritical: false, remainingFloat: 10 }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.criticalActivityCount).toBe(2);
  });

  it('counts negative float activities', () => {
    const activities = [
      makeActivity({ id: 1, remainingFloat: -5 }),
      makeActivity({ id: 2, remainingFloat: -1 }),
      makeActivity({ id: 3, remainingFloat: 0 }),
      makeActivity({ id: 4, remainingFloat: 10 }),
      makeActivity({ id: 5, remainingFloat: null }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.negativeFloatCount).toBe(2);
  });

  // --- Float ---
  it('calculates averageFloat excluding null values', () => {
    const activities = [
      makeActivity({ id: 1, remainingFloat: 10 }),
      makeActivity({ id: 2, remainingFloat: 20 }),
      makeActivity({ id: 3, remainingFloat: null }),
    ];
    const m = computeScheduleMetrics(activities);
    // (10 + 20) / 2 = 15
    expect(m.averageFloat).toBe(15);
  });

  it('computes float distribution buckets correctly', () => {
    const activities = [
      makeActivity({ id: 1, remainingFloat: -5 }),     // negative
      makeActivity({ id: 2, remainingFloat: 0 }),       // zero
      makeActivity({ id: 3, remainingFloat: 5 }),       // low (1-10)
      makeActivity({ id: 4, remainingFloat: 10 }),      // low (1-10)
      makeActivity({ id: 5, remainingFloat: 20 }),      // medium (11-30)
      makeActivity({ id: 6, remainingFloat: 50 }),      // high (30+)
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.floatDistribution.negative).toBe(1);
    expect(m.floatDistribution.zero).toBe(1);
    expect(m.floatDistribution.low).toBe(2);
    expect(m.floatDistribution.medium).toBe(1);
    expect(m.floatDistribution.high).toBe(1);
  });

  it('calculates negativeFloatPercent', () => {
    const activities = [
      makeActivity({ id: 1, remainingFloat: -5 }),
      makeActivity({ id: 2, remainingFloat: 10 }),
      makeActivity({ id: 3, remainingFloat: 20 }),
      makeActivity({ id: 4, remainingFloat: 0 }),
    ];
    const m = computeScheduleMetrics(activities);
    // 1/4 = 25%
    expect(m.negativeFloatPercent).toBe(25);
  });

  // --- Earned value ---
  it('calculates SPI/CPI with known durations', () => {
    const activities = [
      makeActivity({
        id: 1,
        originalDuration: 20,
        actualDuration: 20,
        percentComplete: 100,
        status: 'Completed',
        baselineStartDate: '2025-01-01T00:00:00.000Z',
        baselineFinishDate: '2025-02-01T00:00:00.000Z',
      }),
      makeActivity({
        id: 2,
        originalDuration: 20,
        actualDuration: 10,
        percentComplete: 50,
        status: 'In Progress',
        baselineStartDate: '2025-02-01T00:00:00.000Z',
        baselineFinishDate: '2025-04-01T00:00:00.000Z',
      }),
    ];
    const m = computeScheduleMetrics(activities);
    // BAC = 40 (20 + 20)
    expect(m.earnedValueMetrics.bac).toBe(40);
    // EV = (100/100)*20 + (50/100)*20 = 20 + 10 = 30
    expect(m.earnedValueMetrics.ev).toBe(30);
    // CPI = EV / AC = 30 / 30 = 1.0
    expect(m.earnedValueMetrics.cpi).toBe(1);
  });

  it('returns null SPI/CPI when totalDuration is 0', () => {
    const activities = [
      makeActivity({ id: 1, originalDuration: 0, actualDuration: 0 }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.spiApproximation).toBe(null);
  });

  it('prorates PV for activities spanning current date', () => {
    // Freeze time is 2025-03-15
    const activities = [
      makeActivity({
        id: 1,
        originalDuration: 60,
        actualDuration: 0,
        percentComplete: 0,
        baselineStartDate: '2025-02-15T00:00:00.000Z',
        baselineFinishDate: '2025-04-15T00:00:00.000Z',
      }),
    ];
    const m = computeScheduleMetrics(activities);
    // Total span: Feb 15 to Apr 15 = 59 days
    // Elapsed: Feb 15 to Mar 15 = 28 days
    // PV = 60 * (28/59) ≈ 28.5 → rounded to 1 decimal
    expect(m.earnedValueMetrics.pv).toBeGreaterThan(20);
    expect(m.earnedValueMetrics.pv).toBeLessThan(40);
  });

  // --- Constraints ---
  it('counts constrained activities', () => {
    const activities = [
      makeActivity({ id: 1, primaryConstraint: 'Must Start On' }),
      makeActivity({ id: 2, primaryConstraint: 'Must Start On' }),
      makeActivity({ id: 3, primaryConstraint: 'Start No Earlier Than' }),
      makeActivity({ id: 4, primaryConstraint: '' }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.constraintAnalysis.totalConstrained).toBe(3);
    expect(m.constraintAnalysis.byType['Must Start On']).toBe(2);
    expect(m.constraintAnalysis.byType['Start No Earlier Than']).toBe(1);
  });

  it('handles empty constraints', () => {
    const activities = [
      makeActivity({ id: 1, primaryConstraint: '' }),
      makeActivity({ id: 2, primaryConstraint: '' }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.constraintAnalysis.totalConstrained).toBe(0);
    expect(Object.keys(m.constraintAnalysis.byType).length).toBe(0);
  });

  // --- Logic metrics ---
  it('counts relationship types from successorDetails', () => {
    const activities = [
      makeActivity({
        id: 1,
        predecessors: [],
        successors: ['T2', 'T3'],
        successorDetails: [
          { taskCode: 'T2', relationshipType: 'FS', lag: 0 },
          { taskCode: 'T3', relationshipType: 'SS', lag: 1 },
        ],
      }),
      makeActivity({
        id: 2,
        taskCode: 'T2',
        predecessors: ['T1'],
        successors: [],
        successorDetails: [],
      }),
      makeActivity({
        id: 3,
        taskCode: 'T3',
        predecessors: ['T1'],
        successors: [],
        successorDetails: [],
      }),
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.logicMetrics.totalRelationships).toBe(2);
    expect(m.logicMetrics.relationshipTypes.FS).toBe(1);
    expect(m.logicMetrics.relationshipTypes.SS).toBe(1);
  });

  it('counts open ends (no predecessors / no successors)', () => {
    const activities = [
      makeActivity({ id: 1, predecessors: [], successors: ['T2'] }),           // no pred
      makeActivity({ id: 2, taskCode: 'T2', predecessors: ['T1'], successors: [] }), // no succ
      makeActivity({ id: 3, predecessors: ['X'], successors: ['Y'] }),         // both
    ];
    const m = computeScheduleMetrics(activities);
    expect(m.logicMetrics.openEnds.noPredecessor).toBe(1);
    expect(m.logicMetrics.openEnds.noSuccessor).toBe(1);
  });
});
