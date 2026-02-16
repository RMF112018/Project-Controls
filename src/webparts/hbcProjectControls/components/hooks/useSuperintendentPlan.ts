import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { ISuperintendentPlan, ISuperintendentPlanSection, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

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
  const [plan, setPlan] = React.useState<ISuperintendentPlan | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchPlan = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getSuperintendentPlan(projectCode);
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch superintendent plan');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on SuperintendentPlan entity changes from other users
  useSignalR({
    entityType: EntityType.SuperintendentPlan,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchPlan(lastProjectCodeRef.current);
      }
    }, [fetchPlan]),
  });

  // Helper to broadcast superintendent plan changes
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
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updateSection = React.useCallback(async (projectCode: string, sectionId: number, data: Partial<ISuperintendentPlanSection>) => {
    const updated = await dataService.updateSuperintendentPlanSection(projectCode, sectionId, data);
    setPlan(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...updated } : s) };
    });
    broadcastPlanChange(sectionId, 'updated', 'Superintendent plan section updated');
  }, [dataService, broadcastPlanChange]);

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
