import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IRiskCostManagement, IRiskCostItem, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { riskCostManagementOptions } from '../../tanstack/query/queryOptions/riskCost';
import { qk } from '../../tanstack/query/queryKeys';

interface IUseRiskCostManagementResult {
  data: IRiskCostManagement | null;
  isLoading: boolean;
  error: string | null;
  fetchData: (projectCode: string) => Promise<void>;
  updateContractInfo: (projectCode: string, contractType: string, contractAmount: number) => Promise<void>;
  addItem: (projectCode: string, item: Partial<IRiskCostItem>) => Promise<IRiskCostItem>;
  updateItem: (projectCode: string, itemId: number, data: Partial<IRiskCostItem>) => Promise<IRiskCostItem>;
}

export function useRiskCostManagement(): IUseRiskCostManagementResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const riskCostQuery = useQuery(riskCostManagementOptions(scope, dataService, projectCode));

  const data = riskCostQuery.data ?? null;
  const isLoading = riskCostQuery.isLoading;
  const error = riskCostQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.RiskCost,
    queryKeys: React.useMemo(() => projectCode ? [qk.riskCost.byProject(scope, projectCode)] : [], [scope, projectCode]),
    projectCode,
  });

  const broadcastRiskCostChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.RiskCost,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const fetchData = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const updateContractInfo = React.useCallback(async (code: string, contractType: string, contractAmount: number) => {
    await dataService.updateRiskCostManagement(code, { contractType, contractAmount });
    broadcastRiskCostChange('contract', 'updated', 'Contract info updated');
    await queryClient.invalidateQueries({ queryKey: qk.riskCost.byProject(scope, code) });
  }, [dataService, broadcastRiskCostChange, queryClient, scope]);

  const addItem = React.useCallback(async (code: string, item: Partial<IRiskCostItem>) => {
    const created = await dataService.addRiskCostItem(code, item);
    broadcastRiskCostChange(created.id, 'created', 'Risk/cost item added');
    dataService.syncToDataMart(code).catch(() => { /* silent */ });
    await queryClient.invalidateQueries({ queryKey: qk.riskCost.byProject(scope, code) });
    return created;
  }, [dataService, broadcastRiskCostChange, queryClient, scope]);

  const updateItem = React.useCallback(async (code: string, itemId: number, itemData: Partial<IRiskCostItem>) => {
    const updated = await dataService.updateRiskCostItem(code, itemId, itemData);
    broadcastRiskCostChange(itemId, 'updated', 'Risk/cost item updated');
    dataService.syncToDataMart(code).catch(() => { /* silent */ });
    await queryClient.invalidateQueries({ queryKey: qk.riskCost.byProject(scope, code) });
    return updated;
  }, [dataService, broadcastRiskCostChange, queryClient, scope]);

  return { data, isLoading, error, fetchData, updateContractInfo, addItem, updateItem };
}
