import type { DefaultOptions } from '@tanstack/react-query';

/**
 * Default TanStack Query options for the HBC application.
 *
 * - staleTime: 5 minutes (SharePoint data doesn't change rapidly)
 * - gcTime: 30 minutes (keep cache warm for navigation)
 * - retry: 2 attempts with exponential backoff
 * - refetchOnWindowFocus: false (prevent surprising refetches)
 */
export const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  },
  mutations: {
    retry: 1,
  },
};
