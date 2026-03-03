import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IScheduleActivity, IScheduleImport } from '@hbc/models';
import type { IScheduleRepository } from '@hbc/data-access';
import { queryKeys } from '../keys';

export function useScheduleActivities(repo: IScheduleRepository, projectCode: string) {
  return useQuery({
    queryKey: queryKeys.schedule.activities(projectCode),
    queryFn: () => repo.getActivities(projectCode),
    enabled: !!projectCode,
  });
}

export function useScheduleMetrics(repo: IScheduleRepository, projectCode: string) {
  return useQuery({
    queryKey: queryKeys.schedule.metrics(projectCode),
    queryFn: () => repo.getMetrics(projectCode),
    enabled: !!projectCode,
  });
}

export function useScheduleImports(repo: IScheduleRepository, projectCode: string) {
  return useQuery({
    queryKey: queryKeys.schedule.imports(projectCode),
    queryFn: () => repo.getImports(projectCode),
    enabled: !!projectCode,
  });
}

export function useImportScheduleActivities(repo: IScheduleRepository, projectCode: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activities, importMeta }: { activities: IScheduleActivity[]; importMeta: Partial<IScheduleImport> }) =>
      repo.importActivities(projectCode, activities, importMeta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule.all(projectCode) });
    },
  });
}
