import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IMarketingProjectRecord, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { marketingAllRecordsOptions, marketingRecordOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

interface IUseMarketingRecordResult {
  record: IMarketingProjectRecord | null;
  allRecords: IMarketingProjectRecord[];
  isLoading: boolean;
  error: string | null;
  fetchRecord: (projectCode: string) => Promise<void>;
  fetchAllRecords: () => Promise<void>;
  updateRecord: (projectCode: string, data: Partial<IMarketingProjectRecord>) => Promise<IMarketingProjectRecord>;
  createRecord: (data: Partial<IMarketingProjectRecord>) => Promise<IMarketingProjectRecord>;
}

export function useMarketingRecord(): IUseMarketingRecordResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');
  const [fetchAll, setFetchAll] = React.useState(false);

  const recordQuery = useQuery({
    ...marketingRecordOptions(scope, dataService, projectCode),
    enabled: !!projectCode,
  });

  const allRecordsQuery = useQuery({
    ...marketingAllRecordsOptions(scope, dataService),
    enabled: fetchAll,
  });

  const record = recordQuery.data ?? null;
  const allRecords = allRecordsQuery.data ?? [];
  const isLoading = recordQuery.isLoading || allRecordsQuery.isLoading;
  const error = recordQuery.error?.message ?? allRecordsQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.ProjectRecord,
    queryKeys: React.useMemo(() => [qk.marketing.base(scope)], [scope]),
  });

  const broadcastRecordChange = React.useCallback((
    recordId: string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.ProjectRecord,
      entityId: recordId,
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const fetchRecord = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const fetchAllRecords = React.useCallback(async () => {
    setFetchAll(true);
    await queryClient.invalidateQueries({ queryKey: qk.marketing.all(scope) });
  }, [queryClient, scope]);

  const updateRecord = React.useCallback(async (code: string, data: Partial<IMarketingProjectRecord>) => {
    const updated = await dataService.updateMarketingProjectRecord(code, data);
    broadcastRecordChange(code, 'updated', 'Marketing record updated');
    await queryClient.invalidateQueries({ queryKey: qk.marketing.base(scope) });
    return updated;
  }, [dataService, broadcastRecordChange, queryClient, scope]);

  const createRecord = React.useCallback(async (data: Partial<IMarketingProjectRecord>) => {
    const created = await dataService.createMarketingProjectRecord(data);
    broadcastRecordChange(created.projectCode, 'created', 'Marketing record created');
    await queryClient.invalidateQueries({ queryKey: qk.marketing.base(scope) });
    return created;
  }, [dataService, broadcastRecordChange, queryClient, scope]);

  return { record, allRecords, isLoading, error, fetchRecord, fetchAllRecords, updateRecord, createRecord };
}
