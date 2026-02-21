import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { ISafetyConcern, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { safetyConcernsOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

interface IUseSafetyConcernsResult {
  concerns: ISafetyConcern[];
  isLoading: boolean;
  error: string | null;
  safetyOfficer: { name: string; email: string } | null;
  fetchConcerns: (projectCode: string) => Promise<void>;
  addConcern: (projectCode: string, concern: Partial<ISafetyConcern>) => Promise<ISafetyConcern>;
  updateConcern: (projectCode: string, concernId: number, data: Partial<ISafetyConcern>) => Promise<ISafetyConcern>;
  bySeverity: Record<string, ISafetyConcern[]>;
}

export function useSafetyConcerns(): IUseSafetyConcernsResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const safetyQuery = useQuery(safetyConcernsOptions(scope, dataService, projectCode));

  const concerns = safetyQuery.data ?? [];
  const isLoading = safetyQuery.isLoading;
  const error = safetyQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.Safety,
    queryKeys: React.useMemo(() => projectCode ? [qk.safetyConcerns.byProject(scope, projectCode)] : [], [scope, projectCode]),
  });

  const broadcastSafetyChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Safety,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const invalidate = React.useCallback(async (code: string) => {
    await queryClient.invalidateQueries({ queryKey: qk.safetyConcerns.byProject(scope, code) });
  }, [queryClient, scope]);

  const fetchConcerns = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const addConcern = React.useCallback(async (code: string, concern: Partial<ISafetyConcern>) => {
    const created = await dataService.addSafetyConcern(code, concern);
    broadcastSafetyChange(created.id, 'created', 'Safety concern added');
    await invalidate(code);
    return created;
  }, [dataService, broadcastSafetyChange, invalidate]);

  const updateConcern = React.useCallback(async (code: string, concernId: number, data: Partial<ISafetyConcern>) => {
    const updated = await dataService.updateSafetyConcern(code, concernId, data);
    broadcastSafetyChange(concernId, 'updated', 'Safety concern updated');
    await invalidate(code);
    return updated;
  }, [dataService, broadcastSafetyChange, invalidate]);

  const safetyOfficer = React.useMemo(() => {
    const first = concerns.find(c => c.safetyOfficerName);
    return first ? { name: first.safetyOfficerName, email: first.safetyOfficerEmail } : null;
  }, [concerns]);

  const bySeverity = React.useMemo(() => {
    const grouped: Record<string, ISafetyConcern[]> = {};
    concerns.forEach(c => {
      if (!grouped[c.severity]) grouped[c.severity] = [];
      grouped[c.severity].push(c);
    });
    return grouped;
  }, [concerns]);

  return { concerns, isLoading, error, safetyOfficer, fetchConcerns, addConcern, updateConcern, bySeverity };
}
