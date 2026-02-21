import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { ILead, ILeadFormData, Stage, IListQueryOptions, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useHbcOptimisticMutation } from '../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../tanstack/query/mutations/optimisticMutationFlags';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { leadsListOptions, leadsByStageOptions, leadsSearchOptions } from '../../tanstack/query/queryOptions/leads';
import { qk } from '../../tanstack/query/queryKeys';

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

type FetchMode =
  | { type: 'list'; options?: IListQueryOptions }
  | { type: 'stage'; stage: Stage }
  | { type: 'search'; query: string };

export function useLeads(): IUseLeadsResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();

  // Track which query variant is active so the correct data is surfaced
  const [fetchMode, setFetchMode] = React.useState<FetchMode>({ type: 'list' });

  // Primary list query — enabled when mode is 'list'
  const listQuery = useQuery({
    ...leadsListOptions(scope, dataService, fetchMode.type === 'list' ? fetchMode.options : undefined),
    enabled: fetchMode.type === 'list',
  });

  // Stage query
  const stageQuery = useQuery({
    ...leadsByStageOptions(scope, dataService, fetchMode.type === 'stage' ? fetchMode.stage : '' as Stage),
    enabled: fetchMode.type === 'stage',
  });

  // Search query
  const searchQuery = useQuery({
    ...leadsSearchOptions(scope, dataService, fetchMode.type === 'search' ? fetchMode.query : ''),
    enabled: fetchMode.type === 'search' && (fetchMode.type === 'search' && fetchMode.query.length > 0),
  });

  // Derive active query data based on mode
  const { leads, totalCount, isLoading, error } = React.useMemo(() => {
    if (fetchMode.type === 'list') {
      return {
        leads: listQuery.data?.items ?? [],
        totalCount: listQuery.data?.totalCount ?? 0,
        isLoading: listQuery.isLoading,
        error: listQuery.error?.message ?? null,
      };
    }
    if (fetchMode.type === 'stage') {
      const items = stageQuery.data ?? [];
      return {
        leads: items,
        totalCount: items.length,
        isLoading: stageQuery.isLoading,
        error: stageQuery.error?.message ?? null,
      };
    }
    // search
    const items = searchQuery.data ?? [];
    return {
      leads: items,
      totalCount: items.length,
      isLoading: searchQuery.isLoading,
      error: searchQuery.error?.message ?? null,
    };
  }, [fetchMode, listQuery, stageQuery, searchQuery]);

  // SignalR: invalidate all leads queries on entity changes
  useSignalRQueryInvalidation({
    entityType: EntityType.Lead,
    queryKeys: React.useMemo(() => [qk.leads.base(scope)], [scope]),
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

  const fetchLeads = React.useCallback(async (options?: IListQueryOptions) => {
    setFetchMode({ type: 'list', options });
    await queryClient.invalidateQueries({ queryKey: qk.leads.base(scope) });
  }, [queryClient, scope]);

  const fetchLeadsByStage = React.useCallback(async (stage: Stage) => {
    setFetchMode({ type: 'stage', stage });
  }, []);

  const searchLeads = React.useCallback(async (query: string) => {
    setFetchMode({ type: 'search', query });
  }, []);

  const createLeadMutation = useHbcOptimisticMutation<ILead, ILeadFormData, ILead[]>({
    method: 'createLead',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.leads,
    mutationFn: async (data) => dataService.createLead(data),
    getStateKey: () => qk.leads.base(scope),
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
    onSuccessEffects: async (lead) => {
      broadcastLeadChange(lead.id, 'created', 'Lead created');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.leads.base(scope) });
    },
  });

  const updateLeadMutation = useHbcOptimisticMutation<ILead, { id: number; data: Partial<ILead> }, ILead[]>({
    method: 'updateLead',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.leads,
    mutationFn: async ({ id, data }) => dataService.updateLead(id, data),
    getStateKey: () => qk.leads.base(scope),
    applyOptimistic: (previous, vars) => (previous ?? []).map((lead) => lead.id === vars.id ? { ...lead, ...vars.data } : lead),
    onSuccessEffects: async (_updated, vars) => {
      broadcastLeadChange(vars.id, 'updated', 'Lead updated');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.leads.base(scope) });
    },
  });

  const deleteLeadMutation = useHbcOptimisticMutation<void, number, ILead[]>({
    method: 'deleteLead',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.leads,
    mutationFn: async (id) => dataService.deleteLead(id),
    getStateKey: () => qk.leads.base(scope),
    applyOptimistic: (previous, id) => (previous ?? []).filter((lead) => lead.id !== id),
    onSuccessEffects: async (_result, id) => {
      broadcastLeadChange(id, 'deleted', 'Lead deleted');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.leads.base(scope) });
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

  const getLeadById = React.useCallback(async (id: number): Promise<ILead | null> => {
    return dataService.getLeadById(id);
  }, [dataService]);

  return { leads, totalCount, isLoading, error, fetchLeads, fetchLeadsByStage, createLead, updateLead, deleteLead, searchLeads, getLeadById };
}
