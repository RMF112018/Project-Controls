import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  type InfiniteData,
} from '@tanstack/react-query';
import type { ICursorPageResult, ICursorToken } from '@hbc/sp-services';

export interface IUseInfiniteSharePointListConfig<TItem, TAll = TItem[]> {
  enabled?: boolean;
  infiniteEnabled: boolean;
  queryKey: ReadonlyArray<unknown>;
  pageSize?: number;
  fetchPage: (args: { token: ICursorToken | null; pageSize: number }) => Promise<ICursorPageResult<TItem>>;
  fetchAll: () => Promise<TAll>;
  staleTime?: number;
}

export type InfiniteModeResult<TItem> = {
  mode: 'infinite';
  infiniteQuery: UseInfiniteQueryResult<InfiniteData<ICursorPageResult<TItem>, ICursorToken | null>, Error>;
  fullQuery: null;
  isInfinite: true;
};

export type FullModeResult<TAll> = {
  mode: 'full';
  infiniteQuery: null;
  fullQuery: UseQueryResult<TAll, Error>;
  isInfinite: false;
};

export type IUseInfiniteSharePointListResult<TItem, TAll> =
  | InfiniteModeResult<TItem>
  | FullModeResult<TAll>;

export function useInfiniteSharePointList<TItem, TAll = TItem[]>(
  config: IUseInfiniteSharePointListConfig<TItem, TAll>
): IUseInfiniteSharePointListResult<TItem, TAll> {
  const {
    enabled = true,
    infiniteEnabled,
    queryKey,
    pageSize = 100,
    fetchPage,
    fetchAll,
    staleTime = 30_000,
  } = config;

  const fullQuery = useQuery<TAll, Error>({
    queryKey: [...queryKey, 'full'],
    queryFn: fetchAll,
    enabled: enabled && !infiniteEnabled,
    staleTime,
  });

  const infiniteQuery = useInfiniteQuery<ICursorPageResult<TItem>, Error, InfiniteData<ICursorPageResult<TItem>, ICursorToken | null>, ReadonlyArray<unknown>, ICursorToken | null>({
    queryKey,
    enabled: enabled && infiniteEnabled,
    initialPageParam: null,
    queryFn: ({ pageParam }) => fetchPage({ token: pageParam, pageSize }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextToken : undefined),
    staleTime,
  });

  if (!infiniteEnabled) {
    return {
      mode: 'full',
      fullQuery,
      infiniteQuery: null,
      isInfinite: false,
    };
  }

  return {
    mode: 'infinite',
    fullQuery: null,
    infiniteQuery,
    isInfinite: true,
  };
}
