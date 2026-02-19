import { EntityType } from '@hbc/sp-services';

export const SIGNALR_INVALIDATION_GROUPS: Record<string, string[]> = {
  [EntityType.Project]: ['activeProjects'],
  [EntityType.DataMart]: ['activeProjects', 'dataMart'],
  [EntityType.ScheduleActivity]: ['schedule'],
  [EntityType.ScheduleFieldLink]: ['schedule'],
  [EntityType.ScheduleReconciliation]: ['schedule'],
};
