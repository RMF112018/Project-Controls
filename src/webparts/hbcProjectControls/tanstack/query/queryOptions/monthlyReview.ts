import { queryOptions } from '@tanstack/react-query';
import type { IMonthlyProjectReview, IDataService } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function monthlyReviewsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IMonthlyProjectReview[]>({
    queryKey: qk.monthlyReview.byProject(scope, projectCode),
    queryFn: async () => dataService.getMonthlyReviews(projectCode),
    staleTime: QUERY_STALE_TIMES.monthlyReview,
    enabled: !!projectCode,
  });
}
