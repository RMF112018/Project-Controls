import { QueryClient } from '@tanstack/react-query';
import { QUERY_GC_TIME, QUERY_STALE_TIMES } from './cachePolicies';

let queryClientSingleton: QueryClient | null = null;

interface IQueryProfileEvent {
  kind: 'query' | 'mutation';
  key: string;
  status: string;
  durationMs: number;
  ts: string;
}

function isQueryProfilingEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.location.hostname === 'localhost'
    && window.localStorage.getItem('showQueryProfiler') === 'true'
  );
}

function captureQueryProfileEvent(event: IQueryProfileEvent): void {
  if (typeof window === 'undefined') {
    return;
  }

  const target = window as Window & { __hbcQueryProfileEvents__?: IQueryProfileEvent[] };
  const nextEvents = [...(target.__hbcQueryProfileEvents__ ?? []), event];
  target.__hbcQueryProfileEvents__ = nextEvents.slice(-400);
}

function attachQueryProfiler(client: QueryClient): void {
  const queryStartTimes = new Map<string, number>();
  const mutationStartTimes = new Map<number, number>();

  client.getQueryCache().subscribe((event) => {
    if (!event?.query) {
      return;
    }

    const hash = event.query.queryHash;
    const key = JSON.stringify(event.query.queryKey);
    const now = performance.now();
    const isFetching = event.query.state.fetchStatus === 'fetching';

    if (isFetching && !queryStartTimes.has(hash)) {
      queryStartTimes.set(hash, now);
      return;
    }

    const startedAt = queryStartTimes.get(hash);
    if (!startedAt || isFetching) {
      return;
    }

    queryStartTimes.delete(hash);
    const durationMs = Math.round((now - startedAt) * 100) / 100;
    captureQueryProfileEvent({
      kind: 'query',
      key,
      status: event.query.state.status,
      durationMs,
      ts: new Date().toISOString(),
    });
  });

  client.getMutationCache().subscribe((event) => {
    if (!event?.mutation) {
      return;
    }

    const mutationId = event.mutation.mutationId;
    const key = JSON.stringify(event.mutation.options.mutationKey ?? ['anonymous-mutation']);
    const now = performance.now();
    const isPending = event.mutation.state.status === 'pending';

    if (isPending && !mutationStartTimes.has(mutationId)) {
      mutationStartTimes.set(mutationId, now);
      return;
    }

    const startedAt = mutationStartTimes.get(mutationId);
    if (!startedAt || isPending) {
      return;
    }

    mutationStartTimes.delete(mutationId);
    const durationMs = Math.round((now - startedAt) * 100) / 100;
    captureQueryProfileEvent({
      kind: 'mutation',
      key,
      status: event.mutation.state.status,
      durationMs,
      ts: new Date().toISOString(),
    });
  });
}

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

  if (isQueryProfilingEnabled()) {
    attachQueryProfiler(queryClientSingleton);
  }

  return queryClientSingleton;
}
