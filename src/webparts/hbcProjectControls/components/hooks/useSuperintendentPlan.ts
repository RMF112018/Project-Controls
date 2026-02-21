import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { ISuperintendentPlan, ISuperintendentPlanSection, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { superintendentPlanOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

interface IUseSuperintendentPlanResult {
  plan: ISuperintendentPlan | null;
  isLoading: boolean;
  error: string | null;
  fetchPlan: (projectCode: string) => Promise<void>;
  updateSection: (projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>) => Promise<void>;
  completionPercentage: number;
  incompleteSections: string[];
}

export function useSuperintendentPlan(): IUseSuperintendentPlanResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const planQuery = useQuery(superintendentPlanOptions(scope, dataService, projectCode));

  const plan = planQuery.data ?? null;
  const isLoading = planQuery.isLoading;
  const error = planQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.SuperintendentPlan,
    queryKeys: React.useMemo(() => projectCode ? [qk.superintendent.byProject(scope, projectCode)] : [], [scope, projectCode]),
  });

  const broadcastPlanChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.SuperintendentPlan,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const fetchPlan = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const updateSection = React.useCallback(async (code: string, sectionId: number, data: Partial<ISuperintendentPlanSection>) => {
    await dataService.updateSuperintendentPlanSection(code, sectionId, data);
    broadcastPlanChange(sectionId, 'updated', 'Superintendent plan section updated');
    await queryClient.invalidateQueries({ queryKey: qk.superintendent.byProject(scope, code) });
  }, [dataService, broadcastPlanChange, queryClient, scope]);

  const completionPercentage = React.useMemo(() => {
    if (!plan || plan.sections.length === 0) return 0;
    const complete = plan.sections.filter(s => s.isComplete).length;
    return Math.round((complete / plan.sections.length) * 100);
  }, [plan]);

  const incompleteSections = React.useMemo(() => {
    if (!plan) return [];
    return plan.sections.filter(s => !s.isComplete).map(s => s.sectionTitle);
  }, [plan]);

  return { plan, isLoading, error, fetchPlan, updateSection, completionPercentage, incompleteSections };
}
