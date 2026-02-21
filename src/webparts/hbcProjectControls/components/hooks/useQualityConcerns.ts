import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IQualityConcern, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { qualityConcernsOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

interface IUseQualityConcernsResult {
  concerns: IQualityConcern[];
  isLoading: boolean;
  error: string | null;
  fetchConcerns: (projectCode: string) => Promise<void>;
  addConcern: (projectCode: string, concern: Partial<IQualityConcern>) => Promise<IQualityConcern>;
  updateConcern: (projectCode: string, concernId: number, data: Partial<IQualityConcern>) => Promise<IQualityConcern>;
  openCount: number;
  resolvedCount: number;
}

export function useQualityConcerns(): IUseQualityConcernsResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const qualityQuery = useQuery(qualityConcernsOptions(scope, dataService, projectCode));

  const concerns = qualityQuery.data ?? [];
  const isLoading = qualityQuery.isLoading;
  const error = qualityQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.Quality,
    queryKeys: React.useMemo(() => projectCode ? [qk.qualityConcerns.byProject(scope, projectCode)] : [], [scope, projectCode]),
  });

  const broadcastQualityChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Quality,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const invalidate = React.useCallback(async (code: string) => {
    await queryClient.invalidateQueries({ queryKey: qk.qualityConcerns.byProject(scope, code) });
  }, [queryClient, scope]);

  const fetchConcerns = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const addConcern = React.useCallback(async (code: string, concern: Partial<IQualityConcern>) => {
    const created = await dataService.addQualityConcern(code, concern);
    broadcastQualityChange(created.id, 'created', 'Quality concern added');
    await invalidate(code);
    return created;
  }, [dataService, broadcastQualityChange, invalidate]);

  const updateConcern = React.useCallback(async (code: string, concernId: number, data: Partial<IQualityConcern>) => {
    const updated = await dataService.updateQualityConcern(code, concernId, data);
    broadcastQualityChange(concernId, 'updated', 'Quality concern updated');
    await invalidate(code);
    return updated;
  }, [dataService, broadcastQualityChange, invalidate]);

  const openCount = React.useMemo(() => concerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length, [concerns]);
  const resolvedCount = React.useMemo(() => concerns.filter(c => c.status === 'Resolved' || c.status === 'Closed').length, [concerns]);

  return { concerns, isLoading, error, fetchConcerns, addConcern, updateConcern, openCount, resolvedCount };
}
