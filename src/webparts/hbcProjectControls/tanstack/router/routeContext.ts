import type { QueryClient } from '@tanstack/react-query';
import type { IDataService, ICurrentUser } from '@hbc/sp-services';
import type { IQueryScope } from '../query/queryKeys';

export interface ITanStackRouteContext {
  queryClient: QueryClient;
  dataService: IDataService;
  currentUser: ICurrentUser | null;
  activeProjectCode: string | null;
  scope: IQueryScope;
  isFeatureEnabled: (featureName: string) => boolean;
}
