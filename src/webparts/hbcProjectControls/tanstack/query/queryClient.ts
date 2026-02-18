import { QueryClient } from '@tanstack/react-query';
import { QUERY_GC_TIME, QUERY_STALE_TIMES } from './cachePolicies';

let queryClientSingleton: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (queryClientSingleton) return queryClientSingleton;

  queryClientSingleton = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIMES.projectOperational,
        gcTime: QUERY_GC_TIME,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  return queryClientSingleton;
}
