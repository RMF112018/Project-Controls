import type { IScheduleActivity } from '../../models/IScheduleActivity';
import {
  SeededRandom,
  randomDate,
  randomProjectCode,
  WBS_PREFIXES,
  ACTIVITY_TEMPLATES,
} from './helpers';

type ActivityStatus = 'Completed' | 'In Progress' | 'Not Started';
type RelationshipType = 'FS' | 'FF' | 'SS' | 'SF';

const CALENDAR_NAMES = ['5D w/Hol 1222-1226', '6D Standard', '7D Emergency', '5D Standard'] as const;

/**
 * Generate `count` schedule activities with realistic WBS hierarchy,
 * predecessor/successor relationships, and critical path distribution.
 * ~10-15% of activities are on the critical path.
 */
export function generateScheduleActivities(count: number, seed: number = 42): IScheduleActivity[] {
  const rng = new SeededRandom(seed);
  const activities: IScheduleActivity[] = [];
  const projectCode = randomProjectCode(rng);

  // Pre-generate task codes for predecessor/successor linking
  const taskCodes: string[] = [];
  for (let i = 0; i < count; i++) {
    const prefix = WBS_PREFIXES[Math.floor(i / (count / WBS_PREFIXES.length)) % WBS_PREFIXES.length];
    taskCodes.push(`${prefix}-${(i * 10 + 10).toString()}`);
  }

  const baseDate = new Date('2024-10-01T08:00:00.000Z');

  for (let i = 0; i < count; i++) {
    const prefix = WBS_PREFIXES[Math.floor(i / (count / WBS_PREFIXES.length)) % WBS_PREFIXES.length];
    const taskCode = taskCodes[i];
    const wbsCode = `${projectCode}.${rng.int(1, 10)}.${rng.int(1, 10)}.${rng.int(1, 5)}`;
    const activityName = rng.choice(ACTIVITY_TEMPLATES);

    // Duration
    const originalDuration = rng.int(1, 60);
    const percentComplete = rng.int(0, 100);
    const actualDuration = Math.round(originalDuration * (percentComplete / 100));
    const remainingDuration = originalDuration - actualDuration;

    // Status
    let status: ActivityStatus;
    if (percentComplete === 100) status = 'Completed';
    else if (percentComplete > 0) status = 'In Progress';
    else status = 'Not Started';

    // Dates — offset from base by activity index for realistic sequence
    const dayOffset = Math.floor(i * 0.5) + rng.int(0, 10);
    const startMs = baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000;
    const endMs = startMs + originalDuration * 24 * 60 * 60 * 1000;

    const plannedStart = new Date(startMs).toISOString();
    const plannedFinish = new Date(endMs).toISOString();
    const baselineStart = plannedStart;
    const baselineFinish = plannedFinish;

    // Variance
    const startVariance = rng.int(-5, 15);
    const finishVariance = rng.int(-5, 20);

    // Actual dates for completed/in-progress
    const actualStart = status !== 'Not Started'
      ? new Date(startMs + startVariance * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const actualFinish = status === 'Completed'
      ? new Date(endMs + finishVariance * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Float — critical path items have 0 or negative float
    const isCritical = rng.bool(0.12); // ~12% critical
    const remainingFloat = isCritical ? rng.int(-5, 0) : rng.int(1, 60);
    const freeFloat = isCritical ? 0 : rng.int(0, remainingFloat);

    // Predecessors & successors (1-3 each, referencing nearby activities)
    const numPreds = Math.min(rng.int(0, 3), i);
    const predecessors: string[] = [];
    for (let p = 0; p < numPreds; p++) {
      const predIdx = Math.max(0, i - rng.int(1, Math.min(20, i)));
      if (!predecessors.includes(taskCodes[predIdx])) {
        predecessors.push(taskCodes[predIdx]);
      }
    }

    const numSuccs = rng.int(0, 3);
    const successors: string[] = [];
    const successorDetails: { taskCode: string; relationshipType: RelationshipType; lag: number }[] = [];
    for (let s = 0; s < numSuccs; s++) {
      const succIdx = Math.min(count - 1, i + rng.int(1, 20));
      if (succIdx !== i && !successors.includes(taskCodes[succIdx])) {
        const relType = rng.choice(['FS', 'FF', 'SS', 'SF'] as readonly RelationshipType[]);
        successors.push(taskCodes[succIdx]);
        successorDetails.push({
          taskCode: taskCodes[succIdx],
          relationshipType: relType,
          lag: rng.bool(0.8) ? 0 : rng.int(-2, 5),
        });
      }
    }

    activities.push({
      id: i + 1,
      projectCode,
      importId: 1,
      taskCode,
      wbsCode,
      activityName: `${activityName} - ${prefix}`,
      activityType: 'Task Dependent',
      status,
      originalDuration,
      remainingDuration,
      actualDuration,
      baselineStartDate: baselineStart,
      baselineFinishDate: baselineFinish,
      plannedStartDate: plannedStart,
      plannedFinishDate: plannedFinish,
      actualStartDate: actualStart,
      actualFinishDate: actualFinish,
      remainingFloat,
      freeFloat,
      predecessors,
      successors,
      successorDetails,
      resources: rng.bool(0.4) ? rng.choice(['Crew A', 'Crew B', 'Crew C', 'Subcontractor']) : '',
      calendarName: rng.choice(CALENDAR_NAMES),
      primaryConstraint: rng.bool(0.1) ? 'Start On Or After' : '',
      secondaryConstraint: '',
      isCritical,
      percentComplete,
      startVarianceDays: status !== 'Not Started' ? startVariance : null,
      finishVarianceDays: status === 'Completed' ? finishVariance : null,
      deleteFlag: false,
      createdDate: randomDate(rng, 2025, 2025),
      modifiedDate: randomDate(rng, 2025, 2026),
    });
  }

  return activities;
}
