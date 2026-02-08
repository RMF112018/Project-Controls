import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IEstimatingKickoff, IEstimatingKickoffItem } from '../../models/IEstimatingKickoff';

interface IUseEstimatingKickoffResult {
  kickoff: IEstimatingKickoff | null;
  isLoading: boolean;
  error: string | null;
  fetchKickoff: (projectCode: string) => Promise<void>;
  fetchKickoffByLeadId: (leadId: number) => Promise<void>;
  createKickoff: (leadId: number, projectCode: string) => Promise<IEstimatingKickoff>;
  updateKickoff: (data: Partial<IEstimatingKickoff>) => Promise<void>;
  updateItem: (itemId: number, data: Partial<IEstimatingKickoffItem>) => Promise<void>;
  addItem: (item: Partial<IEstimatingKickoffItem>) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

export function useEstimatingKickoff(): IUseEstimatingKickoffResult {
  const { dataService } = useAppContext();
  const [kickoff, setKickoff] = React.useState<IEstimatingKickoff | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchKickoff = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getEstimatingKickoff(projectCode);
      setKickoff(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kickoff');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchKickoffByLeadId = React.useCallback(async (leadId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getEstimatingKickoffByLeadId(leadId);
      setKickoff(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kickoff');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const createKickoff = React.useCallback(async (leadId: number, projectCode: string) => {
    const created = await dataService.createEstimatingKickoff({ LeadID: leadId, ProjectCode: projectCode });
    setKickoff(created);
    return created;
  }, [dataService]);

  const updateKickoff = React.useCallback(async (data: Partial<IEstimatingKickoff>) => {
    if (!kickoff) return;
    const updated = await dataService.updateEstimatingKickoff(kickoff.id, data);
    setKickoff(updated);
  }, [dataService, kickoff]);

  const updateItem = React.useCallback(async (itemId: number, data: Partial<IEstimatingKickoffItem>) => {
    if (!kickoff) return;
    const updatedItem = await dataService.updateKickoffItem(kickoff.id, itemId, data);
    setKickoff(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? updatedItem : i),
      };
    });
  }, [dataService, kickoff]);

  const addItem = React.useCallback(async (item: Partial<IEstimatingKickoffItem>) => {
    if (!kickoff) return;
    const newItem = await dataService.addKickoffItem(kickoff.id, item);
    setKickoff(prev => prev ? { ...prev, items: [...prev.items, newItem] } : prev);
  }, [dataService, kickoff]);

  const removeItem = React.useCallback(async (itemId: number) => {
    if (!kickoff) return;
    await dataService.removeKickoffItem(kickoff.id, itemId);
    setKickoff(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev);
  }, [dataService, kickoff]);

  return {
    kickoff,
    isLoading,
    error,
    fetchKickoff,
    fetchKickoffByLeadId,
    createKickoff,
    updateKickoff,
    updateItem,
    addItem,
    removeItem,
  };
}
