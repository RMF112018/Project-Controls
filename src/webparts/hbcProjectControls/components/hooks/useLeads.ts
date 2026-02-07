import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ILead, ILeadFormData, Stage } from '../../models';
import { IPagedResult, IListQueryOptions } from '../../services/IDataService';

interface IUseLeadsResult {
  leads: ILead[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  fetchLeads: (options?: IListQueryOptions) => Promise<void>;
  fetchLeadsByStage: (stage: Stage) => Promise<void>;
  createLead: (data: ILeadFormData) => Promise<ILead>;
  updateLead: (id: number, data: Partial<ILead>) => Promise<ILead>;
  deleteLead: (id: number) => Promise<void>;
  searchLeads: (query: string) => Promise<void>;
  getLeadById: (id: number) => Promise<ILead | null>;
}

export function useLeads(): IUseLeadsResult {
  const { dataService } = useAppContext();
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLeads = React.useCallback(async (options?: IListQueryOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getLeads(options);
      setLeads(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchLeadsByStage = React.useCallback(async (stage: Stage) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getLeadsByStage(stage);
      setLeads(items);
      setTotalCount(items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const createLead = React.useCallback(async (data: ILeadFormData): Promise<ILead> => {
    const lead = await dataService.createLead(data);
    setLeads(prev => [lead, ...prev]);
    setTotalCount(prev => prev + 1);
    return lead;
  }, [dataService]);

  const updateLead = React.useCallback(async (id: number, data: Partial<ILead>): Promise<ILead> => {
    const updated = await dataService.updateLead(id, data);
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  }, [dataService]);

  const deleteLead = React.useCallback(async (id: number): Promise<void> => {
    await dataService.deleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    setTotalCount(prev => prev - 1);
  }, [dataService]);

  const searchLeads = React.useCallback(async (query: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.searchLeads(query);
      setLeads(items);
      setTotalCount(items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const getLeadById = React.useCallback(async (id: number): Promise<ILead | null> => {
    return dataService.getLeadById(id);
  }, [dataService]);

  return { leads, totalCount, isLoading, error, fetchLeads, fetchLeadsByStage, createLead, updateLead, deleteLead, searchLeads, getLeadById };
}
