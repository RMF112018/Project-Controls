import { queryOptions } from '@tanstack/react-query';
import type { IRiskCostManagement, IDataService } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function riskCostManagementOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IRiskCostManagement | null>({
    queryKey: qk.riskCost.byProject(scope, projectCode),
    queryFn: async () => dataService.getRiskCostManagement(projectCode),
    staleTime: QUERY_STALE_TIMES.riskCost,
    enabled: !!projectCode,
  });
}
