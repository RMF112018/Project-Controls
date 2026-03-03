import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ILead, ILeadFormData, IListQueryOptions, Stage } from '@hbc/models';
import type { ILeadRepository } from '@hbc/data-access';
import { queryKeys } from '../keys';

/**
 * Hook to access leads with TanStack Query.
 * Repository is injected (not imported) — enables mode-agnostic usage.
 */
export function useLeads(repo: ILeadRepository, options?: IListQueryOptions) {
  return useQuery({
    queryKey: queryKeys.leads.list(options ?? {}),
    queryFn: () => repo.getAll(options),
  });
}

export function useLeadById(repo: ILeadRepository, id: number) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: () => repo.getById(id),
    enabled: id > 0,
  });
}

export function useLeadsByStage(repo: ILeadRepository, stage: Stage) {
  return useQuery({
    queryKey: queryKeys.leads.byStage(stage),
    queryFn: () => repo.getByStage(stage),
  });
}

export function useSearchLeads(repo: ILeadRepository, query: string) {
  return useQuery({
    queryKey: queryKeys.leads.search(query),
    queryFn: () => repo.search(query),
    enabled: query.length >= 2,
  });
}

export function useCreateLead(repo: ILeadRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ILeadFormData) => repo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}

export function useUpdateLead(repo: ILeadRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ILead> }) => repo.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
    },
  });
}

export function useDeleteLead(repo: ILeadRepository) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => repo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    },
  });
}
