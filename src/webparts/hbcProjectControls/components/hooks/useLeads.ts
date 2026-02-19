import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { ILead, ILeadFormData, Stage, IListQueryOptions, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useHbcOptimisticMutation } from '../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../tanstack/query/mutations/optimisticMutationFlags';

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
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const leadsCacheKey = React.useMemo(() => ['local', 'leads'] as const, []);

  const fetchLeads = React.useCallback(async (options?: IListQueryOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getLeads(options);
      setLeads(result.items);
      setTotalCount(result.totalCount);
      queryClient.setQueryData<ILead[]>(leadsCacheKey, result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, leadsCacheKey, queryClient]);

  // SignalR: refresh on Lead entity changes from other users
  useSignalR({
    entityType: EntityType.Lead,
    onEntityChanged: React.useCallback(() => { fetchLeads(); }, [fetchLeads]),
  });

  // Helper to broadcast lead changes
  const broadcastLeadChange = React.useCallback((
    leadId: number,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Lead,
      entityId: String(leadId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const fetchLeadsByStage = React.useCallback(async (stage: Stage) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getLeadsByStage(stage);
      setLeads(items);
      setTotalCount(items.length);
      queryClient.setQueryData<ILead[]>(leadsCacheKey, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, leadsCacheKey, queryClient]);

  const createLeadMutation = useHbcOptimisticMutation<ILead, ILeadFormData, ILead[]>({
    method: 'createLead',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.leads,
    mutationFn: async (data) => dataService.createLead(data),
    getStateKey: () => leadsCacheKey,
    applyOptimistic: (previous, data) => [{
      ...(data as Partial<ILead>),
      id: -Date.now(),
      Title: data.Title,
      ClientName: data.ClientName,
      Region: data.Region,
      Sector: data.Sector,
      Division: data.Division,
      Stage: data.Stage,
      Originator: currentUser?.displayName ?? 'Pending',
      DateOfEvaluation: new Date().toISOString(),
    } as ILead, ...(previous ?? [])],
    onOptimisticStateChange: (state) => {
      const next = state ?? [];
      setLeads(next);
      setTotalCount(next.length);
    },
    onSuccessEffects: async (lead) => {
      setLeads((prev) => [lead, ...prev.filter((item) => item.id > 0)]);
      setTotalCount((prev) => prev + 1);
      broadcastLeadChange(lead.id, 'created', 'Lead created');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: leadsCacheKey });
    },
  });

  const updateLeadMutation = useHbcOptimisticMutation<ILead, { id: number; data: Partial<ILead> }, ILead[]>({
    method: 'updateLead',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.leads,
    mutationFn: async ({ id, data }) => dataService.updateLead(id, data),
    getStateKey: () => leadsCacheKey,
    applyOptimistic: (previous, vars) => (previous ?? []).map((lead) => lead.id === vars.id ? { ...lead, ...vars.data } : lead),
    onOptimisticStateChange: (state) => setLeads(state ?? []),
    onSuccessEffects: async (updated, vars) => {
      setLeads((prev) => prev.map((lead) => lead.id === vars.id ? updated : lead));
      broadcastLeadChange(vars.id, 'updated', 'Lead updated');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: leadsCacheKey });
    },
  });

  const deleteLeadMutation = useHbcOptimisticMutation<void, number, ILead[]>({
    method: 'deleteLead',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.leads,
    mutationFn: async (id) => dataService.deleteLead(id),
    getStateKey: () => leadsCacheKey,
    applyOptimistic: (previous, id) => (previous ?? []).filter((lead) => lead.id !== id),
    onOptimisticStateChange: (state) => {
      const next = state ?? [];
      setLeads(next);
      setTotalCount(next.length);
    },
    onSuccessEffects: async (_result, id) => {
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      broadcastLeadChange(id, 'deleted', 'Lead deleted');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: leadsCacheKey });
    },
  });

  const createLead = React.useCallback(async (data: ILeadFormData): Promise<ILead> => {
    return createLeadMutation.mutateAsync(data);
  }, [createLeadMutation]);

  const updateLead = React.useCallback(async (id: number, data: Partial<ILead>): Promise<ILead> => {
    return updateLeadMutation.mutateAsync({ id, data });
  }, [updateLeadMutation]);

  const deleteLead = React.useCallback(async (id: number): Promise<void> => {
    await deleteLeadMutation.mutateAsync(id);
  }, [deleteLeadMutation]);

  const searchLeads = React.useCallback(async (query: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.searchLeads(query);
      setLeads(items);
      setTotalCount(items.length);
      queryClient.setQueryData<ILead[]>(leadsCacheKey, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, leadsCacheKey, queryClient]);

  const getLeadById = React.useCallback(async (id: number): Promise<ILead | null> => {
    return dataService.getLeadById(id);
  }, [dataService]);

  return { leads, totalCount, isLoading, error, fetchLeads, fetchLeadsByStage, createLead, updateLead, deleteLead, searchLeads, getLeadById };
}
