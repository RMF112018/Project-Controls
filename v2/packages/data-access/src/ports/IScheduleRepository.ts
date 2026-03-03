import type {
  IScheduleActivity,
  IScheduleImport,
  IScheduleMetrics,
  IProjectScheduleCriticalPath,
  ICriticalPathItem,
} from '@hbc/models';

/**
 * Schedule repository — activities, imports, metrics, critical path.
 */
export interface IScheduleRepository {
  getActivities(projectCode: string): Promise<IScheduleActivity[]>;
  importActivities(projectCode: string, activities: IScheduleActivity[], importMeta: Partial<IScheduleImport>): Promise<IScheduleActivity[]>;
  updateActivity(projectCode: string, activityId: number, data: Partial<IScheduleActivity>): Promise<IScheduleActivity>;
  deleteActivity(projectCode: string, activityId: number): Promise<void>;
  getImports(projectCode: string): Promise<IScheduleImport[]>;
  getMetrics(projectCode: string): Promise<IScheduleMetrics>;

  // Critical Path
  getProjectSchedule(projectCode: string): Promise<IProjectScheduleCriticalPath | null>;
  updateProjectSchedule(projectCode: string, data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath>;
  addCriticalPathItem(projectCode: string, item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem>;
}
