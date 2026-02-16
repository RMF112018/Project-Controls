import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IRiskCostManagement, IRiskCostItem, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

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
  const [data, setData] = React.useState<IRiskCostManagement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchData = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getRiskCostManagement(projectCode);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk/cost data');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on RiskCost entity changes from other users
  useSignalR({
    entityType: EntityType.RiskCost,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchData(lastProjectCodeRef.current);
      }
    }, [fetchData]),
  });

  // Helper to broadcast risk/cost changes
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
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updateContractInfo = React.useCallback(async (projectCode: string, contractType: string, contractAmount: number) => {
    const updated = await dataService.updateRiskCostManagement(projectCode, { contractType, contractAmount });
    setData(updated);
    broadcastRiskCostChange('contract', 'updated', 'Contract info updated');
  }, [dataService, broadcastRiskCostChange]);

  const addItem = React.useCallback(async (projectCode: string, item: Partial<IRiskCostItem>) => {
    const created = await dataService.addRiskCostItem(projectCode, item);
    const refreshed = await dataService.getRiskCostManagement(projectCode);
    setData(refreshed);
    broadcastRiskCostChange(created.id, 'created', 'Risk/cost item added');
    // Fire-and-forget — sync Data Mart after risk/cost item added
    dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
    return created;
  }, [dataService, broadcastRiskCostChange]);

  const updateItem = React.useCallback(async (projectCode: string, itemId: number, itemData: Partial<IRiskCostItem>) => {
    const updated = await dataService.updateRiskCostItem(projectCode, itemId, itemData);
    const refreshed = await dataService.getRiskCostManagement(projectCode);
    setData(refreshed);
    broadcastRiskCostChange(itemId, 'updated', 'Risk/cost item updated');
    // Fire-and-forget — sync Data Mart after risk/cost item updated
    dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
    return updated;
  }, [dataService, broadcastRiskCostChange]);

  return { data, isLoading, error, fetchData, updateContractInfo, addItem, updateItem };
}
