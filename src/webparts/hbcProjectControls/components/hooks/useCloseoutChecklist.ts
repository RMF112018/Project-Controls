import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { ICloseoutItem, IStartupChecklistSummary, ChecklistStatus, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { closeoutItemsOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

interface IUseCloseoutChecklistResult {
  items: ICloseoutItem[];
  isLoading: boolean;
  error: string | null;
  fetchChecklist: (projectCode: string) => Promise<void>;
  updateItem: (projectCode: string, itemId: number, data: Partial<ICloseoutItem>) => Promise<ICloseoutItem>;
  addItem: (projectCode: string, item: Partial<ICloseoutItem>) => Promise<ICloseoutItem>;
  removeItem: (projectCode: string, itemId: number) => Promise<void>;
  getSummary: () => IStartupChecklistSummary;
  getSectionSummary: (sectionNumber: number) => IStartupChecklistSummary;
}

export function useCloseoutChecklist(): IUseCloseoutChecklistResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const closeoutQuery = useQuery(closeoutItemsOptions(scope, dataService, projectCode));

  const items = closeoutQuery.data ?? [];
  const isLoading = closeoutQuery.isLoading;
  const error = closeoutQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.Closeout,
    queryKeys: React.useMemo(() => projectCode ? [qk.closeout.byProject(scope, projectCode)] : [], [scope, projectCode]),
  });

  const broadcastCloseoutChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Closeout,
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
    await queryClient.invalidateQueries({ queryKey: qk.closeout.byProject(scope, code) });
  }, [queryClient, scope]);

  const fetchChecklist = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const updateItem = React.useCallback(async (code: string, itemId: number, data: Partial<ICloseoutItem>) => {
    const updated = await dataService.updateCloseoutItem(itemId, data);
    broadcastCloseoutChange(itemId, 'updated', 'Closeout item updated');
    await invalidate(code);
    return updated;
  }, [dataService, broadcastCloseoutChange, invalidate]);

  const addItem = React.useCallback(async (code: string, item: Partial<ICloseoutItem>) => {
    const created = await dataService.addCloseoutItem(code, item);
    broadcastCloseoutChange(created.id, 'created', 'Closeout item added');
    await invalidate(code);
    return created;
  }, [dataService, broadcastCloseoutChange, invalidate]);

  const removeItem = React.useCallback(async (code: string, itemId: number) => {
    await dataService.removeCloseoutItem(code, itemId);
    broadcastCloseoutChange(itemId, 'deleted', 'Closeout item removed');
    await invalidate(code);
  }, [dataService, broadcastCloseoutChange, invalidate]);

  const computeSummary = React.useCallback((subset: ICloseoutItem[]): IStartupChecklistSummary => {
    return {
      total: subset.length,
      conforming: subset.filter(i => (i.status as ChecklistStatus) === 'Conforming').length,
      deficient: subset.filter(i => (i.status as ChecklistStatus) === 'Deficient').length,
      na: subset.filter(i => (i.status as ChecklistStatus) === 'NA').length,
      neutral: subset.filter(i => (i.status as ChecklistStatus) === 'Neutral').length,
      noResponse: subset.filter(i => (i.status as ChecklistStatus) === 'NoResponse').length,
    };
  }, []);

  const getSummary = React.useCallback(() => computeSummary(items), [items, computeSummary]);
  const getSectionSummary = React.useCallback((sectionNumber: number) => {
    return computeSummary(items.filter(i => i.sectionNumber === sectionNumber));
  }, [items, computeSummary]);

  return { items, isLoading, error, fetchChecklist, updateItem, addItem, removeItem, getSummary, getSectionSummary };
}
