import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IRiskCostManagement, IRiskCostItem } from '../../models/IRiskCostManagement';

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
  const { dataService } = useAppContext();
  const [data, setData] = React.useState<IRiskCostManagement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getRiskCostManagement(projectCode);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk/cost data');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const updateContractInfo = React.useCallback(async (projectCode: string, contractType: string, contractAmount: number) => {
    const updated = await dataService.updateRiskCostManagement(projectCode, { contractType, contractAmount });
    setData(updated);
  }, [dataService]);

  const addItem = React.useCallback(async (projectCode: string, item: Partial<IRiskCostItem>) => {
    const created = await dataService.addRiskCostItem(projectCode, item);
    const refreshed = await dataService.getRiskCostManagement(projectCode);
    setData(refreshed);
    return created;
  }, [dataService]);

  const updateItem = React.useCallback(async (projectCode: string, itemId: number, itemData: Partial<IRiskCostItem>) => {
    const updated = await dataService.updateRiskCostItem(projectCode, itemId, itemData);
    const refreshed = await dataService.getRiskCostManagement(projectCode);
    setData(refreshed);
    return updated;
  }, [dataService]);

  return { data, isLoading, error, fetchData, updateContractInfo, addItem, updateItem };
}
