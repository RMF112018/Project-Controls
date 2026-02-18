import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EntityType } from '@hbc/sp-services';
import { useSignalR } from '../../components/hooks/useSignalR';

export interface IUseSignalRQueryInvalidationOptions {
  entityType: EntityType;
  queryKeys: ReadonlyArray<ReadonlyArray<unknown>>;
  projectCode?: string;
  onInvalidated?: () => void;
}

export function useSignalRQueryInvalidation(options: IUseSignalRQueryInvalidationOptions): void {
  const queryClient = useQueryClient();
  const { entityType, queryKeys, projectCode, onInvalidated } = options;

  useSignalR({
    entityType,
    projectCode,
    onEntityChanged: React.useCallback(() => {
      queryKeys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
      onInvalidated?.();
    }, [queryClient, queryKeys, onInvalidated]),
  });
}
