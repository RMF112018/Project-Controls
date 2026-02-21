import { queryOptions } from '@tanstack/react-query';
import type {
  ICloseoutItem,
  ISuperintendentPlan,
  ILessonLearned,
  IQualityConcern,
  ISafetyConcern,
  IMarketingProjectRecord,
  IActionInboxItem,
  IDataService,
} from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function closeoutItemsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<ICloseoutItem[]>({
    queryKey: qk.closeout.byProject(scope, projectCode),
    queryFn: async () => dataService.getCloseoutItems(projectCode),
    staleTime: QUERY_STALE_TIMES.closeout,
    enabled: !!projectCode,
  });
}

export function superintendentPlanOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<ISuperintendentPlan | null>({
    queryKey: qk.superintendent.byProject(scope, projectCode),
    queryFn: async () => dataService.getSuperintendentPlan(projectCode),
    staleTime: QUERY_STALE_TIMES.projectOperational,
    enabled: !!projectCode,
  });
}

export function lessonsLearnedOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<ILessonLearned[]>({
    queryKey: qk.lessonsLearned.byProject(scope, projectCode),
    queryFn: async () => dataService.getLessonsLearned(projectCode),
    staleTime: QUERY_STALE_TIMES.projectOperational,
    enabled: !!projectCode,
  });
}

export function qualityConcernsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IQualityConcern[]>({
    queryKey: qk.qualityConcerns.byProject(scope, projectCode),
    queryFn: async () => dataService.getQualityConcerns(projectCode),
    staleTime: QUERY_STALE_TIMES.projectOperational,
    enabled: !!projectCode,
  });
}

export function safetyConcernsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<ISafetyConcern[]>({
    queryKey: qk.safetyConcerns.byProject(scope, projectCode),
    queryFn: async () => dataService.getSafetyConcerns(projectCode),
    staleTime: QUERY_STALE_TIMES.projectOperational,
    enabled: !!projectCode,
  });
}

export function marketingAllRecordsOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IMarketingProjectRecord[]>({
    queryKey: qk.marketing.all(scope),
    queryFn: async () => dataService.getAllMarketingProjectRecords(),
    staleTime: QUERY_STALE_TIMES.projectOperational,
  });
}

export function marketingRecordOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IMarketingProjectRecord | null>({
    queryKey: qk.marketing.byProject(scope, projectCode),
    queryFn: async () => dataService.getMarketingProjectRecord(projectCode),
    staleTime: QUERY_STALE_TIMES.projectOperational,
    enabled: !!projectCode,
  });
}

export function actionInboxOptions(
  scope: IQueryScope,
  dataService: IDataService,
  userEmail: string
) {
  return queryOptions<IActionInboxItem[]>({
    queryKey: qk.actionInbox.items(scope, userEmail),
    queryFn: async () => dataService.getActionItems(userEmail),
    staleTime: QUERY_STALE_TIMES.actionInbox,
    enabled: !!userEmail,
  });
}
