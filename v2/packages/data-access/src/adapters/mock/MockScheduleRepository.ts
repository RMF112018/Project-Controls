import type { IScheduleActivity, IScheduleImport, IScheduleMetrics, IProjectScheduleCriticalPath, ICriticalPathItem } from '@hbc/models';
import type { IScheduleRepository } from '../../ports/IScheduleRepository';

export class MockScheduleRepository implements IScheduleRepository {
  async getActivities(_projectCode: string): Promise<IScheduleActivity[]> { return []; }
  async importActivities(_projectCode: string, activities: IScheduleActivity[], _importMeta: Partial<IScheduleImport>): Promise<IScheduleActivity[]> { return activities; }
  async updateActivity(_projectCode: string, _activityId: number, _data: Partial<IScheduleActivity>): Promise<IScheduleActivity> { throw new Error('Not implemented'); }
  async deleteActivity(_projectCode: string, _activityId: number): Promise<void> {}
  async getImports(_projectCode: string): Promise<IScheduleImport[]> { return []; }
  async getMetrics(_projectCode: string): Promise<IScheduleMetrics> { return { totalActivities: 0, completedCount: 0, inProgressCount: 0, notStartedCount: 0, percentComplete: 0, criticalActivityCount: 0, negativeFloatCount: 0, averageFloat: 0, spiApproximation: null, floatDistribution: { negative: 0, zero: 0, low: 0, medium: 0, high: 0 }, negativeFloatPercent: 0, cpiApproximation: null, constraintAnalysis: { totalConstrained: 0, byType: {} }, earnedValueMetrics: { plannedDuration: 0, earnedDuration: 0, actualDuration: 0, bac: 0, ev: 0, pv: 0, sv: 0, spi: null, cpi: null }, logicMetrics: { totalRelationships: 0, avgPredecessors: 0, avgSuccessors: 0, openEnds: { noSuccessor: 0, noPredecessor: 0 }, relationshipTypes: {} } }; }
  async getProjectSchedule(_projectCode: string): Promise<IProjectScheduleCriticalPath | null> { return null; }
  async updateProjectSchedule(_projectCode: string, _data: Partial<IProjectScheduleCriticalPath>): Promise<IProjectScheduleCriticalPath> { throw new Error('Not implemented'); }
  async addCriticalPathItem(_projectCode: string, _item: Partial<ICriticalPathItem>): Promise<ICriticalPathItem> { throw new Error('Not implemented'); }
}
